import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  categoryIdParamsSchema,
  categorySchema,
} from "@/schemas/categories.js";
import { errorResponseSchema } from "@/schemas/errors.js";
import { serializeCategory } from "@/routes/categories/serializer.js";

export const getCategoryRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/:id",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["categories"],
        summary: "Busca uma categoria pelo id",
        security: [{ bearerAuth: [] }],
        params: categoryIdParamsSchema,
        response: {
          200: categorySchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const category = await app.prisma.category.findUnique({
        where: { id: request.params.id },
        include: { _count: { select: { services: true } } },
      });
      if (!category) {
        return reply.code(404).send({ error: "category_not_found" });
      }
      return reply.code(200).send(serializeCategory(category));
    },
  );
};
