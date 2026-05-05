import { serveStatic } from "@hono/node-server/serve-static"
import { Hono } from "hono"
import { etag } from "hono/etag"

import apiRouter from "./api/index.ts"

const router = new Hono()
router.route("/api", apiRouter)

const ASSET_CACHE_CONTROL = `public, immutable, max-age=${60 * 60 * 24 * 7}, stale-while-revalidate=${60 * 60 * 24 * 30}`

router.use(
    "/assets/*",
    etag({
        retainedHeaders: ["Vary"],
    }),
    serveStatic({
        root: "./dist/",
        precompressed: true,
        onFound(path, c) {
            c.header("Cache-Control", ASSET_CACHE_CONTROL)
        },
    })
)

router.use(
    "*",
    serveStatic({
        root: "./dist/",
        rewriteRequestPath() {
            return "/"
        },
        precompressed: true,
    })
)

export default router
