import { cors } from "hono/cors";
import { createContestTransaction } from "./lib/sui/index";
import { getMatches, getContests } from "./lib/matches";
import { Hono } from "hono";

const app = new Hono()
    .use(
        cors({
            origin: (origin, ctx) => {
                const selfUrl = new URL(ctx.req.url);
                const selfOrigin = selfUrl.origin;
                if (!origin || origin === selfOrigin) {
                    return origin;
                }
                return "";
            },
            credentials: true,
            allowMethods: ["POST", "GET", "PATCH", "OPTIONS"],
            allowHeaders: ["Content-Type", "Authorization"],
        }),
    )
    .post("/create-contest", async (c) => {
        try {
            const { matchName, players, tiers, startTime } = await c.req.json();
            if (!matchName || !players || !tiers || startTime === undefined) {
                return c.json({ success: false, error: "Missing required fields" }, 400);
            }
            const output = await createContestTransaction(matchName, players, tiers, startTime);
            return c.json(
                {
                    success: true,
                    transaction: output,
                },
                200
            );
        } catch (error) {
            console.error("Transaction failed:", error);
            return c.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "An unknown error occurred",
                },
                500
            );
        }
    })
    .get("/matches", (c) => {
        return c.json(
            {
                success: true,
                matches: getMatches(),
                contests: getContests(),
                
            },
            200
        );
    });

export default app;

export type API = typeof app;
