import { serve } from "@hono/node-server";
import { drizzle } from "drizzle-orm/node-postgres";
import { Hono } from "hono";
import { describeRoute, generateSpecs, openAPIRouteHandler, resolver, validator } from "hono-openapi";
import { writeFile } from "node:fs/promises";
import * as v from "valibot"
import { accountsTable, personasTable, scopesTable } from "./db/schema.ts";
import argon2 from "argon2"
import { DrizzleQueryError } from "drizzle-orm";
import { isConstraintError } from "./db/utils.ts";
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