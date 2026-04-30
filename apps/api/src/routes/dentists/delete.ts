import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { dentistIdParamsSchema } from "@/schemas/dentists.js";
import { errorResponseSchema } from "@/schemas/errors.js";

export const deleteDentistRoute: FastifyPluginAsyncZod = async (app) => {
  app.delete(
    "/:id",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["dentists"],
        summary: "Desativa um dentista (soft delete)",
        description:
          "Marca o dentista como inativo. Idempotente — chamar de novo no mesmo id ainda retorna 204. Para reativar, use PUT /:id com { active: true }.",
        security: [{ bearerAuth: [] }],
        params: dentistIdParamsSchema,
        response: {
          204: z.null(),
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await app.prisma.dentist.update({
          where: { id: request.params.id },
          data: { active: false },
        });
        return reply.code(204).send(null);
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2025"
        ) {
          return reply.code(404).send({ error: "dentist_not_found" });
        }
        throw err;
      }
    },
  );
};
