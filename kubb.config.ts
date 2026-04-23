import { defineConfig } from "@kubb/core";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginZod } from "@kubb/plugin-zod";
import { pluginClient } from "@kubb/plugin-client";
import { pluginReactQuery } from "@kubb/plugin-react-query";

export default defineConfig({
  root: ".",
  input: {
    path: "./apps/api/openapi.json",
  },
  output: {
    path: "./apps/web/src/generated",
    clean: true,
  },
  plugins: [
    pluginOas({ validate: true }),
    pluginTs({
      output: { path: "types" },
      group: { type: "tag", name: ({ group }) => `${group}Controller` },
    }),
    pluginZod({
      output: { path: "zod" },
      typed: true,
      group: { type: "tag", name: ({ group }) => `${group}Zod` },
    }),
    pluginClient({
      output: { path: "clients" },
      importPath: "@/lib/httpClient",
      group: { type: "tag", name: ({ group }) => `${group}Client` },
    }),
    pluginReactQuery({
      output: { path: "hooks" },
      client: { importPath: "@/lib/httpClient" },
      group: { type: "tag", name: ({ group }) => `${group}Hooks` },
    }),
  ],
});
