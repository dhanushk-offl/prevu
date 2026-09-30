import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootPkg = JSON.parse(readFileSync(resolve(__dirname, "../../package.json"), "utf8"));

export default defineConfig({
  plugins: [react()],
  define: {
    __PREVU_VERSION__: JSON.stringify(rootPkg.version),
  },
  server: {
    port: 5174,
  },
});
