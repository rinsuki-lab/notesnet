import { Hono } from "hono"
import accountsRouter from "./accounts/index.ts"
import sessionsRouter from "./sessions/index.ts"

const router = new Hono()

router.route("/accounts", accountsRouter)
router.route("/sessions", sessionsRouter)

export default router