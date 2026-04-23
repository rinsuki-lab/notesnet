import type { CodegenConfig } from "@graphql-codegen/cli"

const config: CodegenConfig = {
    schema: "schema.graphql",
    documents: "src/client/**/*.tsx",
    generates: {
        "./src/client/api/graphql/": {
            preset: "client",
        }
    },
    ignoreNoDocuments: true,
}

export default config