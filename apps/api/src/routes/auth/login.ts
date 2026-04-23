import { randomUUID } from "node:crypto";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { getEnv } from "@/config/env.js";
import { verifyPassword } from "@/lib/password.js";
import { signAccessToken } from "@/lib/tokens.js";
import { generateRefreshToken, refreshTokenKey } from "@/lib/refreshToken.js";
import { authTokensSchema, loginBodySchema } from "@/schemas/auth.js";
import { errorResponseSchema } from "@/schemas/errors.js";

export const loginRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/login",
    {
      schema: {
        tags: ["auth"],
        summary: "Login com email e senha",
        description:
          "Retorna um par de tokens (access JWT de curta vida + refresh opaco). Resposta 401 genérica para email inexistente ou senha inválida.",
        body: loginBodySchema,
        response: { 200: authTokensSchema, 401: errorResponseSchema },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;
      const env = getEnv();

      const user = await app.prisma.user.findUnique({ where: { email } });
      if (!user) {
        return reply.code(401).send({ error: "invalid_credentials" });
      }

      const valid = await verifyPassword(user.passwordHash, password);
      if (!valid) {
        return reply.code(401).send({ error: "invalid_credentials" });
      }

      const tokenId = randomUUID();
      const accessToken = await signAccessToken(
        { userId: user.id, tokenId },
        { secret: env.JWT_SECRET, ttlSeconds: env.JWT_ACCESS_TTL_SECONDS },
      );
      const refreshToken = generateRefreshToken();

      await app.tokenStore.set(
        refreshTokenKey(user.id, tokenId),
        refreshToken,
        env.REFRESH_TTL_SECONDS,
      );

      return reply.code(200).send({ accessToken, refreshToken });
    },
  );
};
