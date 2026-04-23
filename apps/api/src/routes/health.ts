import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

const healthResponseSchema = z.object({
  status: z.literal("ok"),
});

export const healthRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/health",
    {
      schema: {
        tags: ["health"],
        summary: "Healthcheck",
        response: { 200: healthResponseSchema },
      },
    },
    async () => {
      return { status: "ok" as const };
    },
  );
};
