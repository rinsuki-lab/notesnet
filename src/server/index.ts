import { writeFile } from "node:fs/promises"

import { serve } from "@hono/node-server"
import { generateSpecs } from "hono-openapi"

import app from "./handlers/index.ts"
import { execFile, spawn } from "node:child_process"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)

if (process.argv.includes("--dump-schema-and-exit")) {
    const spec = await generateSpecs(app, {
        documentation: {
            info: {
                title: "NotesNet API",
                version: "0.0.0",
            },
        },
    })
    await writeFile("openapi.json", JSON.stringify(spec, null, 2))
    process.exit(0)
}

if (process.env.NOTESNET_RUN_MIGRATION) {
    console.log("Running database migrations...")
    const p = spawn("./notesnet", ["--migrate-and-exit"], {
        shell: false,
        stdio: "inherit",
    })
    const code = await new Promise<number>((resolve, reject) => {
        p.once("close", resolve)
        p.once("error", reject)
    })
    if (code !== 0) {
        process.exit(code)
    }
}

const server = serve(
    {
        fetch: app.fetch,
    },
    info => {
        console.log(`Listening on http://${info.address}:${info.port}`)
    }
)

function gracefulShutdown() {
    console.log("Shutting down gracefully...")
    server.close()
}

process.on("SIGTERM", gracefulShutdown)
process.on("SIGINT", gracefulShutdown)
