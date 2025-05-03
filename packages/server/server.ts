// server/server.ts
import { Hono } from "hono";
import { logger } from "hono/logger";
import api from "./api";
import { syncMatchesAndCreateContests, getMatchData, getMatches, getContests } from "./api/lib/matches";
import { ensureEnv } from "./env";
import cronJobs from "./api/middlewares/cron";
import { suiClient } from "./api/sui/client";

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

app.use(cronJobs);
app.route("/api", api);

// Add endpoints
app.get("/api/match-data", async (c) => {
  try {
    const contestId = c.req.query("contestId"); // Get contestId from query params
    console.log(`Fetching match data for contestId: ${contestId}`);
    const data = await getMatchData(contestId); // Pass contestId to getMatchData
    if (!data || data.length === 0) {
      return c.json({ error: "No match data available for this contest" }, 404);
    }
    return c.json(data);
  } catch (error) {
    c.log("Error fetching match data:", error);
    return c.json({ error: "Failed to fetch match data" }, 500);
  }
});

app.get("/api/matches", async (c) => {
  try {
    const matches = await getMatches();
    return c.json(matches);
  } catch (error) {
    c.log('Error fetching matches:', error);
    return c.json({ error: 'Failed to fetch matches' }, 500);
  }
});

app.get("/api/contests", async (c) => {
  
  try {
    const contests = await getContests();
    
    return c.json([...contests]);
  } catch (error) {
    c.log('Error fetching contests:', error);
    return c.json({ error: 'Failed to fetch contests' }, 500);
  }
});
app.get("/api/contest/:contestId/transactions", async (c) => {
  const contestId = c.req.param("contestId").toLowerCase();
  try {
    const txs = await suiClient.queryTransactionBlocks({
      filter: { InputObject: contestId },
      options: { showEffects: true },
    });
    return c.json(txs.data);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return c.json({ error: "Failed to fetch transactions" }, 500);
  }
});

app.get("*", (c) => c.html(html));

// Sync on startup
syncMatchesAndCreateContests().catch((error) => log('Sync failed:', error));

export default {
  ...app,
  maxRequestBodySize: 4 * 1024 * 1024, // 4 MB
};

declare module "hono" {
  interface Context {
    log: (...data: any[]) => void;
  }
}