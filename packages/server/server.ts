// server/server.ts
import { Hono } from "hono";
import { logger } from "hono/logger";
import api from "./api";
import { syncMatchesAndCreateContests, getMatchData, getMatches, getContests } from "./api/lib/matches";
import { ensureEnv } from "./env";
import cronJobs from "./api/middlewares/cron";
import { suiClient } from "./api/sui/client";
import { Player, IPlayer } from "./api/data/player"; // Import Player model
import path from "path";
import { fileURLToPath } from "url";
import staticRequestsHandler from "./api/middlewares/staticRequestsHandler";

const isProd =
  process.env.NODE_ENV === "production" || process.env.NODE_ENV === "prod";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlFile = Bun.file(
  path.join(__dirname, isProd ? "dist" : "", "index.html")
);
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

// New endpoint to fetch player tiers
app.post("/api/players/tiers", async (c) => {
  try {
    const { playerIds } = await c.req.json();
    if (!Array.isArray(playerIds)) {
      c.log("Invalid request: playerIds must be an array");
      return c.json({ error: "playerIds must be an array" }, 400);
    }

    const players = await Player.find(
      { playerId: { $in: playerIds } },
      { playerId: 1, name: 1, tier: 1, lastUpdated: 1 }
    ).lean<IPlayer[]>().exec();

    const playerTiers = players.reduce((acc, player) => {
      acc[player.playerId] = { tier: player.tier, name: player.name };
      return acc;
    }, {} as Record<string, { tier: number; name: string }>);

    return c.json({ status: "success", data: playerTiers });
  } catch (error) {
    c.log("Error fetching player tiers:", error);
    return c.json({ error: "Failed to fetch player tiers" }, 500);
  }
});

if (isProd) {
  log("Production mode detected, serving static files.");

  app.use("/*", staticRequestsHandler(path.join(__dirname, "dist")));

  let envEnsured = false;
  app.use((ctx, next) => {
    if (!envEnsured) {
      ensureEnv();
      envEnsured = true;
      log("Environment variables ensured.");
    }
    return next();
  });
} else {
  log("Development mode detected.");
  ensureEnv();
}


app.get("*", (c) => c.html(html));

// Sync on startup
syncMatchesAndCreateContests().catch((error) => log("Sync failed:", error));

export default {
  ...app,
  maxRequestBodySize: 4 * 1024 * 1024, // 4 MB
};

declare module "hono" {
  interface Context {
    log: (...data: any[]) => void;
  }
}