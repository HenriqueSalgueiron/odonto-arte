import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { decodeAccessTokenUnsafe } from "@/lib/tokens.js";
import { refreshTokenKey } from "@/lib/refreshToken.js";
import { logoutBodySchema } from "@/schemas/auth.js";

export const logoutRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/logout",
    {
      schema: {
        tags: ["auth"],
        summary: "Encerra a sessão (idempotente)",
        description:
          "Apaga a chave do refresh token no Redis. Idempotente: retorna 204 mesmo se o access token for malformado.",
        body: logoutBodySchema,
        response: { 204: z.null() },
      },
    },
    async (request, reply) => {
      const { accessToken } = request.body;

      try {
        const { userId, tokenId } = decodeAccessTokenUnsafe(accessToken);
        await app.tokenStore.del(refreshTokenKey(userId, tokenId));
      } catch {
        // logout é idempotente: access token malformado não derruba, apenas encerra.
      }

      return reply.code(204).send(null);
    },
  );
};
