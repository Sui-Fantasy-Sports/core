// packages/server/server.ts
import { Hono } from "hono";
import { logger } from "hono/logger";
import api from "./api";
import { ensureEnv } from "./env";
import { cronMiddleware, startCronJobs } from "../server/api/middlewares/cron";

ensureEnv();

const htmlFile = Bun.file("./template.html");
const html = await htmlFile.text();

const app = new Hono();

const log = (...data: any[]) => console.log(...data);

app.use(logger(log));
app.use((ctx, next) => {
  ctx.log = log;
  return next();
});
app.use(cronMiddleware);


app.route("/api", api);

app.get("*", (c) => c.html(html));

// Start background cron jobs
startCronJobs();

export default {
  ...app,
  maxRequestBodySize: 4 * 1024 * 1024, // 4 MB
};

declare module "hono" {
  interface Context {
    log: (...data: any[]) => void;
  }
}