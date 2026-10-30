import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// O mathjax-full (usado pelo rehype-mathjax) espera que o bundler defina
// PACKAGE_VERSION; sem isso ele cai num eval('require') que quebra no browser.
const mathjaxVersion = JSON.parse(
  readFileSync(
    new URL("./node_modules/mathjax-full/package.json", import.meta.url),
    "utf8",
  ),
).version as string;

export default defineConfig({
  plugins: [react()],
  define: { PACKAGE_VERSION: JSON.stringify(mathjaxVersion) },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
