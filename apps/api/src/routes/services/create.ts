import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { Prisma } from "@prisma/client";
import {
  createServiceBodySchema,
  serviceSchema,
} from "@/schemas/services.js";
import { errorResponseSchema } from "@/schemas/errors.js";
import { serializeService } from "@/routes/services/serializer.js";

export const createServiceRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["services"],
        summary: "Cria um novo serviço",
        security: [{ bearerAuth: [] }],
        body: createServiceBodySchema,
        response: {
          201: serviceSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { name, description, price, categoryId } = request.body;

      try {
        const service = await app.prisma.service.create({
          data: {
            name,
            description: description ?? null,
            price,
            categoryId: categoryId ?? null,
          },
          include: { category: { select: { id: true, name: true } } },
        });
        return reply.code(201).send(serializeService(service));
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2003"
        ) {
          return reply.code(400).send({ error: "category_not_found" });
        }
        throw err;
      }
    },
  );
};
