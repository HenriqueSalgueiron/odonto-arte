import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { Prisma } from "@prisma/client";
import {
  dentistIdParamsSchema,
  dentistSchema,
  updateDentistBodySchema,
} from "@/schemas/dentists.js";
import { errorResponseSchema } from "@/schemas/errors.js";
import { serializeDentist } from "@/routes/dentists/serializer.js";

export const updateDentistRoute: FastifyPluginAsyncZod = async (app) => {
  app.put(
    "/:id",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["dentists"],
        summary: "Atualiza um dentista (também usado para reativar via active=true)",
        security: [{ bearerAuth: [] }],
        params: dentistIdParamsSchema,
        body: updateDentistBodySchema,
        response: {
          200: dentistSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { name, cro, phone, email, notes, active } = request.body;
      const data: Prisma.DentistUpdateInput = {};
      if (name !== undefined) data.name = name;
      if (cro !== undefined) data.cro = cro ?? null;
      if (phone !== undefined) data.phone = phone ?? null;
      if (email !== undefined) data.email = email ?? null;
      if (notes !== undefined) data.notes = notes ?? null;
      if (active !== undefined) data.active = active;

      try {
        const dentist = await app.prisma.dentist.update({
          where: { id: request.params.id },
          data,
        });
        return reply.code(200).send(serializeDentist(dentist));
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2025"
        ) {
          return reply.code(404).send({ error: "dentist_not_found" });
        }
        throw err;
      }
    },
  );
};
