import type { CodegenConfig } from "@graphql-codegen/cli"
import { printSchema } from "graphql"

import { schema } from "./src/server/handlers/api/v1/graphql/schema.ts"

const config: CodegenConfig = {
    schema: printSchema(schema),
    documents: "src/client/**/*.tsx",
    generates: {
        "./src/client/api/graphql/": {
            preset: "client",
        },
        "./schema.graphql": {
            plugins: ["schema-ast"],
        },
    },
    ignoreNoDocuments: true,
}

export default config
