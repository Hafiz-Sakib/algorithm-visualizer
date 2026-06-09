import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite"; // add this

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  plugins: [nitro()], // add this
});
