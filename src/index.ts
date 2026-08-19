import { serve } from "bun";
import index from "./index.html";

const server = serve({
  routes: {
    "/robots.txt": Bun.file("public/robots.txt", { type: "text/plain" }),
    "/sitemap.xml": Bun.file("public/sitemap.xml", { type: "application/xml" }),
    "/logo.png": Bun.file("public/logo.png", { type: "image/png" }),
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
