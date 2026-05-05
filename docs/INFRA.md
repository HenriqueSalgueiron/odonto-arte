# Infraestrutura e Deploy

## Ambientes

- **Local (dev):** `pnpm dev` roda frontend (Vite, porta 5173) e backend (Fastify, porta 3000) simultaneamente via Turborepo. Banco: Postgres local via Docker Compose (zero latência, funciona offline, reseta fácil). Redis: Upstash (instância "dev" separada da de produção — mesmo SDK, sem divergência entre ambientes, sem Redis local).
- **Neon branch (pré-produção):** usado pontualmente para testar migrations antes de aplicar em produção. Criar branch no Neon, apontar `DATABASE_URL` pra ela, rodar `prisma migrate deploy`, validar, e depois aplicar em produção com confiança.
- **Produção:** frontend na Vercel, backend no Fly.io, banco no Neon, sessões no Upstash Redis.

## Docker Compose para desenvolvimento local

```yaml
# docker-compose.dev.yml (na raiz do monorepo)
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: odontoarte
      POSTGRES_PASSWORD: dev123
      POSTGRES_DB: odontoarte_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

`DATABASE_URL` no `.env` de dev: `postgresql://odontoarte:dev123@localhost:5432/odontoarte_dev`

## Dockerfile do backend (apps/api/Dockerfile)

Multi-stage build:
1. **Stage "deps"**: instala dependências de produção com pnpm.
2. **Stage "build"**: roda build TypeScript.
3. **Stage "runner"**: imagem final mínima (node:20-slim), copia apenas dist + node_modules de produção. Expõe porta, define healthcheck, inicia com `node dist/server.js`.

## CI/CD (GitHub Actions)

Trigger: push na branch main.

1. **Lint** — roda ESLint no monorepo inteiro.
2. **Build** — compila TypeScript do backend e frontend. Se falhar, pipeline para aqui (não perde tempo com testes nem deploy).
3. **Test** — roda testes do backend e do frontend em paralelo (unitários, hooks, componentes, integração).
4. **E2E** — roda testes Cypress (mais lentos, só na main).
5. **Deploy backend** — `fly deploy` a partir do Dockerfile.
6. **Migrate banco** — `prisma migrate deploy` no Neon de produção.
7. **Deploy frontend** — Vercel deploy (automático via integração git, ou via CLI).

## Variáveis de ambiente

**Backend (Fly.io secrets):**
- `DATABASE_URL` — connection string do Neon.
- `UPSTASH_REDIS_REST_URL` — URL REST do Upstash Redis.
- `UPSTASH_REDIS_REST_TOKEN` — token de autenticação do Upstash Redis.
- `JWT_SECRET` — chave secreta para assinar JWTs. Gerar com: `openssl rand -base64 32`.
- `CORS_ORIGIN` — URL do frontend (ex: `https://odontoarte.vercel.app`).
- `SENTRY_DSN` — DSN do projeto Sentry backend.
- `NODE_ENV=production`

**Frontend (Vercel env vars):**
- `VITE_API_URL` — URL do backend (ex: `https://odontoarte-api.fly.dev`).
- `VITE_SENTRY_DSN` — DSN do projeto Sentry frontend.
