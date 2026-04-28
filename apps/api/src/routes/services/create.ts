import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
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
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { name, description, price } = request.body;
      const service = await app.prisma.service.create({
        data: {
          name,
          description: description ?? null,
          price,
        },
      });
      return reply.code(201).send(serializeService(service));
    },
  );
};
