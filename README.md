# OdontoArte

> Aplicação web construída do zero para um laboratório de prótese dentária familiar. Substitui o uso de diversas planilhas Excel hoje usadas para gerenciar preços por dentista (e, em fases seguintes, as fichas em papel das ordens de serviço) por uma ferramenta acessível de qualquer dispositivo, pensada para uma usuária com baixa familiaridade técnica.

**Status:** em desenvolvimento. MVP (Fase 1) parcialmente concluído — ver [Roadmap](#roadmap).

---

## Sobre o projeto

A usuária principal — co-proprietária do laboratório, baixa familiaridade técnica — hoje gerencia preços em uma planilha Excel, com fricção para localizar o arquivo, formatar e exportar PDF. O sistema substitui esse fluxo: URL fixa, login persistente, instalável como app no celular (PWA), e exportação de PDF direto do navegador.

Princípios de design:

- **Simplicidade acima de completude.** UX favorece clareza e previsibilidade.
- **Acessível de qualquer lugar.** Sem instalar nada, sem "abrir arquivo".
- **Confiável.** Os dados são o ativo principal do laboratório — backup automático via banco gerenciado.

Detalhamento de produto, personas e escopo em [`docs/PRODUCT.md`](docs/PRODUCT.md).

---

## Stack

Monorepo com pnpm workspaces + Turborepo.

**Frontend:** Vite, React, TypeScript, MUI, React Router, TanStack Query, React Hook Form, Zod, react-pdf, vite-plugin-pwa.
**Backend:** Node.js, Fastify, TypeScript, Prisma, Zod, jose (JWT), Argon2id, @upstash/redis.
**Banco/cache:** PostgreSQL (Neon), Redis (Upstash).
**Tipos cross-stack:** Kubb gera clientes/hooks/schemas Zod no frontend a partir da spec OpenAPI do backend.
**Testes:** Vitest, Testing Library, MSW, Cypress.
**Deploy:** Vercel (frontend) + Fly.io (backend) + GitHub Actions (CI/CD). Custo total: R$ 0 (todos em free tier).

Justificativas de cada escolha em [`docs/STACK.md`](docs/STACK.md).

---

## Como rodar local

Pré-requisitos: Node.js >= 24, pnpm 10, Docker (para Postgres local).

```bash
# 1. Instalar dependências
pnpm install

# 2. Subir Postgres local
docker compose -f docker-compose.dev.yml up -d

# 3. Configurar env vars
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Editar apps/api/.env com credenciais do Upstash Redis (free tier)

# 4. Aplicar migrations e seed (cria usuária inicial)
pnpm --filter @odontoarte/api db:deploy
pnpm --filter @odontoarte/api db:seed

# 5. Gerar tipos do frontend a partir da spec OpenAPI
pnpm kubb

# 6. Subir frontend (:5173) e backend (:3000) em paralelo
pnpm dev
```

Mais detalhes de ambientes (dev / Neon branch / produção) em [`docs/INFRA.md`](docs/INFRA.md).

### Scripts úteis

| Comando                                    | O que faz                                                   |
| ------------------------------------------ | ----------------------------------------------------------- |
| `pnpm dev`                                 | Frontend e backend em paralelo                              |
| `pnpm test`                                | Vitest em todos os pacotes                                  |
| `pnpm lint`                                | ESLint no monorepo                                          |
| `pnpm type-check`                          | TypeScript em todos os pacotes (encadeia kubb)              |
| `pnpm build`                               | Build de produção (encadeia kubb)                           |
| `pnpm kubb`                                | Regenera `apps/web/src/generated/` a partir da spec OpenAPI |
| `pnpm --filter @odontoarte/api db:migrate` | Cria/aplica nova migration em dev                           |
| `pnpm --filter @odontoarte/api db:studio`  | Abre Prisma Studio                                          |

---

## Estrutura do monorepo

```
odontoarte/
├── apps/
│   ├── web/                # Frontend (Vite + React)
│   └── api/                # Backend (Fastify + Prisma)
├── docs/                   # Produto, stack, infra, roadmap
├── kubb.config.ts          # Lê apps/api/openapi.json → gera apps/web/src/generated/
├── docker-compose.dev.yml  # Postgres local
├── turbo.json
└── pnpm-workspace.yaml
```

O projeto usa CLAUDE.md em múltiplos níveis para dar contexto a desenvolvimento assistido por IA: convenções globais ficam no [`CLAUDE.md`](CLAUDE.md) raiz, convenções de cada app em `apps/{api,web}/CLAUDE.md`, e regras de negócio específicas em `apps/api/src/routes/<dom>/CLAUDE.md`.

---

## Roadmap

Roadmap completo (etapas 1 a 18) em [`docs/ROADMAP.md`](docs/ROADMAP.md).

- **Fase 1 — MVP** 🚧 Em andamento. Auth, CRUDs de serviços/dentistas, preços por dentista, configurações do laboratório e categorias já implementados. Falta exportação de PDF, PWA, observabilidade (Sentry), Docker e deploy.
- **Fase 2 — Ordens de Serviço** ⏳ Modelagem do banco já feita (`ServiceOrder`, `ServiceOrderItem`, `OrderAttachment`); implementação após Fase 1. Inclui anexos via AWS S3.
- **Fase 3+** ⏳ Ajuste global de preços, envio por email (AWS SES) e WhatsApp, relatórios financeiros, multi-usuário.

---

## Licença

Projeto privado, sem licença pública.
