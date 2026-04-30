import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { listCategoriesResponseSchema } from "@/schemas/categories.js";
import { errorResponseSchema } from "@/schemas/errors.js";
import { serializeCategory } from "@/routes/categories/serializer.js";

export const listCategoriesRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["categories"],
        summary: "Lista categorias de serviço",
        description:
          "Retorna todas as categorias com a contagem de serviços associados (serviceCount).",
        security: [{ bearerAuth: [] }],
        response: {
          200: listCategoriesResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      const categories = await app.prisma.category.findMany({
        include: { _count: { select: { services: true } } },
        orderBy: { name: "asc" },
      });
      return reply
        .code(200)
        .send({ items: categories.map((c) => serializeCategory(c)) });
    },
  );
};
