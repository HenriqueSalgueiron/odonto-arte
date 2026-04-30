import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  listDentistPricesParamsSchema,
  listDentistPricesResponseSchema,
  type DentistPriceRow,
} from "@/schemas/dentistPrices.js";
import { errorResponseSchema } from "@/schemas/errors.js";

export const listDentistPricesRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["dentist-prices"],
        summary: "Lista preços efetivos de um dentista por serviço ativo",
        description:
          "Para cada serviço ativo, retorna o preço-tabela, o preço específico do dentista (quando existe) e o preço efetivo (específico se houver, tabela caso contrário). Funciona para dentistas inativos. Serviços inativos não aparecem mesmo quando há override.",
        security: [{ bearerAuth: [] }],
        params: listDentistPricesParamsSchema,
        response: {
          200: listDentistPricesResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { dentistId } = request.params;

      const dentist = await app.prisma.dentist.findUnique({
        where: { id: dentistId },
        select: { id: true },
      });
      if (!dentist) {
        return reply.code(404).send({ error: "dentist_not_found" });
      }

      const [services, overrides] = await Promise.all([
        app.prisma.service.findMany({
          where: { active: true },
          orderBy: { name: "asc" },
          select: { id: true, name: true, price: true },
        }),
        app.prisma.specificPrice.findMany({
          where: { dentistId },
          select: { serviceId: true, price: true },
        }),
      ]);

      const overrideByServiceId = new Map<string, number>();
      for (const o of overrides) {
        overrideByServiceId.set(o.serviceId, Number(o.price));
      }

      const items: DentistPriceRow[] = services.map((s) => {
        const tablePrice = Number(s.price);
        const specificPrice = overrideByServiceId.get(s.id) ?? null;
        const effectivePrice = specificPrice ?? tablePrice;
        return {
          serviceId: s.id,
          serviceName: s.name,
          tablePrice,
          specificPrice,
          effectivePrice,
        };
      });

      return reply.code(200).send({ items });
    },
  );
};
