import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { labInfoSchema } from "@/schemas/labInfo.js";
import { errorResponseSchema } from "@/schemas/errors.js";
import { serializeLabInfo } from "@/routes/lab-info/serializer.js";

export const getLabInfoRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["lab-info"],
        summary: "Obtém as configurações do laboratório (singleton)",
        security: [{ bearerAuth: [] }],
        response: {
          200: labInfoSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      const existing = await app.prisma.labInfo.findFirst();
      const labInfo =
        existing ?? (await app.prisma.labInfo.create({ data: {} }));
      return reply.code(200).send(serializeLabInfo(labInfo));
    },
  );
};
