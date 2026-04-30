# routes/categories — CRUD de categorias de serviço

Categorias agrupam serviços do catálogo (PPRs, dentaduras, placas, coroas...). Servem dois propósitos: chip indicativo na listagem de serviços e — na Etapa 12 — agrupamento por seção no PDF da tabela de preços.

## Regras de negócio

- **Nome `"Diversos"` reservado.** A validação Zod (`categoryNameSchema`) rejeita o nome em qualquer caixa (`Diversos`, `diversos`, `DIVERSOS`, com whitespace ao redor depois do `trim`). É reservado para o **bucket virtual** do PDF: serviços com `categoryId = null` aparecem agrupados sob "Diversos" na exportação. Permitir uma categoria persistida com esse nome causaria colisão de seções.
- **Hard delete, não soft delete.** Diferente de `Service` e `Dentist`, `Category` não tem campo `active`. `DELETE /:id` apaga a linha; serviços associados ficam com `categoryId = null` graças à FK `ON DELETE SET NULL` no schema. O `null` resultante já é o mesmo estado de "sem categoria" que o produto suporta — não tem ganho em manter uma categoria zumbi.
- **`serviceCount` agregado.** Toda resposta de category inclui `serviceCount` calculado via `_count.services` do Prisma. A UI usa esse número antes do confirm de delete ("X serviços ficarão sem categoria") sem precisar de uma rota extra.
- **Sem busca server-side, sem paginação.** Volume baixo (~30 categorias no total estimado). O frontend lista tudo de uma vez; busca/filtragem fica no cliente quando precisar.
- **Auth obrigatória.** As 5 rotas usam `preHandler: app.authenticate`.

## Erros

- 400 — Zod rejeita o body/params (inclui o nome reservado "Diversos").
- 400 (em `services`) — `category_not_found`: tentar criar/atualizar serviço apontando para categoryId inexistente. Mapeado de `Prisma.P2003` (FK violation).
- 401 — sem Bearer ou token inválido.
- 404 — `category_not_found`: GET/PUT/DELETE com id que não existe. PUT/DELETE mapeiam de `Prisma.P2025`.
- 409 — `category_name_taken`: POST/PUT com nome que já existe (constraint unique). Mapeado de `Prisma.P2002`.
