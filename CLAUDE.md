# OdontoArte — Sistema de Gestão de Laboratório de Prótese

Documento de definição do projeto. Serve como contexto inicial para desenvolvimento assistido por IA (Claude Code) e como referência durante toda a construção.

---

## 1. Visão do Produto

Sistema web para gestão de um laboratório de prótese dentária familiar chamado OdontoArte. Substitui uma planilha Excel hoje usada para controlar preços de serviços, eliminando a fricção de localizar arquivo, abrir Excel, formatar e exportar PDF.

Em fases posteriores, substitui também o controle em papel das ordens de serviço (fichas) que entram no laboratório.

### Princípios

- **Simplicidade acima de completude.** A usuária principal tem baixa familiaridade técnica. Toda decisão de UX deve favorecer clareza e previsibilidade.
- **Acessível de qualquer lugar.** Sem instalar nada, sem "abrir arquivo". URL fixa, login persistente, instalável como app no celular (PWA).
- **Confiável.** Os dados são o ativo principal do laboratório. Backup automático via banco gerenciado. Nunca depender da memória da usuária.

---

## 2. Personas e Contexto

### Usuária principal

- Co-proprietária do laboratório, responsável pela gestão administrativa.
- Conhecimento técnico baixo: dificuldade para localizar arquivos, formatar planilhas, exportar PDFs.
- Usa principalmente celular para tarefas rápidas; computador ocasionalmente.

### Contexto do laboratório

- Volume estimado: até ~100 dentistas cadastrados, ~30 serviços diferentes (PPR, dentadura, placa de bruxismo, coroa, etc.).
- Cada dentista pode ter preços específicos (negociados) que diferem do preço-tabela geral.
- Periodicamente há ajustes globais nos preços (geralmente anuais).
- Cada trabalho que entra vem com uma "caixinha" (molde + insumos) e uma "ficha" em papel preenchida pelo dentista (paciente, cor do dente, tipo de serviço, observações). Essas fichas são arquivadas em pastas físicas.

---

## 3. Escopo

### Fase 1 — MVP (implementar)

**Autenticação**
- Login por email + senha.
- Sessão persistente com refresh token — usuária não precisa logar todo dia.
- Modelo de dados preparado para múltiplos usuários, mas inicialmente apenas um (conta criada via seed).
- Implementação manual: hash com Argon2id (@node-rs/argon2), access token JWT (jose, 15min de vida), refresh token opaco (string aleatória, armazenado no Redis com TTL automático).
- Tokens armazenados em localStorage no frontend, enviados via header Authorization. Decisão consciente: em produção com domínio próprio, migraria para cookies httpOnly. No contexto atual (domínios separados em free tier, app interno sem conteúdo de terceiros), localStorage com access token de vida curta + refresh token rotation é a abordagem pragmática.
- Endpoints: POST /auth/login, POST /auth/refresh, POST /auth/logout, GET /auth/me.

**Cadastro de serviços**
- CRUD completo (nome, descrição opcional, preço-tabela em BRL).
- Listagem com busca por nome.

**Cadastro de dentistas**
- CRUD completo (nome, CRO opcional, telefone, email, observações).
- Listagem com busca por nome.

**Tabela de preços por dentista**
- Para cada dentista, definir preços específicos por serviço (override do preço-tabela).
- Quando não há preço específico, vale o preço-tabela do serviço.
- Interface mostrando para um dentista quais serviços têm preço próprio e quais usam o padrão.
- Permitir definir/remover preço específico facilmente.

**Ajuste global de preços**
- Aplicar percentual de aumento (ou redução) em todos os serviços de uma vez (ex: "+8% em tudo").
- Confirmação com preview do antes/depois antes de aplicar.
- Escopo: o ajuste afeta apenas preços-tabela. Preços específicos por dentista permanecem inalterados (a usuária ajusta caso a caso se quiser). Documentar isso na UI.

**Exportação de PDF (gerada no frontend)**
- Exportar tabela de preços geral (todos os serviços com preço-tabela).
- Exportar tabela de preços de um dentista específico (preço efetivo: específico se houver, tabela caso contrário).
- PDF com cabeçalho do laboratório (nome, contato), data de emissão, formatação limpa.
- Usar react-pdf (@react-pdf/renderer) no frontend.

**PWA**
- Manifest + service worker básico via vite-plugin-pwa.
- Permite "Add to Home Screen" no celular da usuária.
- Sem requisito offline. Service worker apenas para experiência de app instalável.

### Fase 2 — Ordens de Serviço (modelar no banco, não implementar)

Substituir o controle em papel das fichas de serviço.

