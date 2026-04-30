import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  labInfoSchema,
  updateLabInfoBodySchema,
} from "@/schemas/labInfo.js";
import { errorResponseSchema } from "@/schemas/errors.js";
import { serializeLabInfo } from "@/routes/lab-info/serializer.js";

export const updateLabInfoRoute: FastifyPluginAsyncZod = async (app) => {
  app.put(
    "/",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["lab-info"],
        summary: "Atualiza as configurações do laboratório (singleton)",
        security: [{ bearerAuth: [] }],
        body: updateLabInfoBodySchema,
        response: {
          200: labInfoSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const existing = await app.prisma.labInfo.findFirst();
      const labInfo = existing
        ? await app.prisma.labInfo.update({
            where: { id: existing.id },
            data: request.body,
          })
        : await app.prisma.labInfo.create({ data: request.body });
      return reply.code(200).send(serializeLabInfo(labInfo));
    },
  );
};
