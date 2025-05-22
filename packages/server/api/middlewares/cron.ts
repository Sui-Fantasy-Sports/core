import { createMiddleware } from "hono/factory";
import matches from "../lib/matches";

const jobs: Record<string, { fn: () => Promise<void>, interval: number }> = {
  syncMatches: {
    fn: matches.syncMatchesAndCreateContests,
    interval: 5 * 60 * 1000, // 5 minutes
  },
  checkCompletedMatches: {
    fn: matches.checkAndCompleteContests,
    interval: 30 * 60 * 1000, // 30 minutes
  },
  updateMatchStatuses: {
    fn: async () => {
      console.log(`Starting updateMatchStatuses cron job at ${new Date().toISOString()}`);
      try {
        await matches.updateMatchStatuses();
        console.log(`updateMatchStatuses completed successfully at ${new Date().toISOString()}`);
      } catch (error) {
        console.error(`Error in updateMatchStatuses at ${new Date().toISOString()}:`, error);
        throw error; // Ensure errors are logged and visible
      }
    },
    interval: 2 * 60 * 1000, // 2 minutes
  },
};

const cronRecord: Record<string, number> = {};

const cronJobs = createMiddleware(async (ctx, next) => {
  const now = Date.now();

  console.log('Cron jobs middleware triggered at:', new Date().toISOString());
  for (const [name, job] of Object.entries(jobs)) {
    if (!cronRecord[name] || now - cronRecord[name] >= job.interval) {
      cronRecord[name] = now;
      try {
        await job.fn();
        console.log(`Cron job ${name} executed successfully at ${new Date().toISOString()}`);
      } catch (error) {
        console.error(`Error in cron job ${name} at ${new Date().toISOString()}:`, error);
      }
    } else {
      console.log(`Skipping cron job ${name}, last run: ${new Date(cronRecord[name]).toISOString()}, next run in: ${Math.ceil((job.interval - (now - cronRecord[name])) / 1000)}s`);
    }
  }

  await next();
});

export default cronJobs;