- Cadastro de ordem de serviço: dentista, paciente (nome), serviço(s), cor do dente, data de entrada, previsão de entrega, observações, status.
- Status possíveis (a refinar): recebido, em_producao, pronto, entregue.
- Histórico por dentista e por paciente.
- Anexar fotos da ficha original ou do trabalho. Armazenamento de arquivos via **AWS S3** (upload pelo backend com `@aws-sdk/client-s3`, acesso via presigned URLs com expiração). Configurar bucket S3 com permissões IAM de menor privilégio (apenas upload e leitura).
- Listagem filtrável por status, dentista, período.

### Fase 3+ — Possíveis evoluções (apenas registrar)

- Envio automático da tabela de preços por email para o dentista via **AWS SES** (Simple Email Service). Configurar domínio verificado, templates de email, envio transacional.
- Envio por WhatsApp (avaliar integrações disponíveis).
- Relatórios financeiros (faturamento por dentista, serviço, período).
- Notificações de prazos de entrega.
- Multi-usuário com perfis (admin, técnico, recepção).
- Recuperação de senha por email (via SES).

---

## 4. Stack Técnica

Todas as escolhas abaixo são intencionais. Não substituir por alternativas sem justificativa explícita.

### Frontend

| Tecnologia | Função | Justificativa |
|---|---|---|
| **Vite** | Build tool e dev server | Não há necessidade de SSR/SEO (app privado, atrás de login). Next.js agregaria complexidade sem entregar benefícios reais. Vite é mais rápido, mais simples, mental model direto. |
| **React** | UI library | Ecossistema maduro, familiaridade do desenvolvedor. |
| **React Router** | Roteamento | Roteamento client-side para SPA. |
| **TypeScript** | Linguagem | Padrão de mercado, segurança de tipos, integração com pipeline de tipos Kubb. |
| **MUI (Material UI)** | Componentes de UI e sistema de estilização | Componentes prontos, acessíveis e consistentes. Sistema de tema centralizado (paleta, tipografia, espaçamento). Sem Tailwind — MUI cuida de toda estilização via theme + sx prop + Emotion. Evita conflito de dois sistemas de CSS. |
| **TanStack Query** | Estado de servidor | Cache, invalidação, mutations. Hooks gerados automaticamente pelo Kubb. |
| **React Hook Form** | Formulários | Performance (uncontrolled by default), integração com Zod via resolver. |
| **Zod** | Validação de formulários | Schemas gerados pelo Kubb a partir da spec OpenAPI. Usados como resolver no React Hook Form. |
| **react-pdf (@react-pdf/renderer)** | Geração de PDF | Gera PDF no navegador, sem custo de servidor, sem Chromium no backend. |
| **vite-plugin-pwa** | PWA | Manifest + service worker para instalação no celular. Sem requisito offline. |
| **Sentry (@sentry/react)** | Error tracking + performance | Captura erros automaticamente com contexto. Mede Web Vitals e performance de rotas. Free tier suficiente. |
| **MSW (Mock Service Worker)** | Mock de API nos testes | Intercepta requests no nível de rede. Desacopla testes de componente do backend real. |
| **Cypress** | Testes E2E | Testes end-to-end no navegador real. Simula fluxos completos da usuária. |

**Não usar Tailwind CSS.** MUI cuida de toda estilização. Misturar dois sistemas de CSS gera inconsistência.

### Backend

| Tecnologia | Função | Justificativa |
|---|---|---|
| **Node.js + Fastify** | Framework HTTP | Performance, ergonomia com TypeScript, sistema de plugins robusto, logger Pino embutido. Familiaridade do desenvolvedor. |
| **TypeScript** | Linguagem | Mesma linguagem no monorepo inteiro. |
| **Prisma** | ORM | Migrations versionadas, schema declarativo, type safety, integração com Neon Postgres. |
| **Zod** | Validação de requests | Schemas Zod definem o contrato da API. Validam body/params/query nas rotas do Fastify. |
| **fastify-type-provider-zod** | Integração Zod + Fastify | Permite usar schemas Zod diretamente na definição das rotas. Converte para JSON Schema internamente. Alimenta o Swagger. |
| **@fastify/swagger + @fastify/swagger-ui** | Documentação OpenAPI | Gera spec OpenAPI automaticamente a partir dos schemas das rotas. Serve UI interativa em /docs. Alimenta o Kubb. |
| **jose** | JWT | Gerar e validar access tokens (JWT assinado, 15min). Moderno, boa tipagem TS. |
| **@node-rs/argon2** | Hash de senha | Argon2id, estado da arte em hash de senhas. Binding nativo em Rust, rápido. |
| **@upstash/redis** | Redis client | Conexão com Upstash Redis via REST API. Armazena refresh tokens com TTL automático (expiram sozinhos, sem job de limpeza). Serverless, funciona em qualquer ambiente. |
| **@fastify/cors** | CORS | Liberar requests do frontend (domínios diferentes: Vercel ↔ Fly). |
| **Pino** (embutido no Fastify) | Logging estruturado | Logs JSON automáticos de cada request. Configuração padrão do Fastify, sem setup extra. Enriquecer com logs customizados nos handlers conforme necessidade. |
| **Sentry (@sentry/node)** | Error tracking + performance | Captura exceções com contexto da request. Mede duração de requests e queries. Free tier suficiente. |

