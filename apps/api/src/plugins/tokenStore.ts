import fp from "fastify-plugin";
import { getEnv } from "@/config/env.js";
import { createRedisTokenStore, type TokenStore } from "@/lib/tokenStore.js";

declare module "fastify" {
  interface FastifyInstance {
    tokenStore: TokenStore;
  }
}

export type TokenStorePluginOptions = {
  tokenStore?: TokenStore;
};

export const tokenStorePlugin = fp<TokenStorePluginOptions>(async (app, opts) => {
  const store =
    opts.tokenStore ??
    createRedisTokenStore({
      url: getEnv().UPSTASH_REDIS_REST_URL,
      token: getEnv().UPSTASH_REDIS_REST_TOKEN,
    });

  app.decorate("tokenStore", store);
});
