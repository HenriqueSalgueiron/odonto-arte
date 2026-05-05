import type { FastifyPluginAsync } from "fastify";
import { listCategoriesRoute } from "@/routes/categories/list.js";
import { createCategoryRoute } from "@/routes/categories/create.js";
import { updateCategoryRoute } from "@/routes/categories/update.js";
import { deleteCategoryRoute } from "@/routes/categories/delete.js";

export const categoriesRoutes: FastifyPluginAsync = async (app) => {
  await app.register(listCategoriesRoute);
  await app.register(createCategoryRoute);
  await app.register(updateCategoryRoute);
  await app.register(deleteCategoryRoute);
};
