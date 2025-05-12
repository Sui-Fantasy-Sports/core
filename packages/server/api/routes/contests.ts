import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getMatches, getContests, getContestDetails } from "../lib/matches";

const contestsRoutes = new Hono()
  .get("/matches", zValidator("query", z.object({ name: z.string().optional(), seriesId: z.string().optional() })), async (ctx) => {
    const { name, seriesId } = ctx.req.valid("query");
    console.log("Matches route - name:", name, "seriesId:", seriesId);
    const allMatches = await getMatches(seriesId);
    const filteredMatches = name ? allMatches.filter(m => m.name.includes(name)) : allMatches;
    return ctx.json(filteredMatches, 200);
  })
  .get("/contests", zValidator("query", z.object({ seriesId: z.string().optional() })), async (ctx) => {
    const { seriesId } = ctx.req.valid("query");
    console.log("Contests route - seriesId:", seriesId);
    const allContests = await getContests(seriesId);
    return ctx.json(allContests, 200);
  })
  .get("/contests/:contestId", zValidator("param", z.object({ contestId: z.string() })), async (ctx) => {
    const { contestId } = ctx.req.valid("param");
    const contest = await getContestDetails(contestId);
    return ctx.json(contest, 200);
  });

export default contestsRoutes;