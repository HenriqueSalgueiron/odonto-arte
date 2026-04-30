import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  createDentistBodySchema,
  dentistSchema,
} from "@/schemas/dentists.js";
import { errorResponseSchema } from "@/schemas/errors.js";
import { serializeDentist } from "@/routes/dentists/serializer.js";

export const createDentistRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["dentists"],
        summary: "Cria um novo dentista",
        security: [{ bearerAuth: [] }],
        body: createDentistBodySchema,
        response: {
          201: dentistSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { name, cro, phone, email, notes } = request.body;
      const dentist = await app.prisma.dentist.create({
        data: {
          name,
          cro: cro ?? null,
          phone: phone ?? null,
          email: email ?? null,
          notes: notes ?? null,
        },
      });
      return reply.code(201).send(serializeDentist(dentist));
    },
  );
};
