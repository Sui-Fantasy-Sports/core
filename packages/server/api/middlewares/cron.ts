// packages/server/middleware/cron.ts
import { Context, Next } from "hono";
import { syncMatchesAndCreateContests } from "../lib/matches";

// Define the jobs
const jobs: Record<string, { fn: () => Promise<void>, interval: number }> = {
  syncMatches: {
    fn: syncMatchesAndCreateContests,
    interval: 5 * 60 * 1000, // 5 minutes in milliseconds
  },
};

// Track the last execution time of each job
const cronRecord: Record<string, number> = {};

// Middleware to run jobs on each request (optional, can be removed if using background interval)
export const cronMiddleware = async (c: Context, next: Next) => {
  for (const [jobName, job] of Object.entries(jobs)) {
    const lastRun = cronRecord[jobName] || 0;
    if (Date.now() - lastRun > job.interval) {
      console.log(`Running job: ${jobName}`);
      cronRecord[jobName] = Date.now();
      try {
        await job.fn();
      } catch (error) {
        console.error(`Job ${jobName} failed:`, error);
      }
    }
  }
  await next();
};

// Background interval to ensure jobs run even without requests
export const startCronJobs = () => {
  for (const [jobName, job] of Object.entries(jobs)) {
    setInterval(async () => {
      console.log(`Running scheduled job: ${jobName}`);
      try {
        await job.fn();
      } catch (error) {
        console.error(`Scheduled job ${jobName} failed:`, error);
      }
    }, job.interval);

    // Run immediately on startup
    (async () => {
      console.log(`Initial run of job: ${jobName}`);
      try {
        await job.fn();
      } catch (error) {
        console.error(`Initial run of job ${jobName} failed:`, error);
      }
    })();
  }
};