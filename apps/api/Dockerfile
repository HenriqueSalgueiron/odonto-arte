# syntax=docker/dockerfile:1.7
#
# Dockerfile multi-stage do backend OdontoArte.
# - builder: instala pnpm + deps, gera Prisma client, compila TS → JS.
# - runner: imagem final magra com apenas o necessário pra rodar em produção.
#
# Build esperado a partir da raiz do monorepo (não de apps/api/):
#   docker build -f apps/api/Dockerfile -t odontoarte-api .
# Razão: o Dockerfile precisa enxergar o pnpm-workspace.yaml + lock raiz pra
# resolver deps via pnpm corretamente.

# ============================================================
# Estágio 1: builder
# ============================================================
FROM node:24-slim AS builder
WORKDIR /repo

# OpenSSL — o Prisma engine precisa pra gerar o client.
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# pnpm na versão declarada em package.json#packageManager.
# Corepack vem com Node 24; ele lê a versão correta automaticamente.
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

# 1ª layer: copia só metadados do monorepo. Quando código muda mas deps não,
# essa layer fica em cache e o pnpm install não roda de novo.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
# apps/web só precisa do package.json pra pnpm conseguir resolver a workspace.
# O código do web não vai pra essa imagem (.dockerignore exclui).
COPY apps/web/package.json ./apps/web/

# Instala TODAS as deps (incluindo dev) — precisamos do tsc pra compilar
# e do prisma CLI pra gerar o client.
RUN pnpm install --frozen-lockfile

# 2ª layer: agora sim, copia o código do backend.
COPY apps/api ./apps/api

# Gera o Prisma client (lê schema.prisma, escreve em node_modules/.prisma).
RUN pnpm --filter @odontoarte/api prisma:generate

# Compila TypeScript → JavaScript (saída em apps/api/dist/).
RUN pnpm --filter @odontoarte/api build

# pnpm deploy: cria /deploy contendo apenas o pacote @odontoarte/api +
# suas deps de PRODUÇÃO copiadas como arquivos reais (sem symlinks).
# Esse é o "pacote final" que vai pra runner.
#
# --legacy: pnpm 10 mudou o default e agora exige `inject-workspace-packages`
# pra deploy "moderno". Como o api não depende de outros workspaces internos,
# o legacy mode resolve sem efeito colateral.
RUN pnpm deploy --filter=@odontoarte/api --prod --legacy /deploy

# Gotcha do Prisma + pnpm 10: o client gerado vive em `.prisma/client/` que
# pnpm deploy não copia automaticamente. Sem isso, em runtime o import de
# `@prisma/client` falha com "PrismaClient is not exported". Find + copy.
RUN PRISMA_SRC=$(find /repo/node_modules/.pnpm -type d -name ".prisma" | head -1) && \
    if [ -z "$PRISMA_SRC" ]; then PRISMA_SRC=$(find /repo -type d -name ".prisma" -not -path "*/node_modules/.pnpm/*" | head -1); fi && \
    echo "Found .prisma at: $PRISMA_SRC" && \
    cp -R "$PRISMA_SRC" /deploy/node_modules/.prisma

# ============================================================
# Estágio 2: runner
# ============================================================
FROM node:24-slim AS runner
WORKDIR /app

# OpenSSL também em runtime — Prisma client faz handshake com o banco usando.
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copia o pacote já preparado pelo builder, com ownership pro usuário node.
COPY --from=builder --chown=node:node /deploy ./

# Roda como usuário não-root (segurança: se houver escape do container, não
# vira root no host).
USER node

# Sinaliza pro Node + libs (Prisma, Fastify) que estamos em produção.
# Habilita otimizações e desliga logs verbosos.
ENV NODE_ENV=production

# Documenta a porta que o app escuta. A Fly faz proxy automático pra cá.
EXPOSE 3001

# Sem migration no boot — rodamos manualmente antes do deploy via
# "prisma migrate deploy" apontando pra Neon (próxima fase).
CMD ["node", "dist/server.js"]
