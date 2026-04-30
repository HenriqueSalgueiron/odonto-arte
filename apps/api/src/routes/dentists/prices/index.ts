import type { FastifyPluginAsync } from "fastify";
import { listDentistPricesRoute } from "@/routes/dentists/prices/list.js";
import { setDentistPriceRoute } from "@/routes/dentists/prices/set.js";
import { removeDentistPriceRoute } from "@/routes/dentists/prices/remove.js";

export const dentistPricesRoutes: FastifyPluginAsync = async (app) => {
  await app.register(listDentistPricesRoute);
  await app.register(setDentistPriceRoute);
  await app.register(removeDentistPriceRoute);
};
