import type { FastifyPluginAsync } from "fastify";
import { listDentistsRoute } from "@/routes/dentists/list.js";
import { getDentistRoute } from "@/routes/dentists/get.js";
import { createDentistRoute } from "@/routes/dentists/create.js";
import { updateDentistRoute } from "@/routes/dentists/update.js";
import { deleteDentistRoute } from "@/routes/dentists/delete.js";

export const dentistsRoutes: FastifyPluginAsync = async (app) => {
  await app.register(listDentistsRoute);
  await app.register(getDentistRoute);
  await app.register(createDentistRoute);
  await app.register(updateDentistRoute);
  await app.register(deleteDentistRoute);
};
