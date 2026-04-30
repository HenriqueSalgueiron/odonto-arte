import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { setDentistPriceParamsSchema } from "@/schemas/dentistPrices.js";
import { errorResponseSchema } from "@/schemas/errors.js";

export const removeDentistPriceRoute: FastifyPluginAsyncZod = async (app) => {
  app.delete(
    "/:serviceId",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["dentist-prices"],
        summary: "Remove o preço específico de um serviço para um dentista",
        description:
          "Hard delete. Idempotente: 204 mesmo quando não existe override (a ausência da linha já significa que vale o preço-tabela). 404 só quando o dentista ou o serviço não existem.",
        security: [{ bearerAuth: [] }],
        params: setDentistPriceParamsSchema,
        response: {
          204: z.null(),
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { dentistId, serviceId } = request.params;

      const [dentist, service] = await Promise.all([
        app.prisma.dentist.findUnique({
          where: { id: dentistId },
          select: { id: true },
        }),
        app.prisma.service.findUnique({
          where: { id: serviceId },
          select: { id: true },
        }),
      ]);
      if (!dentist) {
        return reply.code(404).send({ error: "dentist_not_found" });
      }
      if (!service) {
        return reply.code(404).send({ error: "service_not_found" });
      }

      await app.prisma.specificPrice.deleteMany({
        where: { dentistId, serviceId },
      });

      return reply.code(204).send(null);
    },
  );
};
