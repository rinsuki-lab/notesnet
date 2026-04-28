import SchemaBuilder from "@pothos/core"
import { type AuthorizedResult } from "../../../../extractors/access_token.ts"
import { relations } from "../../../../db/relations.ts"
import DrizzlePlugin from "@pothos/plugin-drizzle";
import { db } from "../../../../db/index.ts";
import { getTableConfig } from "drizzle-orm/pg-core";
import SimpleObjectsPlugin from "@pothos/plugin-simple-objects"
import { JSONResolver, DateTimeISOResolver } from "graphql-scalars"

export type OurContext = {
    authorized: AuthorizedResult
}

export const builder = new SchemaBuilder<{
    Scalars: {
        JSON: {
            Input: unknown,
            Output: unknown,
        },
        DateTime: {
            Input: string,
            Output: Date,
        }
    }
    Context: OurContext,
    DrizzleRelations: typeof relations,
}>({
    plugins: [DrizzlePlugin, SimpleObjectsPlugin],
    drizzle: {
        client: db,
        getTableConfig,
        relations,
    }
})

builder.addScalarType("JSON", JSONResolver)
builder.addScalarType("DateTime", DateTimeISOResolver)