### Pipeline de Tipos (fonte de verdade → frontend)

```
Schemas Zod (definidos no backend, apps/api)
  → Fastify valida requests/responses
  → @fastify/swagger gera spec OpenAPI (JSON)
  → Kubb lê a spec e gera no frontend (apps/web/src/generated/):
      → tipos TypeScript
      → hooks de TanStack Query
      → cliente HTTP tipado
      → schemas Zod para validação de formulários
```

A fonte de verdade é o backend. O frontend não define tipos nem schemas manualmente — tudo é gerado pelo Kubb. Não existe packages/shared; o Kubb substitui essa necessidade.

Quando um endpoint muda no backend:
1. O schema Zod da rota é atualizado em apps/api.
2. O Swagger regenera a spec.
3. Rodar `pnpm kubb` (ou via script no Turborepo) regenera o código no frontend.
4. Se houver breaking change, o TypeScript aponta onde o frontend precisa se adaptar.

### Banco de Dados e Cache

| Tecnologia | Função | Justificativa |
|---|---|---|
| **PostgreSQL** | Banco relacional | Dados altamente relacionais (dentista ↔ preço ↔ serviço). Padrão de mercado em backend Node. Free tier gerenciado resolve backup automático. |
| **Neon** | Hosting do Postgres | Free tier sem limite de tempo: 0.5GB storage. Não pausa permanentemente (reativa em ~1s na primeira query, diferente do Supabase que pausa após 1 semana). Branching de banco (útil para testar migrations). |
| **Redis (Upstash)** | Cache / sessões | Armazena refresh tokens com TTL nativo (expiram e são deletados automaticamente). Dados efêmeros pertencem a um store efêmero, não a um banco relacional. Upstash é serverless (REST API, sem conexão persistente), free tier de 10k comandos/dia. Padrão de mercado para sessões em aplicações profissionais. |

### Infraestrutura e Deploy

| Tecnologia | Função | Justificativa |
|---|---|---|
| **Fly.io** | Hosting do backend | Free tier: até 3 VMs pequenas sempre ligadas. Requer Dockerfile — aprendizado real de Docker sem custo de VPS. Backend não "dorme". |
| **Vercel** | Hosting do frontend | Free tier generoso. Deploy automático via git push. CDN global. Hospeda SPA estática do Vite sem problema. |
| **GitHub Actions** | CI/CD | Pipeline: push na main → rodar testes (front e back) → deploy frontend na Vercel → deploy backend no Fly.io → rodar migrations no Neon. |
| **Docker** | Container do backend | Dockerfile multi-stage para a API Fastify. Aprendizado de Docker (layers, cache, multi-stage build, healthcheck) sem administrar servidor. |
| **pnpm** | Package manager | Rápido, eficiente em disco, suporte nativo a workspaces para monorepo. |
| **Turborepo** | Monorepo tooling | Cache inteligente de builds e tasks. Orquestra dependências entre pacotes (ex: Kubb gera antes do build do frontend). Configuração mínima (um turbo.json). |

### Custo total: R$ 0

Todos os serviços utilizados possuem free tier suficiente para esse projeto.

### AWS (Fases futuras — não no MVP)

Serviços AWS que entram nas fases posteriores. Todos dentro do free tier.

| Tecnologia | Fase | Função | Justificativa |
|---|---|---|---|
| **S3** | Fase 2 | Armazenamento de arquivos (fotos de fichas, trabalhos) | Padrão de mercado para armazenamento de objetos. Free tier: 5GB, 20k GET/mês, 2k PUT/mês. Upload via `@aws-sdk/client-s3`, acesso via presigned URLs. |
| **IAM** | Fase 2 | Controle de permissões AWS | Configurar usuário com política de menor privilégio (apenas S3 read/write no bucket do projeto). Obrigatório quando qualquer serviço AWS é usado. |
| **SES** | Fase 3 | Envio de emails transacionais | Envio da tabela de preços por email, recuperação de senha. Free tier: 200 emails/dia. |

---

## 5. Arquitetura do Monorepo

