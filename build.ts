import { cpSync, existsSync } from "node:fs";
import tailwindPlugin from "bun-plugin-tailwind";

const result = await Bun.build({
  entrypoints: ["./src/index.html"],
  outdir: "./dist",
  target: "browser",
  sourcemap: "external",
  minify: true,
  define: { "process.env.NODE_ENV": '"production"' },
  env: "BUN_PUBLIC_*",
  plugins: [tailwindPlugin],
});

if (!result.success) {
  console.error(result.logs);
  process.exit(1);
}

if (existsSync("./public")) {
  cpSync("./public", "./dist", { recursive: true });
}
