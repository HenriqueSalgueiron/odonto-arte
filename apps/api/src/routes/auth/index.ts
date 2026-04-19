import type { FastifyPluginAsync } from "fastify";
import { loginRoute } from "@/routes/auth/login.js";
import { refreshRoute } from "@/routes/auth/refresh.js";
import { logoutRoute } from "@/routes/auth/logout.js";
import { meRoute } from "@/routes/auth/me.js";

export const authRoutes: FastifyPluginAsync = async (app) => {
  await app.register(loginRoute);
  await app.register(refreshRoute);
  await app.register(logoutRoute);
  await app.register(meRoute);
};
