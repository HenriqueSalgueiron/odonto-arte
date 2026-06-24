// IMPORTANTE: instrument precisa ser o primeiro import. Ver explicação no
// próprio arquivo.
import "./instrument.js";

import * as Sentry from "@sentry/node";
import { buildApp } from "@/app.js";
import { getEnv } from "@/config/env.js";

async function start() {
  const env = getEnv();
  const app = await buildApp();

  // Plugga o capture de erros do Sentry como hook do Fastify. No-op quando
  // Sentry não inicializou (DSN ausente). Não substitui nosso setErrorHandler
  // do errorHandlerPlugin — só adiciona captura em paralelo.
  Sentry.setupFastifyErrorHandler(app);

  try {
    await app.listen({ port: env.PORT, host: "::" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
