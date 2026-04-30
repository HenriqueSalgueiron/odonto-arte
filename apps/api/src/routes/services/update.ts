import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { Prisma } from "@prisma/client";
import {
  serviceIdParamsSchema,
  serviceSchema,
  updateServiceBodySchema,
} from "@/schemas/services.js";
import { errorResponseSchema } from "@/schemas/errors.js";
import { serializeService } from "@/routes/services/serializer.js";

export const updateServiceRoute: FastifyPluginAsyncZod = async (app) => {
  app.put(
    "/:id",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["services"],
        summary: "Atualiza um serviço (também usado para reativar via active=true)",
        security: [{ bearerAuth: [] }],
        params: serviceIdParamsSchema,
        body: updateServiceBodySchema,
        response: {
          200: serviceSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { name, description, price, active, categoryId } = request.body;
      const data: Prisma.ServiceUncheckedUpdateInput = {};
      if (name !== undefined) data.name = name;
      if (description !== undefined) data.description = description ?? null;
      if (price !== undefined) data.price = price;
      if (active !== undefined) data.active = active;
      if (categoryId !== undefined) data.categoryId = categoryId ?? null;

      try {
        const service = await app.prisma.service.update({
          where: { id: request.params.id },
          data,
          include: { category: { select: { id: true, name: true } } },
        });
        return reply.code(200).send(serializeService(service));
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
          if (err.code === "P2025") {
            return reply.code(404).send({ error: "service_not_found" });
          }
          if (err.code === "P2003") {
            return reply.code(400).send({ error: "category_not_found" });
          }
        }
        throw err;
      }
    },
  );
};
