import { serveStatic } from "@hono/node-server/serve-static"
import { Hono } from "hono"

import apiRouter from "./api/index.ts"

const router = new Hono()
router.route("/api", apiRouter)
router.use(
    "*",
    serveStatic({
        root: "./dist/",
        rewriteRequestPath(path) {
            if (path.startsWith("/assets/")) return path
            return "/"
        },
        precompressed: true,
    })
)

export default router
