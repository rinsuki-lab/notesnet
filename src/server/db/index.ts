import { drizzle } from "drizzle-orm/node-postgres"

import { relations } from "./relations.ts"

export const db = drizzle(process.env.DATABASE_URL!, {
    casing: "snake_case",
    logger: process.env.NODE_ENV !== "production",
    relations,
})
