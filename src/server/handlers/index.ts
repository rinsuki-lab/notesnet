import { readFile } from "node:fs/promises"

import { serveStatic } from "@hono/node-server/serve-static"
import { Hono } from "hono"

import apiRouter from "./api/index.ts"

const router = new Hono()
router.route("/api", apiRouter)
router.use(
    "/assets/*",
    serveStatic({
        root: "./dist/",
        precompressed: true,
    })
)

const indexHtml = await readFile("./dist/index.html", "utf-8")
router.get("*", c => c.html(indexHtml))

export default router
