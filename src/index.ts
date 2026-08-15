import { serve } from "bun";
import index from "./index.html";

const server = serve({
  routes: {
    "/logo.png": Bun.file("public/logo.png"),
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
