# Stack Técnica

Todas as escolhas abaixo são intencionais. Não substituir por alternativas sem justificativa explícita.

## Frontend

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

## Backend

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

## Pipeline de Tipos (fonte de verdade → frontend)

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

A fonte de verdade é o backend. O frontend não define tipos nem schemas manualmente — tudo é gerado pelo Kubb. Não existe `packages/shared`; o Kubb substitui essa necessidade.

Quando um endpoint muda no backend:
1. O schema Zod da rota é atualizado em `apps/api`.
2. O Swagger regenera a spec.
3. Rodar `pnpm kubb` (ou via script no Turborepo) regenera o código no frontend.
4. Se houver breaking change, o TypeScript aponta onde o frontend precisa se adaptar.

## Banco de Dados e Cache

| Tecnologia | Função | Justificativa |
|---|---|---|
| **PostgreSQL** | Banco relacional | Dados altamente relacionais (dentista ↔ preço ↔ serviço). Padrão de mercado em backend Node. Free tier gerenciado resolve backup automático. |
| **Neon** | Hosting do Postgres | Free tier sem limite de tempo: 0.5GB storage. Não pausa permanentemente (reativa em ~1s na primeira query, diferente do Supabase que pausa após 1 semana). Branching de banco (útil para testar migrations). |
| **Redis (Upstash)** | Cache / sessões | Armazena refresh tokens com TTL nativo (expiram e são deletados automaticamente). Dados efêmeros pertencem a um store efêmero, não a um banco relacional. Upstash é serverless (REST API, sem conexão persistente), free tier de 10k comandos/dia. Padrão de mercado para sessões em aplicações profissionais. |

## Infraestrutura e Deploy

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

## AWS (Fases futuras — não no MVP)

Serviços AWS que entram nas fases posteriores. Todos dentro do free tier.

| Tecnologia | Fase | Função | Justificativa |
|---|---|---|---|
| **S3** | Fase 2 | Armazenamento de arquivos (fotos de fichas, trabalhos) | Padrão de mercado para armazenamento de objetos. Free tier: 5GB, 20k GET/mês, 2k PUT/mês. Upload via `@aws-sdk/client-s3`, acesso via presigned URLs. |
| **IAM** | Fase 2 | Controle de permissões AWS | Configurar usuário com política de menor privilégio (apenas S3 read/write no bucket do projeto). Obrigatório quando qualquer serviço AWS é usado. |
| **SES** | Fase 3 | Envio de emails transacionais | Envio da tabela de preços por email, recuperação de senha. Free tier: 200 emails/dia. |
