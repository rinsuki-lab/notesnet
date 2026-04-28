import { Hono } from "hono"
import { serveStatic } from "@hono/node-server/serve-static"

import apiRouter from "./api/index.ts"
import { readFile } from "node:fs/promises"

const router = new Hono()
router.route("/api", apiRouter)
router.use("/assets/*", serveStatic({
    root: "./dist/",
    precompressed: true,
}))

const indexHtml = await readFile("./dist/index.html", "utf-8")
router.get("*", c => c.html(indexHtml))

export default router
