import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  exportTemplateSchema,
  updateExportTemplateBodySchema,
} from "@/schemas/exportTemplate.js";
import { errorResponseSchema } from "@/schemas/errors.js";
import { serializeExportTemplate } from "@/routes/export-template/serializer.js";

export const updateExportTemplateRoute: FastifyPluginAsyncZod = async (app) => {
  app.put(
    "/",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["export-template"],
        summary: "Atualiza o template de exportação de PDF (singleton)",
        security: [{ bearerAuth: [] }],
        body: updateExportTemplateBodySchema,
        response: {
          200: exportTemplateSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const observations = request.body.observations
        .map((o) => o.trim())
        .filter((o) => o.length > 0);
      const data = {
        categoryOrder: request.body.categoryOrder,
        observations,
      };

      const existing = await app.prisma.exportTemplate.findFirst();
      const template = existing
        ? await app.prisma.exportTemplate.update({
            where: { id: existing.id },
            data,
          })
        : await app.prisma.exportTemplate.create({ data });
      return reply.code(200).send(serializeExportTemplate(template));
    },
  );
};
