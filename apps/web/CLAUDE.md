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

Quando precisar de um campo com mask novo (telefone, CPF, CRO), crie `RHFXxxField` ao lado seguindo o mesmo padrão (Controller + componente MUI + transformação no `onChange`). Helpers de mask vivem em `src/lib/formatters/` (atualmente só `currency.ts` — `maskBRL`, `formatBRL`, `parseBRLInput`).

## Testes

- **Unitário** (funções puras): Vitest, `{nome}.test.ts` ao lado.
- **Hook** (hooks em `src/hooks/`, não os gerados): Vitest + `renderHook`, `{nome}.test.ts` ao lado.
- **Componente**: Vitest + Testing Library + MSW, `{nome}.test.tsx` ao lado.
- **E2E** (Cypress): em `apps/web/cypress/e2e/`.

Pasta `generated/` é excluída de testes — é código de terceiros na prática.
