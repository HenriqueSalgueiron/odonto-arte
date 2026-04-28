import type { FastifyPluginAsync } from "fastify";
import { listServicesRoute } from "@/routes/services/list.js";
import { getServiceRoute } from "@/routes/services/get.js";
import { createServiceRoute } from "@/routes/services/create.js";
import { updateServiceRoute } from "@/routes/services/update.js";
import { deleteServiceRoute } from "@/routes/services/delete.js";

export const servicesRoutes: FastifyPluginAsync = async (app) => {
  await app.register(listServicesRoute);
  await app.register(getServiceRoute);
  await app.register(createServiceRoute);
  await app.register(updateServiceRoute);
  await app.register(deleteServiceRoute);
};
