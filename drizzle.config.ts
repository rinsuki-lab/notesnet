import { defineConfig } from "drizzle-kit"

export default defineConfig({
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    schema: "./src/server/db/schema.ts",
    out: "./src/server/db/",
    casing: "snake_case",
})
