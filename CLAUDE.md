# OdontoArte

Sistema web para gestão de um laboratório de prótese dentária familiar. Substitui uma planilha Excel hoje usada para controlar preços de serviços por dentista, com exportação de PDF da tabela. Em fases futuras, substitui também o controle em papel das ordens de serviço. Usuária principal tem baixa familiaridade técnica — toda decisão de UX favorece clareza e previsibilidade.

Documentos detalhados em `docs/`:

- [`docs/PRODUCT.md`](docs/PRODUCT.md) — visão, personas, escopo de cada fase.
- [`docs/STACK.md`](docs/STACK.md) — escolhas técnicas e justificativas.
- [`docs/INFRA.md`](docs/INFRA.md) — ambientes, Docker, CI/CD, env vars.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — etapas de execução em ordem.

Regras de negócio por domínio vivem em `CLAUDE.md` aninhados:

- `apps/api/CLAUDE.md` — convenções do backend.
- `apps/web/CLAUDE.md` — convenções do frontend.
- `apps/api/src/routes/<dom>/CLAUDE.md` — regras específicas de cada domínio (auth, services, dentists, dentists/prices, categories, ...).

Schema do banco: `apps/api/prisma/schema.prisma` é a fonte de verdade. Inclui modelos da Fase 1 (em uso) e Fase 2 (modelados pra evitar migrations dolorosas, sem código).

---

## Stack (resumo)

Frontend Vite + React + TypeScript + MUI (sem Tailwind). Backend Fastify + TypeScript + Prisma + Postgres. Sessões em Redis (Upstash) com TTL automático. Tipos do frontend gerados a partir da spec OpenAPI do backend via Kubb (`pnpm kubb`). Testes com Vitest, MSW e Cypress. Deploy: Vercel (web) + Fly.io (api) + Neon (Postgres). Detalhamento completo em [`docs/STACK.md`](docs/STACK.md).

## Estrutura do monorepo

```
odontoarte/
├── apps/
│   ├── web/                # Frontend (Vite + React)
│   └── api/                # Backend (Fastify + Prisma)
├── docs/                   # Documentos de produto, stack, infra, roadmap
├── kubb.config.ts          # Lê apps/api/openapi.json → gera apps/web/src/generated/
├── turbo.json
├── pnpm-workspace.yaml
└── docker-compose.dev.yml  # Postgres local
```

## Comandos

- `pnpm dev` — sobe frontend (`:5173`) e backend (`:3000`) em paralelo.
- `pnpm test` — roda Vitest em todos os pacotes.
- `pnpm kubb` — regenera `apps/web/src/generated/` a partir da spec OpenAPI atual do backend. Rodar após qualquer mudança de schema/rota no backend. `pnpm type-check` e `pnpm build` já encadeiam essa pipeline via Turborepo.
- `docker compose -f docker-compose.dev.yml up -d` — sobe Postgres local. Necessário para dev e para os testes de integração do backend.

---

## Convenções globais

### Idioma

- **Código** (variáveis, funções, tipos, nomes de arquivo, models Prisma, enums): **inglês**.
- **Strings de UI** (labels, mensagens de erro voltadas ao usuário, textos do PDF): **português**.

### Naming

- camelCase para variáveis e funções, PascalCase para componentes React e tipos/interfaces, SCREAMING_SNAKE_CASE para constantes e enums.

### Imports

- Aliases absolutos dentro de cada app (`@/` aponta para `src/`). Sem imports relativos longos (`../../../`).

### Refresh tokens não vivem no Postgres

Sessões são chaves no Redis com TTL nativo (`refresh:{userId}:{tokenId}` → 30d). O Postgres guarda só dados de domínio persistentes. Detalhes em `apps/api/src/routes/auth/CLAUDE.md`.

### Frontend não define tipos manualmente

Tudo o que cruza o boundary HTTP (tipos, schemas Zod, hooks de TanStack Query, cliente axios) é gerado pelo Kubb em `apps/web/src/generated/`. Pasta gitignored. Não editar nada lá dentro — se precisar customizar, faça wrapper em `apps/web/src/hooks/`.

### MUI cuida de toda estilização

Sem Tailwind. Sem CSS solto. Tema centralizado em `apps/web/src/theme/`. Não usar cores hardcoded em `sx` — sempre referenciar o tema.

### CLAUDE.md por domínio

Quando trabalhar em uma rota específica, leia o `CLAUDE.md` do domínio antes — é onde vivem as regras de negócio (soft delete vs hard delete, idempotência, nomes reservados, etc.). Adicione/atualize esse arquivo quando uma decisão de design não óbvia entrar no código.

---

## Testes

Camadas, escritas junto com a feature, não depois:

1. **Unitário** — funções puras, Vitest, `{nome}.test.ts` ao lado.
2. **Hook** (frontend) — hooks customizados em `apps/web/src/hooks/`, com `renderHook`. Hooks gerados pelo Kubb não são testados.
3. **Componente** (frontend) — Testing Library + MSW, `{nome}.test.tsx` ao lado.
4. **Integração** (backend) — rotas via `buildTestApp()`, supertest, `{nome}.test.ts` ao lado. Postgres local precisa estar de pé.
5. **E2E** — Cypress em `apps/web/cypress/e2e/`. Roda só na main no CI.

Detalhes (paralelismo por schema, helpers de cleanup) em `apps/api/CLAUDE.md` e `apps/web/CLAUDE.md`.
