import { randomUUID } from "node:crypto";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { getEnv } from "@/config/env.js";
import { decodeAccessTokenUnsafe, signAccessToken } from "@/lib/tokens.js";
import {
  generateRefreshToken,
  refreshTokenKey,
  timingSafeEqualStr,
} from "@/lib/refreshToken.js";
import { authTokensSchema, refreshBodySchema } from "@/schemas/auth.js";
import { errorResponseSchema } from "@/schemas/errors.js";

export const refreshRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/refresh",
    {
      schema: {
        tags: ["auth"],
        summary: "Rotaciona tokens",
        description:
          "Recebe o par (accessToken possivelmente expirado + refreshToken) e retorna um novo par. Cada refresh token é uso-único: a chave antiga é apagada antes da nova ser criada.",
        body: refreshBodySchema,
        response: { 200: authTokensSchema, 401: errorResponseSchema },
      },
    },
    async (request, reply) => {
      const { accessToken, refreshToken } = request.body;
      const env = getEnv();

      let userId: string;
      let tokenId: string;
      try {
        const payload = decodeAccessTokenUnsafe(accessToken);
        userId = payload.userId;
        tokenId = payload.tokenId;
      } catch {
        return reply.code(401).send({ error: "invalid_token" });
      }

      const stored = await app.tokenStore.get(refreshTokenKey(userId, tokenId));
      if (!stored || !timingSafeEqualStr(stored, refreshToken)) {
        return reply.code(401).send({ error: "invalid_token" });
      }

      await app.tokenStore.del(refreshTokenKey(userId, tokenId));

      const newTokenId = randomUUID();
      const newAccessToken = await signAccessToken(
        { userId, tokenId: newTokenId },
        { secret: env.JWT_SECRET, ttlSeconds: env.JWT_ACCESS_TTL_SECONDS },
      );
      const newRefreshToken = generateRefreshToken();

      await app.tokenStore.set(
        refreshTokenKey(userId, newTokenId),
        newRefreshToken,
        env.REFRESH_TTL_SECONDS,
      );

      return reply.code(200).send({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    },
  );
};
