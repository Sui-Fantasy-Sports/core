// server/api/index.ts
import { Hono } from "hono";
import contestsRoutes from "../api/routes/contests";


const api = new Hono()
    .route("/", contestsRoutes);

export default api;

export type API = typeof api;
