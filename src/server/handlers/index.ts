import { Hono } from "hono"

import apiRouter from "./api/index.ts"

const router = new Hono()
router.route("/api", apiRouter)

export default router