```
odontoarte/
├── apps/
│   ├── web/                          # Frontend (Vite + React)
│   │   ├── src/
│   │   │   ├── generated/            # Gerado pelo Kubb — gitignored, regenerar com `pnpm kubb`
│   │   │   ├── components/           # Componentes reutilizáveis
│   │   │   ├── pages/                # Páginas/rotas
│   │   │   ├── hooks/                # Hooks customizados (wrappers sobre os gerados, quando necessário)
│   │   │   ├── lib/                  # Utilitários (httpClient, pdf generation, formatadores)
│   │   │   ├── theme/                # Configuração do tema MUI
│   │   │   └── App.tsx
│   │   ├── public/                   # Assets estáticos, ícones PWA
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── api/                          # Backend (Fastify + Prisma)
│       ├── src/
│       │   ├── routes/               # Rotas organizadas por domínio (auth/, services/, dentists/, prices/)
│       │   ├── schemas/              # Schemas Zod (fonte de verdade dos tipos)
│       │   ├── middlewares/          # Auth middleware, error handler
│       │   ├── plugins/              # Plugins Fastify (swagger, cors, auth)
│       │   ├── lib/                  # Utilitários (token generation, password hashing)
│       │   └── server.ts             # Entry point
│       ├── scripts/
│       │   └── generateOpenapi.ts    # Builda o app headless e escreve openapi.json (input do Kubb)
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seed.ts               # Seed: cria usuária inicial (mãe)
│       ├── openapi.json              # Artefato gerado (gitignored) — lido pelo Kubb
│       ├── Dockerfile                # Multi-stage build para Fly.io
│       └── package.json
│
├── kubb.config.ts                    # Configuração do Kubb (lê spec OpenAPI, gera em apps/web/src/generated/)
├── turbo.json                        # Configuração do Turborepo
├── pnpm-workspace.yaml               # Define workspaces: apps/*
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions: test → deploy
├── CLAUDE.md                         # Este arquivo (contexto para Claude Code)
└── README.md                         # Documentação para humanos/portfólio
```

---

## 6. Modelagem de Dados (Prisma Schema)

Fase 1 (implementar) e Fase 2 (apenas modelar) juntas, para evitar migrations dolorosas no futuro.

Identificadores em inglês (modelos, campos, enums) seguindo § 9 das convenções; strings de UI ficam em português na camada de aplicação.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ========================
// AUTH
// ========================

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  name         String
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("users")
}

// Refresh tokens não vivem no banco relacional.
// São armazenados no Redis (Upstash) com TTL automático de 30 dias.
// Chave: refresh:{userId}:{tokenId} → valor: refresh token string.
// Expiram e são deletados automaticamente pelo Redis.

// ========================
// FASE 1 — MVP
// ========================

model Service {
  id          String   @id @default(uuid())
  name        String
  description String?
  price       Decimal  @db.Decimal(10, 2)  // preço-tabela em BRL
  active      Boolean  @default(true)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  specificPrices SpecificPrice[]
  orderItems     ServiceOrderItem[]    // Fase 2

  @@map("services")
}

model Dentist {
  id        String   @id @default(uuid())
  name      String
  cro       String?
  phone     String?
  email     String?
  notes     String?
  active    Boolean  @default(true)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  specificPrices SpecificPrice[]
  serviceOrders  ServiceOrder[]        // Fase 2

  @@map("dentists")
}

model SpecificPrice {
  id        String   @id @default(uuid())
  dentistId String   @map("dentist_id")
  serviceId String   @map("service_id")
  price     Decimal  @db.Decimal(10, 2)  // preço negociado para este dentista
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  dentist Dentist @relation(fields: [dentistId], references: [id], onDelete: Cascade)
  service Service @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  @@unique([dentistId, serviceId])  // um preço específico por par dentista-serviço
  @@map("specific_prices")
}

// ========================
// FASE 2 — Ordens de Serviço (modelar agora, implementar depois)
// ========================

enum OrderStatus {
  RECEIVED
  IN_PRODUCTION
  READY
  DELIVERED
}

model ServiceOrder {
  id                  String      @id @default(uuid())
  dentistId           String      @map("dentist_id")
  patientName         String      @map("patient_name")
  toothShade          String?     @map("tooth_shade")
  notes               String?
  status              OrderStatus @default(RECEIVED)
  receivedAt          DateTime    @default(now()) @map("received_at")
  estimatedDeliveryAt DateTime?   @map("estimated_delivery_at")
  deliveredAt         DateTime?   @map("delivered_at")
  createdAt           DateTime    @default(now()) @map("created_at")
  updatedAt           DateTime    @updatedAt @map("updated_at")

  dentist     Dentist            @relation(fields: [dentistId], references: [id])
  items       ServiceOrderItem[]
  attachments OrderAttachment[]

  @@map("service_orders")
}

model ServiceOrderItem {
  id             String  @id @default(uuid())
  serviceOrderId String  @map("service_order_id")
  serviceId      String  @map("service_id")
  priceSnapshot  Decimal @db.Decimal(10, 2) @map("price_snapshot") // snapshot do preço no momento da entrada
  notes          String?

  serviceOrder ServiceOrder @relation(fields: [serviceOrderId], references: [id], onDelete: Cascade)
  service      Service      @relation(fields: [serviceId], references: [id])

  @@map("service_order_items")
}

