// Inicializa o Sentry. Esse arquivo precisa ser importado ANTES de qualquer
// outro código (especialmente antes do Fastify) — o @sentry/node aplica
// auto-instrumentation patchando módulos como http e fastify, e o patch só
// funciona se rolar antes desses módulos serem importados.
//
// Por isso o server.ts importa "./instrument.js" na primeira linha.
//
// `dotenv/config` é o primeiro import — tsx não auto-carrega .env cedo o
// suficiente (o load só rola quando o Prisma client é instanciado lá adiante),
// então fazemos manual aqui pra garantir que SENTRY_DSN esteja em process.env
// antes do Sentry.init.

import "dotenv/config";
import * as Sentry from "@sentry/node";

// Lê direto de process.env (não via getEnv) porque getEnv valida via Zod e
// poderia lançar antes do Sentry inicializar — perderíamos a chance de
// capturar essa falha. Quando SENTRY_DSN não está setado, Sentry.init é
// pulado e o SDK opera como no-op (capturas silenciosamente não enviam).
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    // Sem performance monitoring (decisão da Etapa 15). Só captura de erros.
    tracesSampleRate: 0,
  });
}
