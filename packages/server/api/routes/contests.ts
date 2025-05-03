// server/routes/contests.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getMatches, getContests, getContestDetails } from "../lib/matches";

const contestsRoutes = new Hono()
  .get("/matches", zValidator("json", z.object({ name: z.string().optional() })), async (ctx) => {
    const { name } = ctx.req.valid("json");
    console.log("contast rpute name", name);
    const allMatches = await getMatches();
    const filteredMatches = name ? (await allMatches).filter(m => m.name.includes(name)) : allMatches;
    
    return ctx.json(filteredMatches, 200);
  })
  .get("/contests", async (ctx) => {
    const allContests = await getContests();
    
    return ctx.json(allContests, 200);
  })
  .get("/contests/:contestId", zValidator("param", z.object({ contestId: z.string() })), async (ctx) => {
    const { contestId } = ctx.req.valid("param");
    const contest = await getContestDetails(contestId);
    return ctx.json(contest, 200);
  });

export default contestsRoutes;