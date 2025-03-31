import { Hono } from "hono";
import { contests } from "../data/contests";

const app = new Hono()

    .get("/contests", async (ctx) => {
        return ctx.json({ contests }, 200);
    })

    .get("mkc", async (ctx) => {
        return ctx.json({ message: "Hello from mkc" }, 200);
    })

export default app;
