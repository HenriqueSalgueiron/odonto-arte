import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export type PrismaPluginOptions = {
  prisma?: PrismaClient;
};

export const prismaPlugin = fp<PrismaPluginOptions>(async (app, opts) => {
  const prisma = opts.prisma ?? new PrismaClient();

  app.decorate("prisma", prisma);

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
});
