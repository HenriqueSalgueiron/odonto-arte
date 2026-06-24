# apps/web — Convenções do frontend

Frontend Vite + React + TypeScript + MUI. Este arquivo descreve como o código é organizado aqui dentro. Para visão geral do produto e stack, veja o CLAUDE.md da raiz.

## Estrutura

```
apps/web/src/
├── generated/         # Código gerado pelo Kubb (ver § "Código gerado" abaixo) — GITIGNORED
├── lib/               # Utilitários (httpClient, pdf, auth, formatadores)
├── hooks/             # Hooks escritos à mão (wrappers sobre os gerados, quando necessário)
├── pages/             # Páginas/rotas
├── components/        # Componentes reutilizáveis
├── theme/             # Tema MUI (paleta, tipografia, espaçamento)
├── App.tsx
└── main.tsx
```

## Código gerado (`src/generated/`)

**Pasta gitignored.** Não versionamos o output porque é derivado da spec OpenAPI do backend. Regenera sob demanda:

```
apps/api/src (rotas + schemas Zod)
  → pnpm --filter @odontoarte/api openapi:generate → apps/api/openapi.json
  → pnpm kubb → apps/web/src/generated/**
```

Para regenerar: `pnpm kubb` na raiz. `pnpm type-check` e `pnpm build` já encadeiam essa pipeline via Turborepo.

Subpastas:
- `types/<tag>Controller/` — tipos TS de cada endpoint (request/response/errors).
- `zod/<tag>Zod/` — schemas Zod dos bodies/responses; usar como resolver do React Hook Form.
- `clients/<tag>Client/` — funções HTTP tipadas (axios).
- `hooks/<tag>Hooks/` — hooks de TanStack Query (`useXxx`, `useXxxSuspense`, `usePostXxx` mutations).

**Nunca editar nada dentro de `generated/`.** Se precisar customizar um hook, cria wrapper em `src/hooks/` e importa o gerado lá dentro.

## HTTP client (`src/lib/httpClient.ts`)

O Kubb importa um `client` default daqui. É o ponto único onde adicionamos baseURL, Authorization header, interceptor de refresh em 401, etc. Qualquer mudança global no transporte HTTP passa por este arquivo — não configurar axios em outros lugares.

## Tema MUI

Centralizado em `src/theme/`. Não usar cores hardcoded em `sx` — sempre referenciar o tema (`theme.palette.primary.main` etc.).

## Formulários

Forms usam React Hook Form + Zod. **Não chamar `register()` direto nem usar `<Controller>` solto** — use os wrappers em `src/components/form/`:

- `RHFTextField` — TextField + Controller + propagação de erro vinda do `formState`. Aceita todas as props do MUI TextField (`type`, `multiline`, `slotProps`, etc.).
- `RHFCurrencyField` — TextField com `maskBRL` aplicado a cada keystroke + `inputMode="decimal"`. O form guarda a string formatada (`"R$ 250,00"`); converta com `parseBRLInput` antes de enviar para a API.
- `RHFPhoneField` — TextField com `maskBRPhone` aplicado a cada keystroke + `inputMode="tel"`. O form guarda a string mascarada (`"(11) 99999-8888"`); converta com `unmaskPhone` (só dígitos) antes de enviar para a API.
- `RHFSwitch` — `FormControlLabel` + `Switch` + Controller, para campos booleanos.

Padrão de uso:

```tsx
const { control, handleSubmit } = useForm<FormValues>({ ... });
return (
  <form onSubmit={handleSubmit(onSubmit)}>
    <RHFTextField control={control} name="email" label="Email" />
    <RHFCurrencyField control={control} name="price" label="Preço" />
  </form>
);
```

Quando precisar de um campo com mask novo (CPF, CRO, etc.), crie `RHFXxxField` ao lado seguindo o mesmo padrão (Controller + componente MUI + transformação no `onChange`). Helpers de mask vivem em `src/lib/formatters/` — `currency.ts` (`maskBRL`, `formatBRL`, `parseBRLInput`) e `phone.ts` (`maskBRPhone`, `unmaskPhone`).

## Testes

- **Unitário** (funções puras): Vitest, `{nome}.test.ts` ao lado.
- **Hook** (hooks em `src/hooks/`, não os gerados): Vitest + `renderHook`, `{nome}.test.ts` ao lado.
- **Componente**: Vitest + Testing Library + MSW, `{nome}.test.tsx` ao lado.
- **E2E** (Cypress): em `apps/web/cypress/e2e/`.

Pasta `generated/` é excluída de testes — é código de terceiros na prática.

## E2E (Cypress)

### Estrutura

```
apps/web/
├── cypress.config.ts        # Config principal + task db:reset
└── cypress/
    ├── e2e/
    │   ├── auth.cy.ts       # Login via UI (válido + inválido)
    │   ├── services.cy.ts   # CRUD de serviço
    │   ├── categories.cy.ts # Criar categoria inline
    │   ├── dentist-prices.cy.ts
    │   └── export-pdf.cy.ts
    ├── support/
    │   ├── e2e.ts           # Entry point
    │   └── commands.ts      # cy.login + cy.apiRequest
    └── tsconfig.json        # TS isolado (evita conflito de globals com Vitest)
```

### Como rodar

- `pnpm e2e` — headless (CI/sanity). Sobe schema `e2e`, migrations, seed, servidores, roda Cypress, mata tudo.
- `pnpm e2e:open` — modo interativo (dev/debug). Mesma orquestração, mas Cypress fica aberto e você roda specs visualmente.

O orchestrator (`scripts/e2e.ts` na raiz) faz: drop+recreate schema `e2e` → `prisma migrate deploy` → `prisma db seed` (admin user + lab info vazio) → `start-server-and-test` orquestrando `pnpm dev` + Cypress.

