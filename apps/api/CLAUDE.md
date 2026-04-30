# apps/api — Convenções do backend

Backend Fastify + TypeScript + Prisma. Este arquivo descreve como o código é organizado e escrito aqui dentro. Para visão geral do produto e stack, veja o CLAUDE.md da raiz.

## Estrutura

```
apps/api/src/
├── config/            # env parsing (Zod)
├── lib/               # funções puras reaproveitáveis (hash, tokens, refreshToken, tokenStore)
├── plugins/           # plugins Fastify (errorHandler, prisma, tokenStore, auth)
├── schemas/           # schemas Zod por domínio — contrato das rotas
├── routes/            # uma pasta por domínio (auth/, services/, dentists/, e futuramente prices/)
├── __tests__/         # globalSetup.ts (schemas por worker), setup.ts (env/DATABASE_URL por worker), helpers.ts
├── app.ts             # buildApp({ tokenStore?, prisma? }) — entrada única
└── server.ts          # boot em produção/dev (lê env, chama buildApp, listen)
```

## Contrato das rotas

- **Zod como fonte de verdade.** Cada rota declara `schema: { body, querystring, params, response }` usando schemas de `src/schemas/`. `fastify-type-provider-zod` infere os tipos de `request.body`, `request.query`, etc. automaticamente.
- **Handlers como funções puras de request/reply.** Lógica pesada vai para `src/lib/` ou, se crescer, `src/services/` (criar só quando o handler ficar longo demais — não antecipar).
- **Shape de erro:** `{ error: string, message?: string, details?: any }`. Handlers retornam com `reply.code(n).send({ error })`. O error handler global (`plugins/errorHandler.ts`) converte `ZodError` em 400 com `error: "validation_error"` e registra 500 não tratados.

## Auth e injeção

- `app.prisma` — cliente Prisma (override por `buildApp({ prisma })` em testes).
- `app.tokenStore` — `TokenStore` do `lib/tokenStore.ts` (Redis em produção, in-memory em teste via `buildApp({ tokenStore })`).
- `app.authenticate` — preHandler que valida Bearer JWT, preenche `request.user = { userId, tokenId }`. Usar em rotas protegidas: `app.get("/x", { preHandler: app.authenticate }, ...)`.

## Testes

- **Unitários** de `lib/` ao lado do arquivo (`x.test.ts`). Não dependem de banco nem de Fastify.
- **Integração** de rotas em `routes/**/x.test.ts`. Usam `buildTestApp()` do `__tests__/helpers.ts`, que injeta `InMemoryTokenStore`. Postgres local do `docker-compose.dev.yml` precisa estar de pé — os testes não sobem o banco.
- **Paralelismo via schema-per-worker.** `__tests__/globalSetup.ts` cria N schemas (`test_1`..`test_N`, N = `os.cpus().length`) no Postgres e roda `prisma migrate deploy` em cada um antes da suíte; o teardown dropa todos. `__tests__/setup.ts` reescreve `DATABASE_URL` por worker usando `VITEST_POOL_ID` (`?schema=test_<id>`). Workers ficam fisicamente isolados — rodar em paralelo não causa conflito de estado entre domínios.
- **Isolamento dentro de um worker:** convenção de naming + cleanup helpers em `__tests__/helpers.ts`. Users com email de `testEmail(tag)` (sufixo `@test.local`) → `cleanupTestUsers()`. Services com nome de `testServiceName(tag)` (prefixo `[TEST]-`) → `cleanupTestServices()`. Cada teste chama o cleanup correspondente em `afterEach`/`beforeEach`. Quando aparecer um novo domínio com testes, replicar o par `testXxxName` + `cleanupTestXxx`.
- `__tests__/setup.ts` também preenche env vars padrão (JWT_SECRET, Redis URL, CORS_ORIGIN, etc.) — só com defaults se não existirem.

## Domínio por pasta

Cada domínio em `src/routes/<dom>/` tem um `index.ts` que registra as rotas do domínio, um arquivo por endpoint, e (quando vale a pena) um `CLAUDE.md` com regras de negócio específicas. Schemas Zod do domínio vão em `src/schemas/<dom>.ts`.
