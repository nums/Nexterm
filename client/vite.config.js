import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import * as path from "path";

export default defineConfig({
    plugins: [react()],
    css: {
        preprocessorOptions: {
            sass: {
                api: "modern"
            }
        }
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
        }
    },
    server: {
        proxy: {
            "/api": process.env.NODE_ENV == 'production' ? "http://localhost:6989" : `http://${process.env.SERVER_DOMAIN}:${process.env.SERVER_PORT}`
        }
    }
});
