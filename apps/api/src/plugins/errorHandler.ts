import fp from "fastify-plugin";
import type { FastifyError } from "fastify";
import { ZodError } from "zod";

export const errorHandlerPlugin = fp(async (app) => {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: "validation_error",
        details: error.issues,
      });
    }

    if (error.validation) {
      return reply.code(400).send({
        error: "validation_error",
        details: error.validation,
      });
    }

    const statusCode = error.statusCode ?? 500;
    if (statusCode < 500) {
      return reply.code(statusCode).send({
        error: error.code ?? "client_error",
        message: error.message,
      });
    }

    request.log.error({ err: error }, "unhandled_error");
    return reply.code(500).send({ error: "internal_error" });
  });
});
