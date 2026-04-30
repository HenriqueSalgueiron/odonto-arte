# routes/dentists/prices — preços específicos por dentista

Override de preço por par `(dentista, serviço)`. Quando existe, prevalece sobre o preço-tabela do `Service`. Quando não existe, o preço efetivo é o preço-tabela. Modela a Etapa 8 do roadmap.

URLs ficam aninhadas sob o dentista — registradas dentro de `dentists/index.ts` com prefixo `/:dentistId/prices`. A UI sempre opera no contexto de um dentista, então não há `GET /:id` avulso para um override.

## Regras de negócio

- **Chave composta na URL.** `PUT/DELETE /dentists/:dentistId/prices/:serviceId`. O modelo `SpecificPrice` tem UUID próprio (`id`), mas o par `(dentistId, serviceId)` é o identificador natural — usar a chave composta evita um round-trip extra para descobrir o UUID.
- **PUT é upsert idempotente.** Não há POST separado. Mesmo body em chamadas repetidas converge para o mesmo estado. `updatedAt` avança a cada chamada que passa por `update`, `createdAt` permanece da primeira gravação.
- **DELETE é hard delete e idempotente.** Diferente de `Dentist`/`Service`, não existe `active` em `SpecificPrice`. A ausência da linha já significa "vale o preço-tabela" — não há informação a preservar. Snapshots históricos para ordens de serviço usam `ServiceOrderItem.priceSnapshot`, não dependem da tabela `specific_prices`. 204 mesmo quando não há override; 404 só quando dentista ou serviço não existem.
- **Lista esconde overrides de serviços inativos.** `GET /` filtra `service.active = true`. Se um serviço com override é desativado, a linha some do retorno; o override fica órfão na tabela. Reativar o serviço faz o override reaparecer automaticamente. Sem cleanup necessário.
- **Permite criar/atualizar override em dentista ou serviço inativo.** Simétrico com `GET /dentists/:id`, que retorna inativos. Sem 409 nem regra extra. O frontend pode esconder ações em entidades inativas, mas a API não bloqueia.
- **Lista funciona para dentista inativo.** `GET /dentists/:dentistId/prices` só retorna 404 quando o dentista realmente não existe (linha ausente). Dentista soft-deletado responde normalmente.

## Resposta da listagem

Uma linha por serviço ativo, com:

- `serviceId`, `serviceName` — referência ao serviço.
- `tablePrice` — `Service.price` atual.
- `specificPrice` — `null` quando não há override; valor do override caso contrário.
- `effectivePrice` — `specificPrice ?? tablePrice`. Computado inline no handler.

Ordenação por `serviceName` ascendente.

## Decimal vs number

`SpecificPrice.price` é `Decimal(10,2)` no Postgres, igual a `Service.price`. Conversão para `number` acontece no próprio handler (`Number(saved.price)`) — não há serializer dedicado porque o shape de resposta é exclusivo deste domínio.

Validação do body usa `z.number().nonnegative().multipleOf(0.01)` — rejeita negativos e mais de 2 casas decimais.

## Erros

- 400 — `validation_error` (preço negativo, > 2 casas, body malformado, params com UUID inválido).
- 401 — sem Bearer ou token inválido (`app.authenticate`).
- 404 — `dentist_not_found` ou `service_not_found` quando o respectivo id não existe. Validados ANTES de qualquer write — ordem importa em `remove.ts` para não retornar 204 falso para serviceId inexistente.
