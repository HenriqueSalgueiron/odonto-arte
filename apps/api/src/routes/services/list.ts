import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  listServicesQuerySchema,
  listServicesResponseSchema,
} from "@/schemas/services.js";
import { errorResponseSchema } from "@/schemas/errors.js";
import { serializeService } from "@/routes/services/serializer.js";

export const listServicesRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["services"],
        summary: "Lista serviços do catálogo",
        description:
          "Por padrão retorna apenas serviços ativos. Use ?includeInactive=true para incluir desativados.",
        security: [{ bearerAuth: [] }],
        querystring: listServicesQuerySchema,
        response: {
          200: listServicesResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const includeInactive = request.query.includeInactive === true;
      const services = await app.prisma.service.findMany({
        where: includeInactive ? {} : { active: true },
        orderBy: { name: "asc" },
      });
      return reply.code(200).send({ items: services.map(serializeService) });
    },
  );
};
