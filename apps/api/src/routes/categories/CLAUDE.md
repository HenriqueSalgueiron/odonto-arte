# routes/categories — CRUD de categorias de serviço

Categorias agrupam serviços do catálogo (PPRs, dentaduras, placas, coroas...). Servem dois propósitos: chip indicativo na listagem de serviços e — na Etapa 12 — agrupamento por seção no PDF da tabela de preços.

## Superfície

Quatro rotas, intencionalmente sem `GET /:id`. A UI consome categorias só via `list` (popula o select e a confirmação de delete). Não há tela de detalhe nem outro caso que precise buscar uma categoria isolada — então não foi adicionado.

- `GET /` — lista (com `serviceCount` agregado)
- `POST /` — cria
- `PUT /:id` — renomeia
- `DELETE /:id` — remove

## Regras de negócio

- **Nome `"Diversos"` reservado.** A validação Zod (`categoryNameSchema`) rejeita o nome em qualquer caixa (`Diversos`, `diversos`, `DIVERSOS`, com whitespace ao redor depois do `trim`). É reservado para o **bucket virtual** do PDF: serviços com `categoryId = null` aparecem agrupados sob "Diversos" na exportação. Permitir uma categoria persistida com esse nome causaria colisão de seções.
- **Hard delete, não soft delete.** Diferente de `Service` e `Dentist`, `Category` não tem campo `active`. `DELETE /:id` apaga a linha; serviços associados ficam com `categoryId = null` graças à FK `ON DELETE SET NULL` no schema. O `null` resultante já é o mesmo estado de "sem categoria" que o produto suporta — não tem ganho em manter uma categoria zumbi.
- **`serviceCount` só na list.** O agregado vem do `_count.services` do Prisma e fica em `categoryListItemSchema` (= `categorySchema` + `serviceCount`). POST/PUT respondem com `categorySchema` puro. A UI usa o número antes do confirm de delete e a list é o único ponto de entrada pra ele — manter o agregado em todas as rotas seria custo (include em todo lugar) sem cliente.
- **Sem busca server-side, sem paginação.** Volume baixo (~30 categorias no total estimado). O frontend lista tudo de uma vez.
- **Auth obrigatória.** As 4 rotas usam `preHandler: app.authenticate`.

## Erros

- 400 — Zod rejeita o body/params (inclui o nome reservado "Diversos").
- 400 (em `services`) — `category_not_found`: tentar criar/atualizar serviço apontando para categoryId inexistente. Mapeado de `Prisma.P2003` (FK violation).
- 401 — sem Bearer ou token inválido.
- 404 — `category_not_found`: PUT/DELETE com id que não existe. Mapeado de `Prisma.P2025`.
- 409 — `category_name_taken`: POST/PUT com nome que já existe (constraint unique). Mapeado de `Prisma.P2002`.
