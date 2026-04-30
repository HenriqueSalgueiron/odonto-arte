import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  setDentistPriceBodySchema,
  setDentistPriceParamsSchema,
  setDentistPriceResponseSchema,
  type SetDentistPriceResponse,
} from "@/schemas/dentistPrices.js";
import { errorResponseSchema } from "@/schemas/errors.js";

export const setDentistPriceRoute: FastifyPluginAsyncZod = async (app) => {
  app.put(
    "/:serviceId",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["dentist-prices"],
        summary: "Define ou atualiza o preço específico de um serviço para um dentista",
        description:
          "Upsert idempotente. Permite definir override mesmo quando o dentista ou o serviço estão inativos — o override fica gravado e aparece quando ambos voltarem a ficar ativos.",
        security: [{ bearerAuth: [] }],
        params: setDentistPriceParamsSchema,
        body: setDentistPriceBodySchema,
        response: {
          200: setDentistPriceResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { dentistId, serviceId } = request.params;
      const { price } = request.body;

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

      const saved = await app.prisma.specificPrice.upsert({
        where: { dentistId_serviceId: { dentistId, serviceId } },
        create: { dentistId, serviceId, price },
        update: { price },
      });

      const response: SetDentistPriceResponse = {
        id: saved.id,
        dentistId: saved.dentistId,
        serviceId: saved.serviceId,
        price: Number(saved.price),
        createdAt: saved.createdAt.toISOString(),
        updatedAt: saved.updatedAt.toISOString(),
      };
      return reply.code(200).send(response);
    },
  );
};
