import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  serviceIdParamsSchema,
  serviceSchema,
} from "@/schemas/services.js";
import { errorResponseSchema } from "@/schemas/errors.js";
import { serializeService } from "@/routes/services/serializer.js";

export const getServiceRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/:id",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["services"],
        summary: "Busca um serviço pelo id",
        security: [{ bearerAuth: [] }],
        params: serviceIdParamsSchema,
        response: {
          200: serviceSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const service = await app.prisma.service.findUnique({
        where: { id: request.params.id },
        include: { category: { select: { id: true, name: true } } },
      });
      if (!service) {
        return reply.code(404).send({ error: "service_not_found" });
      }
      return reply.code(200).send(serializeService(service));
    },
  );
};
