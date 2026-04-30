import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  listDentistsQuerySchema,
  listDentistsResponseSchema,
} from "@/schemas/dentists.js";
import { errorResponseSchema } from "@/schemas/errors.js";
import { serializeDentist } from "@/routes/dentists/serializer.js";

export const listDentistsRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["dentists"],
        summary: "Lista dentistas cadastrados",
        description:
          "Por padrão retorna apenas dentistas ativos. Use ?includeInactive=true para incluir desativados.",
        security: [{ bearerAuth: [] }],
        querystring: listDentistsQuerySchema,
        response: {
          200: listDentistsResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const includeInactive = request.query.includeInactive === true;
      const dentists = await app.prisma.dentist.findMany({
        where: includeInactive ? {} : { active: true },
        orderBy: { name: "asc" },
      });
      return reply.code(200).send({ items: dentists.map(serializeDentist) });
    },
  );
};
