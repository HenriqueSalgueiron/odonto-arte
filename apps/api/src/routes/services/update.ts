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
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { name, description, price, active } = request.body;
      const data: Prisma.ServiceUpdateInput = {};
      if (name !== undefined) data.name = name;
      if (description !== undefined) data.description = description ?? null;
      if (price !== undefined) data.price = price;
      if (active !== undefined) data.active = active;

      try {
        const service = await app.prisma.service.update({
          where: { id: request.params.id },
          data,
        });
        return reply.code(200).send(serializeService(service));
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
