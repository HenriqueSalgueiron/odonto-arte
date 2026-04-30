# routes/dentists — CRUD do cadastro de dentistas

Cadastro de dentistas que enviam trabalhos ao laboratório. Junto com o catálogo de serviços, é base para preços específicos por dentista (Etapa 8) e para as ordens de serviço da Fase 2.

## Regras de negócio

- **Soft delete.** `DELETE /:id` marca `active = false`, não apaga linha. `Dentist` é referenciado por `SpecificPrice` e (Fase 2) `ServiceOrder` — apagar fisicamente romperia o histórico de preços negociados e de ordens passadas. Idempotente: 204 em ids existentes (ativos ou já inativos), 404 só quando o id não existe.
- **Reativação via PUT.** Para reativar um dentista inativo, `PUT /:id { active: true }`. Sem endpoint dedicado — o update já cobre.
- **Listagem default só ativos.** `GET /` retorna apenas `active=true`. Para mostrar inativos no admin, `?includeInactive=true`.
- **Busca é client-side.** Volume baixo (~100 dentistas) — frontend filtra em memória sobre o list completo. Não há endpoint de search.
- **Auth obrigatória.** Todas as 5 rotas usam `preHandler: app.authenticate`. Cadastro é privado do laboratório.

## Campos opcionais

`cro`, `phone`, `email` e `notes` são todos `nullish` no body (ausentes ou `null`) e persistidos como `null` quando não informados (`?? null` no handler de create; mesma normalização em update). No JSON respondem como `nullable`.

- `cro`: string livre até 20 chars. Não validamos formato — varia por estado e há padrões diferentes (numérico, com prefixo de UF). Cabe ao usuário digitar como prefere.
- `phone`: string livre até 30 chars. **Sem normalização no backend** — a máscara BR é cosmética e vive no frontend (`maskBRPhone`). O backend guarda o que recebe.
- `email`: validado com `z.email()` quando preenchido. `nullish` permite omitir; string vazia não é aceita (Zod email rejeita).
- `notes`: até 2000 chars, multiline.

## Erros

- 400 — Zod rejeita o body/params/query (inclui email mal formado). Tratado pelo `errorHandlerPlugin` global.
- 401 — sem Bearer ou token inválido (do `app.authenticate`).
- 404 — `dentist_not_found` em GET/PUT/DELETE quando o id não existe (mapeado de `Prisma.P2025` para PUT/DELETE; chequeado direto no GET).
