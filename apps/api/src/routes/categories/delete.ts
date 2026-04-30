import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { categoryIdParamsSchema } from "@/schemas/categories.js";
import { errorResponseSchema } from "@/schemas/errors.js";

export const deleteCategoryRoute: FastifyPluginAsyncZod = async (app) => {
  app.delete(
    "/:id",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["categories"],
        summary: "Remove uma categoria",
        description:
          "Hard delete. Serviços associados ficam com categoryId = null (FK ON DELETE SET NULL). A confirmação no frontend usa o serviceCount retornado em GET /categories.",
        security: [{ bearerAuth: [] }],
        params: categoryIdParamsSchema,
        response: {
          204: z.null(),
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await app.prisma.category.delete({
          where: { id: request.params.id },
        });
        return reply.code(204).send(null);
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2025"
        ) {
          return reply.code(404).send({ error: "category_not_found" });
        }
        throw err;
      }
    },
  );
};
