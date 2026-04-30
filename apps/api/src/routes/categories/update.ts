import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { Prisma } from "@prisma/client";
import {
  categoryIdParamsSchema,
  categorySchema,
  updateCategoryBodySchema,
} from "@/schemas/categories.js";
import { errorResponseSchema } from "@/schemas/errors.js";
import { serializeCategory } from "@/routes/categories/serializer.js";

export const updateCategoryRoute: FastifyPluginAsyncZod = async (app) => {
  app.put(
    "/:id",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["categories"],
        summary: "Atualiza uma categoria de serviço",
        security: [{ bearerAuth: [] }],
        params: categoryIdParamsSchema,
        body: updateCategoryBodySchema,
        response: {
          200: categorySchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const data: Prisma.CategoryUpdateInput = {};
      if (request.body.name !== undefined) data.name = request.body.name;

      try {
        const category = await app.prisma.category.update({
          where: { id: request.params.id },
          data,
          include: { _count: { select: { services: true } } },
        });
        return reply.code(200).send(serializeCategory(category));
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
          if (err.code === "P2025") {
            return reply.code(404).send({ error: "category_not_found" });
          }
          if (err.code === "P2002") {
            return reply.code(409).send({ error: "category_name_taken" });
          }
        }
        throw err;
      }
    },
  );
};
