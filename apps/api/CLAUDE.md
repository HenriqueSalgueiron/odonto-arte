# apps/api — Convenções do backend

Backend Fastify + TypeScript + Prisma. Este arquivo descreve como o código é organizado e escrito aqui dentro. Para visão geral do produto e stack, veja o CLAUDE.md da raiz.

## Estrutura

```
apps/api/src/
├── config/            # env parsing (Zod)
├── lib/               # funções puras reaproveitáveis (hash, tokens, refreshToken, tokenStore)
├── plugins/           # plugins Fastify (errorHandler, prisma, tokenStore, auth)
├── schemas/           # schemas Zod por domínio — contrato das rotas
├── routes/            # uma pasta por domínio (auth/, e futuramente servicos/, dentistas/, precos/)
├── __tests__/         # helpers de teste e setup global (setup.ts)
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
- **Integração** de rotas em `routes/**/x.test.ts`. Usam `buildTestApp()` do `__tests__/helpers.ts`, que injeta `InMemoryTokenStore`. Prisma aponta para o banco local do `docker-compose.dev.yml` (é preciso subir o Postgres antes de rodar testes de integração).
- **Isolamento de dados:** cada teste cria usuários com emails gerados por `testEmail(tag)` (terminam em `@test.local`); `afterEach` chama `cleanupTestUsers()` que apaga todos os `*@test.local`.
- `__tests__/setup.ts` preenche env vars padrão para os testes (só com defaults se não existirem).

## Domínio por pasta

Cada domínio em `src/routes/<dom>/` tem um `index.ts` que registra as rotas do domínio, um arquivo por endpoint, e (quando vale a pena) um `CLAUDE.md` com regras de negócio específicas. Schemas Zod do domínio vão em `src/schemas/<dom>.ts`.
