import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { meResponseSchema } from "@/schemas/auth.js";
import { errorResponseSchema } from "@/schemas/errors.js";

export const meRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/me",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["auth"],
        summary: "Retorna o usuário autenticado",
        security: [{ bearerAuth: [] }],
        response: { 200: meResponseSchema, 401: errorResponseSchema },
      },
    },
    async (request, reply) => {
      const userId = request.user?.userId;
      if (!userId) {
        return reply.code(401).send({ error: "unauthorized" });
      }

      const user = await app.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, nome: true },
      });

      if (!user) {
        return reply.code(401).send({ error: "unauthorized" });
      }

      return reply.code(200).send(user);
    },
  );
};
