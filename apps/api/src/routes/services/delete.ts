import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { serviceIdParamsSchema } from "@/schemas/services.js";
import { errorResponseSchema } from "@/schemas/errors.js";

export const deleteServiceRoute: FastifyPluginAsyncZod = async (app) => {
  app.delete(
    "/:id",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["services"],
        summary: "Desativa um serviço (soft delete)",
        description:
          "Marca o serviço como inativo. Idempotente — chamar de novo no mesmo id ainda retorna 204. Para reativar, use PUT /:id com { active: true }.",
        security: [{ bearerAuth: [] }],
        params: serviceIdParamsSchema,
        response: {
          204: z.null(),
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await app.prisma.service.update({
          where: { id: request.params.id },
          data: { active: false },
        });
        return reply.code(204).send(null);
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2025"
        ) {
          return reply.code(404).send({ error: "service_not_found" });
        }
        throw err;
      }
    },
  );
};
