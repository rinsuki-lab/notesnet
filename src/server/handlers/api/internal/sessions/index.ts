import { Hono } from "hono"

import createRouter from "./create.ts"

const router = new Hono()

router.route("/create", createRouter)

export default router