model OrderAttachment {
  id             String   @id @default(uuid())
  serviceOrderId String   @map("service_order_id")
  url            String                // chave do objeto no S3 (presigned URL gerada sob demanda)
  kind           String                // "intake_form", "work_photo", etc.
  createdAt      DateTime @default(now()) @map("created_at")

  serviceOrder ServiceOrder @relation(fields: [serviceOrderId], references: [id], onDelete: Cascade)

  @@map("order_attachments")
}
```

Notas sobre a modelagem:
- Todas as tabelas usam `@@map` para nomes em snake_case no banco (convenção SQL), enquanto o Prisma Client mantém camelCase no código TypeScript.
- `SpecificPrice` tem constraint unique em `[dentistId, serviceId]` — só pode existir um preço negociado por par dentista-serviço.
- `ServiceOrderItem.priceSnapshot` é um snapshot: grava o preço que valia quando o trabalho entrou, mesmo que o preço mude depois. Essencial para histórico financeiro correto.
- Campo `active` em Service e Dentist permite soft delete (desativar sem perder histórico).
- Refresh tokens NÃO vivem no Postgres — estão no Redis (Upstash) com TTL automático. O Postgres guarda apenas dados de domínio persistentes.
- Fase 2 já está modelada. As migrations vão criar todas as tabelas, mas o código da Fase 2 (rotas, UI) não será implementado agora. As relações já existem (`serviceOrders`, `ServiceOrderItem`, `OrderAttachment`) para que não seja necessário alterar tabelas existentes quando a Fase 2 for implementada.

---

## 7. Fluxo de Autenticação (detalhe)

### Refresh tokens no Redis

Refresh tokens são armazenados no Redis (Upstash), não no Postgres. Cada token é uma chave com TTL automático:

- Chave: `refresh:{userId}:{tokenId}`
- Valor: o refresh token string
- TTL: 30 dias (o Redis deleta automaticamente quando expira)

Operações:
- **Criar sessão:** `SET refresh:{userId}:{tokenId} {token} EX 2592000` (30 dias em segundos)
- **Validar:** `GET refresh:{userId}:{tokenId}` e comparar com o token recebido
- **Invalidar (logout):** `DEL refresh:{userId}:{tokenId}`
- **Invalidar todas (logout de todos os dispositivos):** deletar todas as chaves com prefixo `refresh:{userId}:*`

### Login
1. Frontend envia POST /auth/login com { email, senha }.
2. Backend busca usuário por email no Postgres. Se não existe, retorna 401.
3. Backend compara senha com hash usando Argon2id. Se não bate, retorna 401.
4. Backend gera access token JWT (15min) assinado com chave secreta (variável de ambiente JWT_SECRET).
5. Backend gera refresh token opaco (64 bytes aleatórios, codificado em base64url), salva no Redis com TTL de 30 dias.
6. Backend retorna { accessToken, refreshToken } no body.
7. Frontend salva ambos em localStorage.
8. Toda request subsequente inclui header: Authorization: Bearer {accessToken}.

### Refresh
1. Access token expira (frontend recebe 401).
2. Frontend envia POST /auth/refresh com { refreshToken }.
3. Backend decodifica o JWT expirado para extrair userId e tokenId, busca no Redis. Se não existe, retorna 401 (frontend redireciona para login).
4. Backend deleta a chave antiga no Redis, cria uma nova com novo refresh token (rotation — cada refresh token é usado uma única vez).
5. Backend gera novo access token.
6. Retorna { accessToken, refreshToken }.
7. Frontend atualiza localStorage.

### Logout
1. Frontend envia POST /auth/logout com { refreshToken }.
2. Backend deleta a chave no Redis.
3. Frontend limpa localStorage e redireciona para login.

### Middleware de proteção
- Toda rota exceto /auth/* passa por um middleware que valida o access token JWT.
- Se inválido ou expirado, retorna 401.
- Se válido, injeta o usuário decodificado no request (request.user).
- O middleware NÃO consulta Redis nem Postgres — apenas valida a assinatura do JWT. Isso é o que torna a validação rápida (stateless).

---

## 8. Infraestrutura e Deploy

### Ambientes

- **Local (dev):** `pnpm dev` roda frontend (Vite, porta 5173) e backend (Fastify, porta 3000) simultaneamente via Turborepo. Banco: Postgres local via Docker Compose (zero latência, funciona offline, reseta fácil). Redis: Upstash (instância "dev" separada da de produção — mesmo SDK, sem divergência entre ambientes, sem Redis local).
- **Neon branch (pré-produção):** usado pontualmente para testar migrations antes de aplicar em produção. Criar branch no Neon, apontar `DATABASE_URL` pra ela, rodar `prisma migrate deploy`, validar, e depois aplicar em produção com confiança.
- **Produção:** frontend na Vercel, backend no Fly.io, banco no Neon, sessões no Upstash Redis.

### Docker Compose para desenvolvimento local

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

### Dockerfile do backend (apps/api/Dockerfile)

Multi-stage build:
1. **Stage "deps"**: instala dependências de produção com pnpm.
2. **Stage "build"**: roda build TypeScript.
3. **Stage "runner"**: imagem final mínima (node:20-slim), copia apenas dist + node_modules de produção. Expõe porta, define healthcheck, inicia com `node dist/server.js`.

### CI/CD (GitHub Actions)

Trigger: push na branch main.

1. **Lint** — roda ESLint no monorepo inteiro.
2. **Build** — compila TypeScript do backend e frontend. Se falhar, pipeline para aqui (não perde tempo com testes nem deploy).
3. **Test** — roda testes do backend e do frontend em paralelo (unitários, hooks, componentes, integração).
4. **E2E** — roda testes Cypress (mais lentos, só na main).
5. **Deploy backend** — `fly deploy` a partir do Dockerfile.
6. **Migrate banco** — `prisma migrate deploy` no Neon de produção.
7. **Deploy frontend** — Vercel deploy (automático via integração git, ou via CLI).

### Variáveis de ambiente

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

---

## 9. Convenções de Código

### Geral
- **Idioma do código:** inglês (variáveis, funções, tipos, nomes de arquivos). Strings voltadas ao usuário (labels, mensagens de erro da UI) em português.
- **Nomenclatura:** camelCase para variáveis e funções, PascalCase para componentes React e tipos/interfaces, SCREAMING_SNAKE_CASE para constantes e enums.
- **Imports:** absolutos dentro de cada app (configurar aliases: `@/` aponta para `src/`).

### CLAUDE.md por domínio

O projeto usa CLAUDE.md em múltiplos níveis, não apenas na raiz. Cada arquivo dá contexto específico ao Claude Code sobre o domínio em que está trabalhando: regras de negócio, edge cases, decisões tomadas e por quê.

Estrutura:

```
odontoarte/
├── CLAUDE.md                              # geral: stack, como rodar, convenções globais
├── apps/
│   ├── api/
│   │   ├── CLAUDE.md                      # convenções do backend, estrutura de rotas, padrões de erro
│   │   └── src/
│   │       └── routes/
│   │           ├── auth/CLAUDE.md         # fluxo de auth, Redis, refresh token rotation, edge cases
│   │           ├── services/CLAUDE.md      # regras de CRUD, soft delete, validações
│   │           ├── dentists/CLAUDE.md      # regras de CRUD, soft delete, campos opcionais
│   │           └── prices/CLAUDE.md        # lógica de preço efetivo, ajuste global, o que afeta e o que não afeta
│   └── web/
│       └── CLAUDE.md                      # convenções do frontend, MUI, padrões de componente, aviso sobre generated/
```

No backend, cada domínio de rota tem seu CLAUDE.md com regras de negócio específicas. No frontend, CLAUDE.md fica só no nível do app — a pasta `generated/` é gitignored e apagada a cada `pnpm kubb` (não dá pra manter um CLAUDE.md lá dentro), então o aviso de "não editar manualmente" vive no `apps/web/CLAUDE.md`. Os CLAUDE.md de domínio no frontend não são necessários porque as convenções de componente são uniformes entre páginas.

### Backend
- Uma pasta por domínio dentro de `routes/`: `auth/`, `services/`, `dentists/`, `prices/`.
- Cada domínio tem seus schemas Zod no diretório `schemas/` correspondente ou em `schemas/{dominio}.ts`.
- Handlers devem ser funções puras que recebem request e reply. Lógica de negócio complexa vai em services se necessário, mas não criar camada de abstração antes da necessidade.
- Erros de negócio retornam HTTP semântico (400, 401, 404, 409) com body `{ error: string, details?: any }`.

### Frontend
- Componentes: um arquivo por componente. Se tiver mais de ~150 linhas, extrair sub-componentes.
- Páginas vivem em `pages/` espelhando a estrutura de rotas.
- Código gerado pelo Kubb em `generated/` — nunca editar manualmente. Se precisar customizar um hook, criar wrapper em `hooks/`.
- Tema MUI centralizado em `theme/`. Não usar sx com cores hardcoded — sempre referenciar o tema.

### Testes

O projeto adota testes em múltiplas camadas, cobrindo desde funções isoladas até fluxos completos no navegador.

**Ferramentas:**
- Vitest — test runner para unitários, hooks e componentes (backend e frontend).
- Testing Library (@testing-library/react) — renderização e interação com componentes React.
- MSW (Mock Service Worker) — mock de respostas da API nos testes de componente. Intercepta requests no nível de rede, sem acoplar ao cliente HTTP.
- Cypress — testes end-to-end no navegador real.
- supertest — testes de integração das rotas do backend (dispara requests HTTP reais contra o Fastify).

**Camadas no frontend:**

1. **Unitário** — funções puras sem dependência de React. Exemplos: formatar preço em BRL, calcular percentual de ajuste, montar payload para geração de PDF, validar/transformar dados. Ferramenta: Vitest. Nomenclatura: `{nome}.test.ts` ao lado do arquivo.

2. **Hook** — hooks customizados escritos manualmente (pasta `hooks/`). Testados com `renderHook` do Testing Library. NÃO testar hooks gerados pelo Kubb (pasta `generated/`) — são responsabilidade da lib, não do projeto. Exemplos: hook de auth (gerencia tokens, refresh automático), hook de preço efetivo (combina preço-tabela com específico). Ferramenta: Vitest + Testing Library. Nomenclatura: `{nome}.test.ts` ao lado do hook.

3. **Componente** — renderiza componentes isolados, verifica exibição de dados e resposta a interação (clique, digitação, submit de formulário). API mockada com MSW. Exemplos: formulário de serviço valida campos obrigatórios e exibe erros, tabela de preços exibe preço específico quando existe, modal de confirmação do ajuste global mostra preview antes/depois. Ferramenta: Vitest + Testing Library + MSW. Nomenclatura: `{nome}.test.tsx` ao lado do componente.

4. **E2E** — fluxos completos no navegador real, simulando a jornada da usuária. Backend e frontend rodando (ambiente real ou de teste). Exemplos: login → criar serviço → editar preço → verificar na listagem; criar dentista → definir preço específico → exportar PDF; ajuste global de preços com confirmação. Ferramenta: Cypress. Arquivos em `apps/web/cypress/e2e/`.

**Camadas no backend:**

1. **Unitário** — funções puras de lógica de negócio. Exemplos: cálculo de ajuste percentual sobre preços, geração/validação de tokens, hash de senha. Ferramenta: Vitest. Nomenclatura: `{nome}.test.ts` ao lado do arquivo.

2. **Integração** — rotas completas testadas via HTTP (Fastify + Prisma + banco de teste). Dispara requests reais com supertest, verifica status codes, body de resposta, efeitos no banco. Exemplos: POST /auth/login com credenciais corretas/incorretas, CRUD de serviços com validação, ajuste global de preços atualiza todos os registros. Ferramenta: Vitest + supertest. Nomenclatura: `{nome}.test.ts` ao lado do arquivo de rotas.

**Convenções gerais:**
- Nomenclatura: `{nome}.test.ts` ou `{nome}.test.tsx` ao lado do arquivo testado.
- Pasta `generated/` do Kubb é excluída de testes — não testar código de terceiros.
- MSW handlers organizados em `apps/web/src/mocks/` espelhando a estrutura de rotas da API.
- Cypress fixtures e commands em `apps/web/cypress/`.
- CI (GitHub Actions) roda unitários + hooks + componentes + integração em todo push. E2E roda em push na main (mais lento, reservado para validação final antes de deploy).

---

## 10. Roadmap de Execução (ordem sugerida)

O desenvolvimento deve seguir esta ordem. Cada item é uma unidade que pode ser feita em uma sessão com o Claude Code.

Testes são escritos JUNTO com cada feature, não depois. Cada etapa que envolve código de negócio inclui os testes correspondentes da(s) camada(s) aplicável(is).

### Etapa 1 — Setup do monorepo
- Inicializar repo com pnpm workspaces + Turborepo.
- Criar docker-compose.dev.yml com Postgres local.
- Configurar apps/web (Vite + React + TS + MUI + React Router) com página hello world.
- Configurar apps/api (Fastify + TS) com rota GET /health.
- Configurar Vitest em ambos os apps.
- Configurar ESLint e tsconfig compartilhados.
- Criar CLAUDE.md na raiz com visão geral do projeto.
- Verificar que `pnpm dev` roda ambos simultaneamente.
- Verificar que `pnpm test` roda testes em ambos os apps.

### Etapa 2 — Banco de dados
- Configurar Prisma em apps/api com schema completo (Fase 1 + Fase 2).
- Conectar ao Postgres local (docker-compose.dev.yml).
- Rodar migrations.
- Criar seed (usuária inicial).

### Etapa 3 — Auth no backend
- Configurar Upstash Redis (criar instância, obter credenciais, configurar @upstash/redis).
- Implementar hash de senha com Argon2id.
- Implementar geração/validação de JWT com jose.
- Implementar refresh token opaco armazenado no Redis com TTL e rotation.
- Criar rotas: login, refresh, logout, me.
- Criar middleware de proteção.
- Testes unitários: funções de hash, geração/validação de token.
- Testes de integração: rotas de auth (login com credenciais corretas/incorretas, refresh com token válido/inválido/expirado, logout).

### Etapa 4 — Swagger + Kubb
- Configurar @fastify/swagger + @fastify/swagger-ui + fastify-type-provider-zod.
- Verificar que /docs serve a documentação.
- Configurar Kubb para ler a spec e gerar código em apps/web/src/generated/.
- Configurar script no Turborepo para rodar Kubb.
- Verificar que os tipos e hooks são gerados corretamente.

### Etapa 5 — Auth no frontend
- Criar tema MUI (cores, tipografia, espaçamento).
- Configurar MSW para mock da API nos testes.
- Implementar tela de login.
- Implementar lógica de auth no frontend (salvar tokens, interceptor para Authorization header, redirect para login quando 401, refresh automático).
- Proteger rotas.
- Testes de hook: hook de auth (gerencia tokens, refresh automático, logout limpa estado).
- Testes de componente: tela de login (validação de campos, exibe erro com credenciais inválidas, redireciona após login).

### Etapa 6 — CRUD de Serviços
- Backend: rotas POST, GET (list + detail), PUT, DELETE com schemas Zod.
- Testes de integração backend: CRUD completo, validação de campos obrigatórios, resposta 404 para serviço inexistente.
- Regenerar Kubb.
- Frontend: página de listagem com busca, formulário de criação/edição, confirmação de exclusão.
- Testes de componente frontend: formulário valida campos, listagem exibe dados, busca filtra resultados.
- Testes unitários: funções de formatação de preço (BRL), utilitários relacionados.

### Etapa 7 — CRUD de Dentistas
- Mesmo padrão da etapa 6.

### Etapa 8 — Preços por Dentista
- Backend: rotas para consultar preços efetivos de um dentista, definir/atualizar/remover preço específico.
- Testes de integração backend: definir preço específico, consultar preço efetivo (retorna específico quando existe, tabela quando não), remover preço específico.
- Regenerar Kubb.
- Frontend: interface de gerenciamento de preços por dentista (lista de serviços com preço efetivo, toggle entre tabela e específico, edição inline ou modal).
- Testes de componente frontend: exibe preço correto (específico vs tabela), permite editar/remover.
- Testes de hook (se houver hook customizado de preço efetivo).

### Etapa 9 — Ajuste Global de Preços
- Backend: rota que recebe percentual e retorna preview (antes/depois) + rota que aplica o ajuste.
- Testes unitários backend: cálculo de percentual sobre preços (arredondamento, edge cases).
- Testes de integração backend: preview retorna valores corretos, aplicar ajuste atualiza todos os preços-tabela, preços específicos permanecem inalterados.
- Regenerar Kubb.
- Frontend: tela com input de percentual, tabela de preview, botão de confirmação.
- Testes de componente frontend: preview exibe antes/depois corretamente, confirmação dispara request.

### Etapa 10 — Exportação de PDF
- Implementar geração de PDF no frontend com react-pdf.
- Template com cabeçalho do laboratório, tabela de preços, data de emissão.
- Dois modos: tabela geral e tabela por dentista.
- Testes unitários: funções que montam os dados para o PDF.

### Etapa 11 — Testes E2E (Cypress)
- Configurar Cypress no projeto (apps/web/cypress/).
- Configurar scripts para rodar backend + frontend em modo de teste.
- Escrever suítes E2E dos fluxos principais:
  - Login com credenciais válidas e inválidas.
  - Criar serviço → verificar na listagem → editar → verificar alteração → excluir.
  - Criar dentista → definir preço específico → verificar preço efetivo.
  - Ajuste global de preços: aplicar percentual → verificar que preços-tabela mudaram e preços específicos não.
  - Exportar PDF (verificar que o download é disparado).

### Etapa 12 — PWA
- Configurar vite-plugin-pwa com manifest e ícones.
- Testar instalação no celular.

### Etapa 13 — Sentry
- Criar projetos no Sentry (um para frontend, um para backend).
- Integrar @sentry/react no frontend.
- Integrar @sentry/node no backend.
- Verificar que erros aparecem no dashboard.

### Etapa 14 — Docker + Deploy
- Escrever Dockerfile multi-stage para o backend.
- Testar build local com `docker build`.
- Configurar Fly.io (fly launch, fly secrets set).
- Configurar Neon para produção (criar projeto, obter connection string, configurar como secret no Fly).
- Configurar Upstash Redis de produção (criar instância, configurar como secret no Fly).
- Deploy manual do backend no Fly.
- Rodar migrations no Neon de produção (`prisma migrate deploy`).
- Rodar seed no Neon de produção (criar usuária inicial).
- Configurar Vercel para o frontend.
- Deploy manual do frontend.
- Testar fluxo completo em produção.

### Etapa 15 — CI/CD
- Configurar GitHub Actions: lint → build → testes unitários/hooks/componentes/integração → E2E (Cypress) → deploy backend → migrate → deploy frontend.
- Build roda antes dos testes: se TypeScript não compilar, pipeline para imediatamente.
- Testes E2E (Cypress) rodam em push na main apenas (mais lentos, validação final antes de deploy).
- Verificar pipeline completo com um push na main.

### Etapa 16 — README
- Escrever README para o repositório: descrição do projeto, screenshots, stack, como rodar local, link da demo, roadmap (Fase 1 ✅, Fase 2 🚧, Fase 3 📋).