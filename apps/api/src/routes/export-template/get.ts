import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { exportTemplateSchema } from "@/schemas/exportTemplate.js";
import { errorResponseSchema } from "@/schemas/errors.js";
import { serializeExportTemplate } from "@/routes/export-template/serializer.js";

export const getExportTemplateRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["export-template"],
        summary: "Obtém o template de exportação de PDF (singleton)",
        security: [{ bearerAuth: [] }],
        response: {
          200: exportTemplateSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      const existing = await app.prisma.exportTemplate.findFirst();
      const template =
        existing ?? (await app.prisma.exportTemplate.create({ data: {} }));
      return reply.code(200).send(serializeExportTemplate(template));
    },
  );
};
