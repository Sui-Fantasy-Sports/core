import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator"
import { z } from "zod";

const app = new Hono()

    .post("/new",
        zValidator("json", z.object({
            name: z.string()
        }))
        , async (ctx) => {
            ctx.log(ctx.req.valid("json"))
            return ctx.json({}, 200);
        })

export default app;
