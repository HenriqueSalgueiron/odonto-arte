import type { FastifyPluginAsync } from "fastify";
import { getExportTemplateRoute } from "@/routes/export-template/get.js";
import { updateExportTemplateRoute } from "@/routes/export-template/put.js";

export const exportTemplateRoutes: FastifyPluginAsync = async (app) => {
  await app.register(getExportTemplateRoute);
  await app.register(updateExportTemplateRoute);
};
