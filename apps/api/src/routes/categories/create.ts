import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { Prisma } from "@prisma/client";
import {
  categorySchema,
  createCategoryBodySchema,
} from "@/schemas/categories.js";
import { errorResponseSchema } from "@/schemas/errors.js";
import { serializeCategory } from "@/routes/categories/serializer.js";

export const createCategoryRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["categories"],
        summary: "Cria uma categoria de serviço",
        security: [{ bearerAuth: [] }],
        body: createCategoryBodySchema,
        response: {
          201: categorySchema,
          401: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const category = await app.prisma.category.create({
          data: { name: request.body.name },
        });
        return reply.code(201).send(serializeCategory(category));
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
        ) {
          return reply.code(409).send({ error: "category_name_taken" });
        }
        throw err;
      }
    },
  );
};
