# routes/services — CRUD do catálogo de serviços

Catálogo dos serviços que o laboratório executa (PPR, dentadura, placa de bruxismo, coroa, etc.). É a base do produto: tudo no domínio de preços e ordens depende daqui.

## Regras de negócio

- **Soft delete.** `DELETE /:id` marca `active = false`, não apaga linha. `Service` é referenciado por `SpecificPrice` e (Fase 2) `ServiceOrderItem` — apagar fisicamente romperia histórico de preços e de ordens passadas. Idempotente: 204 em ids existentes (ativos ou já inativos), 404 só quando o id não existe.
- **Reativação via PUT.** Para reativar um serviço inativo, `PUT /:id { active: true }`. Sem endpoint dedicado — o update já cobre.
- **Listagem default só ativos.** `GET /` retorna apenas `active=true`. Para mostrar inativos no admin, `?includeInactive=true`.
- **Busca é client-side.** Volume baixo (~30 serviços) — frontend filtra em memória sobre o list completo. Não há endpoint de search.
- **Auth obrigatória.** Todas as 5 rotas usam `preHandler: app.authenticate`. Catálogo é privado do laboratório.

## Decimal vs number

`price` é `Decimal(10,2)` no Postgres (precisão exata para BRL, range até 99.999.999,99). No JSON responde como `number` simples — todos os preços de prótese cabem com folga em IEEE-754 sem perda. A conversão Prisma `Decimal` → `number` acontece em `serializer.ts` (`Number(service.price)`).

A validação do body usa `z.number().multipleOf(0.01)` para rejeitar valores com mais de 2 casas (`R$ 250,123` → 400). Combinado com `nonnegative()`, garante que só números válidos de BRL chegam ao Prisma.

## Erros

- 400 — Zod rejeita o body/params/query. Tratado pelo `errorHandlerPlugin` global.
- 401 — sem Bearer ou token inválido (do `app.authenticate`).
- 404 — `service_not_found` em GET/PUT/DELETE quando o id não existe (mapeado de `Prisma.P2025` para PUT/DELETE; chequeado direto no GET).