### Isolamento de dados

Cada teste roda com banco limpo via `cy.task("db:reset")` em `beforeEach`. O task trunca todas as tabelas **exceto `users`** (admin persiste pra `cy.login` não precisar re-hashear Argon2id a cada teste).

**Gotcha do Turborepo:** Turbo 2.x roda em strict env mode — só passa pra tasks filhas uma allowlist de env vars. `DATABASE_URL` precisa estar listada em `passThroughEnv` no `turbo.json` (no task `dev`), senão o api ignora o `?schema=e2e` injetado pelo orchestrator e acaba escrevendo no schema `public` (=dev). Bug silencioso porque o Cypress task ainda enxerga o schema certo via seu próprio processo.

### Custom commands

- `cy.login(email?, password?)` — login programático via `POST /auth/login`. Salva tokens no `localStorage` no formato Zustand persist e cacheia via `cy.session`. Defaults vêm de `Cypress.env('adminEmail')` / `adminPassword'` (injetados pelo orchestrator a partir do `.env` da api).
- `cy.apiRequest(method, path, body?)` — request autenticado pra API. Cacheia o access token em closure pelo spec inteiro (rápido pra seedar dados em vários testes sem relogar).

### O que cobre vs não cobre

E2E cobre **fluxos do usuário ponta a ponta** — clicar em botões, preencher forms, ver resultado. NÃO valida:

- **Conteúdo binário do PDF**: o `export-pdf.cy.ts` confere que o dialog abre, observação é adicionada, `PUT /export-template` é disparado e dialog fecha. **Não parseia o PDF baixado.** Validação do layout/conteúdo do PDF mora nos unit tests do `PriceListDocument` e do `buildSectionsByCategory`.
- **Drag-and-drop real**: `@dnd-kit` usa pointer events que jsdom/Cypress não simulam bem. Testes de DnD ficam nos unit tests do `CategoryOrderList`.

## PWA

A app é instalável como PWA via `vite-plugin-pwa`. Configuração em `vite.config.ts` (bloco `VitePWA`).

### Decisões

- **`registerType: "autoUpdate"`** — service worker novo ativa imediatamente quando detectado, sem pedir confirmação. Usuária sempre tá na última versão; ela pode ver o app recarregar em uma atualização (raro), mas sem prompts.
- **`devOptions.enabled: false`** — SW desligado em `pnpm dev` pra não atrapalhar HMR. Só ativa em `pnpm build` + `pnpm preview` ou em produção.
- **Sem cache offline de API.** O `workbox.globPatterns` cobre só app shell (HTML/JS/CSS/fontes/ícones). Requests pra API passam direto, sem cache. Casa com a decisão do produto de "sem requisito offline".
- **`workbox.maximumFileSizeToCacheInBytes: 3 MiB`** (default = 2 MiB). Subimos porque o bundle principal passa de 2 MiB por causa do `@react-pdf/renderer` (Yoga WASM) + MUI sem code-splitting. Volta pro default quando aplicarmos o follow-up de dynamic import (ver `docs/ROADMAP.md`).
- **`apple-touch-icon` + `theme-color` no `index.html`** (redundância com o manifest) porque iOS Safari não lê manifest do mesmo jeito que Android Chrome — sem essas meta tags, ícone no home do iPhone sai com screenshot da página.

### Ícones

Fonte única: `public/icon-source.svg` (monograma "OA" branco em gradiente azul, italic serif, drop shadow). Os PNGs derivados (`pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`, `favicon.ico`) são gerados pelo `@vite-pwa/assets-generator` via `pwa-assets.config.ts` usando o preset `minimal2023Preset`.

**Pra regerar** (depois de mexer no SVG fonte):

```
pnpm --filter web generate:pwa-assets
```

PNGs gerados são versionados (pequenos, mudam pouco) pra não precisar regerar no CI/deploy.

### Como testar

- **`pnpm dev`** — SW desligado, sem PWA.
- **`pnpm build` + `pnpm --filter web preview`** — serve o build de produção em `:4173`, com SW ativo. Chrome DevTools → Application tab mostra manifest, SW, caches.
- **`pnpm --filter web preview --host`** — mesmo, mas exposto na rede local. Pega o IP do mac (`ipconfig getifaddr en0`), abre no celular pra testar "Adicionar à tela inicial". API não funciona via IP porque a build embute `VITE_API_URL=http://localhost:3001`; é só pra testar UX de instalação.

## Sentry

`@sentry/react` captura erros do frontend automaticamente.

- **`Sentry.init` em `main.tsx`**, antes do `createRoot()`. Pulado se `VITE_SENTRY_DSN` não está setado (default em dev). Em prod (Vercel) é setado como env.
- **`Sentry.ErrorBoundary` envolve `<App />`** com fallback em `components/SentryFallback.tsx` (tela "Algo deu errado" + botão de recarregar). ErrorBoundary só pega erros **durante o render** — erros em event handlers e promises não-tratadas são capturados pelo handler global do Sentry (`window.onerror` / `unhandledrejection`) que o `init` instala automaticamente.
- **Sem performance monitoring.** `tracesSampleRate: 0`. Só captura de erros.
- **CSP precisa permitir `https://*.ingest.us.sentry.io`** no `connect-src` (`index.html`). Sem isso, o browser bloqueia o POST dos eventos pro Sentry — bug silencioso, errors aparecem no console mas não chegam no dashboard.
- **Trackers blockers (Brave Shields, uBlock, etc.) bloqueiam Sentry no client.** Em prod, usuárias com bloqueador agressivo não aparecem nos dados. Trade-off normal.
