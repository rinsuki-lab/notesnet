import { defineConfig } from "orval"

export default defineConfig({
    internal: {
        output: {
            mode: "split",
            target: "src/client/api/internal/index.ts",
            schemas: "src/client/api/internal/schemas",
            client: "react-query",
            override: {
                mutator: {
                    path: "./src/client/api/client.ts",
                    name: "customFetch",
                }
            }
        },
        input: {
            target: "./openapi.json",
        }
    }
})