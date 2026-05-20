import Fastify from "fastify";
import cors from "@fastify/cors";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import type { PrismaClient } from "@prisma/client";
import { getEnv } from "@/config/env.js";
import { errorHandlerPlugin } from "@/plugins/errorHandler.js";
import { prismaPlugin } from "@/plugins/prisma.js";
import { tokenStorePlugin } from "@/plugins/tokenStore.js";
import { authPlugin } from "@/plugins/auth.js";
import { swaggerPlugin } from "@/plugins/swagger.js";
import type { TokenStore } from "@/lib/tokenStore.js";
import { healthRoute } from "@/routes/health.js";
import { authRoutes } from "@/routes/auth/index.js";
import { servicesRoutes } from "@/routes/services/index.js";
import { categoriesRoutes } from "@/routes/categories/index.js";
import { dentistsRoutes } from "@/routes/dentists/index.js";
import { labInfoRoutes } from "@/routes/lab-info/index.js";
import { exportTemplateRoutes } from "@/routes/export-template/index.js";

export type BuildAppOptions = {
  tokenStore?: TokenStore;
  prisma?: PrismaClient;
  logger?: boolean;
};

export async function buildApp(opts: BuildAppOptions = {}) {
  const app = Fastify({ logger: opts.logger ?? true }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(errorHandlerPlugin);
  await app.register(cors, {
    origin: getEnv().CORS_ORIGIN,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
    maxAge: 86400,
  });

  await app.register(swaggerPlugin);

  await app.register(prismaPlugin, { prisma: opts.prisma });
  await app.register(tokenStorePlugin, { tokenStore: opts.tokenStore });
  await app.register(authPlugin);

  await app.register(healthRoute);
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(servicesRoutes, { prefix: "/services" });
  await app.register(categoriesRoutes, { prefix: "/categories" });
  await app.register(dentistsRoutes, { prefix: "/dentists" });
  await app.register(labInfoRoutes, { prefix: "/lab-info" });
  await app.register(exportTemplateRoutes, { prefix: "/export-template" });

  return app;
}
