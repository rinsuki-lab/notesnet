import { Hono } from "hono"

import internalRouter from "./internal/index.ts"
import v1Router from "./v1/index.ts"

const router = new Hono()

router.route("/internal", internalRouter)
router.route("/v1", v1Router)
router.all("*", c => c.text("Not Found", 404))

export default router
