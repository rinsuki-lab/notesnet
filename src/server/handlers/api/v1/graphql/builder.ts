import SchemaBuilder from "@pothos/core"
import DrizzlePlugin from "@pothos/plugin-drizzle"
import SimpleObjectsPlugin from "@pothos/plugin-simple-objects"
import { getTableConfig } from "drizzle-orm/pg-core"
import { JSONResolver, DateTimeISOResolver } from "graphql-scalars"
import ValidationPlugin from "@pothos/plugin-validation"

import { db } from "../../../../db/index.ts"
import { relations } from "../../../../db/relations.ts"
import { type AuthorizedResult } from "../../../../extractors/access_token.ts"

export type OurContext = {
    authorized: AuthorizedResult
}

export const builder = new SchemaBuilder<{
    Scalars: {
        JSON: {
            Input: unknown
            Output: unknown
        }
        DateTime: {
            Input: string
            Output: Date
        }
    }
    Context: OurContext
    DrizzleRelations: typeof relations
}>({
    plugins: [DrizzlePlugin, SimpleObjectsPlugin, ValidationPlugin],
    drizzle: {
        client: db,
        getTableConfig,
        relations,
    },
})

builder.addScalarType("JSON", JSONResolver)
builder.addScalarType("DateTime", DateTimeISOResolver)
