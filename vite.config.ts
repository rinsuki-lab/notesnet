import type { UserConfig } from "vite";

export default {
    server: {
        proxy: {
            "/api": {
                target: "http://localhost:3000",
            }
        }
    }
} satisfies UserConfig;