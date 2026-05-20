# routes/export-template — Template de exportação de PDF (singleton)

Guarda a preferência da usuária para a exportação de PDF da tabela de preços (Etapa 12): ordem das categorias e lista de observações exibidas no rodapé do documento. É singleton — uma única linha — espelhando o padrão de `LabInfo`.

## Superfície

- `GET /` — retorna a linha singleton. Cria on-demand se não existir (defaults: `categoryOrder = []`, `observations = []`).
- `PUT /` — atualiza categoryOrder + observations. Cria a linha se ainda não existir.

Não há POST nem DELETE. A linha existe pra sempre depois do primeiro GET; nunca é apagada em runtime.

## Regras de negócio

- **`categoryOrder` NÃO é foreign key.** Guarda UUIDs de `Category.id` como `String[]`, sem constraint. Se uma categoria é deletada, o UUID fica órfão na lista; **o frontend filtra UUIDs órfãos em runtime** antes de aplicar a ordem ao documento. Justificativa: o "estado da verdade" do template é só preferência de UI — manter integridade referencial via FK exigiria um trigger ou rotina pra remover IDs órfãos a cada delete de Category, sem ganho prático. A filtragem client-side é trivial e suficiente.
- **Sanitização de observações no PUT.** Antes de gravar, cada observação passa por `trim()` e strings vazias (`""`) ou só-whitespace são descartadas. Garante que o array salvo nunca contém ruído.
- **Validação Zod no `categoryOrder`.** Cada elemento precisa ser UUID válido (`z.uuid()`). Isso impede entrada inválida, mas não verifica existência (vide ponto 1).
- **Validação Zod no `observations`.** Array de strings com `max(500)` por item. Sem `min` no array nem nas strings — arrays vazios são válidos, e strings vazias são removidas pela sanitização.
- **Auth obrigatória.** Ambas as rotas usam `preHandler: app.authenticate`.

## Erros

- 400 — `validation_error`: Zod rejeitou o body (ex: `categoryOrder` contendo string não-UUID, observation > 500 chars).
- 401 — sem Bearer ou token inválido.

Não há 404: GET sempre retorna 200 (cria on-demand), PUT idem.
