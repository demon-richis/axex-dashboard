import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { applyLocalServerEnv } from "./src/lib/local-server-env.ts";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ command, mode }) => {
  if (command === "serve") {
    const fileEnvironment = loadEnv(mode, process.cwd(), "");
    applyLocalServerEnv(fileEnvironment, process.env);
  }

  return {
    plugins: [tanstackStart({ server: { entry: "server" } }), viteReact(), tailwindcss()],
    resolve: { tsconfigPaths: true },
    server: { host: "0.0.0.0", port: 3000 },
  };
});
