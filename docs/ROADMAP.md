# Roadmap de Execução

Ordem sugerida de desenvolvimento. Cada item é uma unidade que pode ser feita em uma sessão com o Claude Code. Testes são escritos JUNTO com cada feature, não depois.

## Etapa 1 — Setup do monorepo
- Inicializar repo com pnpm workspaces + Turborepo.
- Criar docker-compose.dev.yml com Postgres local.
- Configurar apps/web (Vite + React + TS + MUI + React Router) com página hello world.
- Configurar apps/api (Fastify + TS) com rota GET /health.
- Configurar Vitest em ambos os apps.
- Configurar ESLint e tsconfig compartilhados.
- Criar CLAUDE.md na raiz com visão geral do projeto.
- Verificar que `pnpm dev` roda ambos simultaneamente.
- Verificar que `pnpm test` roda testes em ambos os apps.

## Etapa 2 — Banco de dados ✅
- Configurar Prisma em apps/api com schema completo (Fase 1 + Fase 2).
- Conectar ao Postgres local (docker-compose.dev.yml).
- Rodar migrations.
- Criar seed (usuária inicial).

## Etapa 3 — Auth no backend ✅
- Configurar Upstash Redis (criar instância, obter credenciais, configurar @upstash/redis).
- Implementar hash de senha com Argon2id.
- Implementar geração/validação de JWT com jose.
- Implementar refresh token opaco armazenado no Redis com TTL e rotation.
- Criar rotas: login, refresh, logout, me.
- Criar middleware de proteção.
- Testes unitários: funções de hash, geração/validação de token.
- Testes de integração: rotas de auth (login com credenciais corretas/incorretas, refresh com token válido/inválido/expirado, logout).

## Etapa 4 — Swagger + Kubb ✅
- Configurar @fastify/swagger + @fastify/swagger-ui + fastify-type-provider-zod.
- Verificar que /docs serve a documentação.
- Configurar Kubb para ler a spec e gerar código em apps/web/src/generated/.
- Configurar script no Turborepo para rodar Kubb.
- Verificar que os tipos e hooks são gerados corretamente.

## Etapa 5 — Auth no frontend ✅
- Criar tema MUI (cores, tipografia, espaçamento).
- Configurar MSW para mock da API nos testes.
- Implementar tela de login.
- Implementar lógica de auth no frontend (salvar tokens, interceptor para Authorization header, redirect para login quando 401, refresh automático).
- Proteger rotas.
- Testes de hook: hook de auth (gerencia tokens, refresh automático, logout limpa estado).
- Testes de componente: tela de login (validação de campos, exibe erro com credenciais inválidas, redireciona após login).

## Etapa 6 — CRUD de Serviços ✅
- Backend: rotas POST, GET (list + detail), PUT, DELETE com schemas Zod.
- Testes de integração backend: CRUD completo, validação de campos obrigatórios, resposta 404 para serviço inexistente.
- Regenerar Kubb.
- Frontend: página de listagem com busca, formulário de criação/edição, confirmação de exclusão.
- Testes de componente frontend: formulário valida campos, listagem exibe dados, busca filtra resultados.
- Testes unitários: funções de formatação de preço (BRL), utilitários relacionados.

## Etapa 7 — CRUD de Dentistas ✅
- Mesmo padrão da etapa 6.

## Etapa 8 — Preços por Dentista ✅
- Backend: rotas para consultar preços efetivos de um dentista, definir/atualizar/remover preço específico.
- Testes de integração backend: definir preço específico, consultar preço efetivo (retorna específico quando existe, tabela quando não), remover preço específico.
- Regenerar Kubb.
- Frontend: interface de gerenciamento de preços por dentista (lista de serviços com preço efetivo, toggle entre tabela e específico, edição inline ou modal).
- Testes de componente frontend: exibe preço correto (específico vs tabela), permite editar/remover.
- Testes de hook (se houver hook customizado de preço efetivo).

## Etapa 9 — Ajuste Global de Preços ⏳ (adiada para Fase 3)
Movida para a Fase 3 (ver `docs/PRODUCT.md` § 3). Não faz parte do MVP. Numeração das etapas seguintes mantida para preservar referências.

## Etapa 10 — Configurações do laboratório ✅
- Backend: model `LabInfo` (singleton) com os campos `name`, `responsibleTechnician`, `responsibleTechnicianCro`, `phone`, `email`. Migration cria a linha inicial com `name = "OdontoArte"` e demais campos null. Rotas: GET `/lab-info` (sempre retorna a linha) e PUT `/lab-info` (atualiza). Schema Zod do PUT exige todos os campos preenchidos.
- Testes de integração backend: GET retorna a linha após seed/migration, PUT valida obrigatórios, GET após PUT retorna o dado atualizado.
- Regenerar Kubb.
- Frontend: header global com navegação (Home, Serviços, Dentistas, Configurações), aplicado às rotas dentro de `ProtectedRoute`. Página `/settings` com formulário (RHFTextField + RHFPhoneField). Hook `useLabInfo` (wrapper sobre o gerado) que expõe `isConfigured` (todos os campos preenchidos).
- Testes de componente frontend: formulário valida campos obrigatórios, salva e exibe toast de sucesso, header navega entre rotas.
- Testes de hook: `useLabInfo` deriva `isConfigured` corretamente para os estados não-carregado, parcial e completo.

