import fp from "fastify-plugin";
import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from "fastify";
import { getEnv } from "@/config/env.js";
import { verifyAccessToken, type AccessTokenPayload } from "@/lib/tokens.js";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: preHandlerHookHandler;
  }
  interface FastifyRequest {
    user?: AccessTokenPayload;
  }
}

function extractBearer(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

export const authPlugin = fp(async (app) => {
  const authenticate: preHandlerHookHandler = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const token = extractBearer(request.headers.authorization);
    if (!token) {
      return reply.code(401).send({ error: "unauthorized" });
    }

    try {
      const payload = await verifyAccessToken(token, { secret: getEnv().JWT_SECRET });
      request.user = payload;
    } catch {
      return reply.code(401).send({ error: "unauthorized" });
    }
  };

  app.decorate("authenticate", authenticate);
});
