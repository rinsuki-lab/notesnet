import { serve } from "@hono/node-server";
import { generateSpecs } from "hono-openapi";
import { writeFile } from "node:fs/promises";
import app from "./handlers/index.ts"


if (process.argv.includes("--dump-schema-and-exit")) {
    const spec = await generateSpecs(app, {
        documentation: {
            info: {
                title: "NotesNet API",
                version: "0.0.0",
            }
        }
    })
    await writeFile("openapi.json", JSON.stringify(spec, null, 2))
    process.exit(0)
}

serve({
    fetch: app.fetch,
}, info => {
    console.log(`Listening on http://${info.address}:${info.port}`);
})