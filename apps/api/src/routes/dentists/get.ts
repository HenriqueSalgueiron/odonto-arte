import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  dentistIdParamsSchema,
  dentistSchema,
} from "@/schemas/dentists.js";
import { errorResponseSchema } from "@/schemas/errors.js";
import { serializeDentist } from "@/routes/dentists/serializer.js";

export const getDentistRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/:id",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["dentists"],
        summary: "Busca um dentista pelo id",
        security: [{ bearerAuth: [] }],
        params: dentistIdParamsSchema,
        response: {
          200: dentistSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const dentist = await app.prisma.dentist.findUnique({
        where: { id: request.params.id },
      });
      if (!dentist) {
        return reply.code(404).send({ error: "dentist_not_found" });
      }
      return reply.code(200).send(serializeDentist(dentist));
    },
  );
};