## Etapa 11 — Categorias de serviço ✅
- Backend: model `Category` (id, name único, timestamps). Adicionar `categoryId` opcional em `Service` com `onDelete: SetNull`. Rotas: CRUD completo de Category (POST, GET list, PUT, DELETE). Bloquear nome `"Diversos"` (case-insensitive) na criação/edição. DELETE não bloqueia; resposta inclui count de serviços que serão desassociados.
- Service ganha `categoryId?` no schema Zod das rotas POST/PUT. GET responde com a categoria expandida.
- Testes de integração backend: CRUD de category, bloqueio de "Diversos", DELETE move serviços para `categoryId = null`, validação ao criar/editar serviço com categoryId inválido.
- Regenerar Kubb.
- Frontend: select de categoria no `ServiceFormDialog` com opção "+ Nova categoria" inline (dialog secundário simples) e ações de excluir/renomear na própria lista de seleção. Listagem de serviços ganha indicação visual da categoria (chip).
- Testes de componente frontend: criação de categoria inline, atribuição/remoção de categoria em serviço, confirmação de exclusão de categoria mostra count de serviços afetados.

## Etapa 12 — Exportação de PDF ✅
- Backend: model `ExportTemplate` (singleton) com `categoryOrder: String[]` (UUIDs de Category) e `observations: String[]`. Rotas: GET `/export-template` (cria a linha vazia on-demand se não existir) e PUT `/export-template`. PUT aplica `trim()` em cada observação e descarta strings vazias antes de gravar.
- Testes de integração backend: GET inicial retorna template vazio, PUT salva, PUT descarta observações vazias/whitespace-only, GET subsequente retorna o salvo.
- Regenerar Kubb.
- Frontend: instalar `@react-pdf/renderer` e uma lib leve de drag-and-drop (ex: `@dnd-kit/core` + `@dnd-kit/sortable`).
- Componente `ExportPdfDialog` reutilizável (usado tanto na tabela geral quanto na por dentista):
  - Drag-and-drop pra ordenar categorias. `"Diversos"` fixo no final, não arrastável.
  - Lista editável de observações: campo de texto + botão "+" pra adicionar item, ícone "x" pra remover item.
  - Botão "Exportar". Comparação rasa entre estado do dialog e template salvo: se diferente, salva antes de gerar; se igual, só gera.
  - Se `LabInfo` não está totalmente preenchido, dialog mostra apenas aviso "Configure as informações do laboratório antes de exportar" + link para `/settings`, e desabilita "Exportar".
- Templates `<Document>` em `src/lib/pdf/`:
  - `GeneralPriceListDocument` — tabela geral, agrupada por categoria, cabeçalho com dados do laboratório, observações no rodapé.
  - `DentistPriceListDocument` — preço efetivo por dentista, mesma estrutura.
- Funções puras testáveis: `buildSectionsByCategory(services, categoryOrder)` (resolve ordem; categorias novas no fim em ordem alfabética; "Diversos" sempre por último), `filename(date, dentistName?)`, `downloadPdf(doc, name)`.
- Testes unitários: builders de dados (categorias na ordem do template, "Diversos" no final, categorias novas após template entram alfabeticamente, categorias deletadas filtradas), filename builder.
- Testes de componente frontend: dialog popula com template salvo, drag-and-drop reordena, adicionar/remover observação, lab não configurado mostra aviso, mudança no estado dispara PUT antes do download, ausência de mudança não dispara PUT.
- Plugar botões "Exportar PDF" em `ServicesListPage` e `DentistPricesPage`.

## Etapa 13 — Testes E2E (Cypress) ⏳
- Configurar Cypress no projeto (apps/web/cypress/).
- Configurar scripts para rodar backend + frontend em modo de teste.
- Escrever suítes E2E dos fluxos principais:
  - Login com credenciais válidas e inválidas.
  - Criar serviço → verificar na listagem → editar → verificar alteração → excluir.
  - Criar categoria → atrelar a serviço → verificar na listagem.
  - Criar dentista → definir preço específico → verificar preço efetivo.
  - Configurar laboratório → exportar PDF (geral) com observações e ordem custom → verificar download.

## Etapa 14 — PWA ⏳
- Configurar vite-plugin-pwa com manifest e ícones.
- Testar instalação no celular.

## Etapa 15 — Sentry ⏳
- Criar projetos no Sentry (um para frontend, um para backend).
- Integrar @sentry/react no frontend.
- Integrar @sentry/node no backend.
- Verificar que erros aparecem no dashboard.

## Etapa 16 — Docker + Deploy ⏳
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

## Etapa 17 — CI/CD ⏳
- Configurar GitHub Actions: lint → build → testes unitários/hooks/componentes/integração → E2E (Cypress) → deploy backend → migrate → deploy frontend.
- Build roda antes dos testes: se TypeScript não compilar, pipeline para imediatamente.
- Testes E2E (Cypress) rodam em push na main apenas (mais lentos, validação final antes de deploy).
- Verificar pipeline completo com um push na main.

## Etapa 18 — README ⏳
- Escrever README para o repositório: descrição do projeto, screenshots, stack, como rodar local, link da demo, roadmap (Fase 1 ✅, Fase 2 🚧, Fase 3 📋).
