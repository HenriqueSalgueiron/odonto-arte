import type { FastifyPluginAsync } from "fastify";
import { getLabInfoRoute } from "@/routes/lab-info/get.js";
import { updateLabInfoRoute } from "@/routes/lab-info/put.js";

export const labInfoRoutes: FastifyPluginAsync = async (app) => {
  await app.register(getLabInfoRoute);
  await app.register(updateLabInfoRoute);
};
