import { createMiddleware } from "hono/factory";
import { syncMatchesAndCreateContests, checkAndCompleteContests } from "../lib/matches";

const jobs: Record<string, { fn: () => Promise<void>, interval: number }> = {
  syncMatches: {
    fn: syncMatchesAndCreateContests,
    interval: 5 * 60 * 1000, // 5 minutes
  },
  checkCompletedMatches: {
    fn: checkAndCompleteContests,
    interval: 30 * 60 * 1000, // 30 minutes
  },
};

const cronRecord: Record<string, number> = {};

const cronJobs = createMiddleware(async (ctx, next) => {
  const now = Date.now();

  for (const [name, job] of Object.entries(jobs)) {
    if (!cronRecord[name] || now - cronRecord[name] >= job.interval) {
      cronRecord[name] = now;
      try {
        await job.fn();
        console.log(`Cron job ${name} executed successfully at ${new Date().toISOString()}`);
      } catch (error) {
        console.error(`Error in cron job ${name} at ${new Date().toISOString()}:`, error);
      }
    }
  }

  await next();
});

export default cronJobs;