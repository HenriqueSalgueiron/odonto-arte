# Produto — OdontoArte

Documento de definição do produto. Contexto narrativo (visão, personas, escopo por fase). Para stack/infra/roadmap, ver os outros arquivos em `docs/`.

---

## 1. Visão

Sistema web para gestão de um laboratório de prótese dentária familiar chamado OdontoArte. Substitui uma planilha Excel hoje usada para controlar preços de serviços, eliminando a fricção de localizar arquivo, abrir Excel, formatar e exportar PDF.

Em fases posteriores, substitui também o controle em papel das ordens de serviço (fichas) que entram no laboratório.

### Princípios

- **Simplicidade acima de completude.** A usuária principal tem baixa familiaridade técnica. Toda decisão de UX deve favorecer clareza e previsibilidade.
- **Acessível de qualquer lugar.** Sem instalar nada, sem "abrir arquivo". URL fixa, login persistente, instalável como app no celular (PWA).
- **Confiável.** Os dados são o ativo principal do laboratório. Backup automático via banco gerenciado. Nunca depender da memória da usuária.

---

## 2. Personas e Contexto

### Usuária principal

- Co-proprietária do laboratório, responsável pela gestão administrativa.
- Conhecimento técnico baixo: dificuldade para localizar arquivos, formatar planilhas, exportar PDFs.
- Usa principalmente celular para tarefas rápidas; computador ocasionalmente.

### Contexto do laboratório

- Volume estimado: até ~100 dentistas cadastrados, ~30 serviços diferentes (PPR, dentadura, placa de bruxismo, coroa, etc.).
- Cada dentista pode ter preços específicos (negociados) que diferem do preço-tabela geral.
- Periodicamente há ajustes globais nos preços (geralmente anuais).
- Cada trabalho que entra vem com uma "caixinha" (molde + insumos) e uma "ficha" em papel preenchida pelo dentista (paciente, cor do dente, tipo de serviço, observações). Essas fichas são arquivadas em pastas físicas.

---

## 3. Escopo

### Fase 1 — MVP

Conjunto de funcionalidades em construção. As regras de negócio detalhadas vivem nos `CLAUDE.md` de cada domínio (em `apps/api/src/routes/<dom>/`); este documento mantém apenas a visão geral.

- **Autenticação** — login email/senha, sessão persistente com refresh token rotation. Detalhes em `apps/api/src/routes/auth/CLAUDE.md`.
- **Cadastro de serviços** — CRUD do catálogo. Detalhes em `apps/api/src/routes/services/CLAUDE.md`.
- **Cadastro de dentistas** — CRUD do cadastro. Detalhes em `apps/api/src/routes/dentists/CLAUDE.md`.
- **Tabela de preços por dentista** — override por par (dentista, serviço); fallback no preço-tabela. Detalhes em `apps/api/src/routes/dentists/prices/CLAUDE.md`.
- **Configurações do laboratório** — singleton `LabInfo` editado em `/settings`. Header global com navegação. Todos os campos obrigatórios para liberar exportação de PDF.
- **Categorias de serviço** — agrupam serviços do catálogo. Nome `"Diversos"` reservado (case-insensitive) para o bucket virtual no PDF. Detalhes em `apps/api/src/routes/categories/CLAUDE.md`.
- **Exportação de PDF (frontend)** — tabela geral ou por dentista, agrupada por categoria, com cabeçalho do laboratório e observações. `ExportTemplate` singleton guarda última ordenação/observações (detalhes do backend em `apps/api/src/routes/export-template/CLAUDE.md`). Modal com drag-and-drop pra reordenar categorias e lista editável de observações. Bloqueado se `LabInfo` incompleto. Usa `@react-pdf/renderer`. **Regra de negócio crítica:** o PDF "por dentista" é visualmente idêntico ao geral — não identifica o dentista no documento nem no filename. Só os preços diferem (efetivos vs tabela). Razão: evitar que o destinatário descubra que existe tabela personalizada por dentista.
- **PWA** — manifest + service worker via `vite-plugin-pwa`. Instalável no celular. Sem requisito offline.

### Fase 2 — Ordens de Serviço (modelar no banco, não implementar)

Substituir o controle em papel das fichas de serviço.

- Cadastro de ordem de serviço: dentista, paciente (nome), serviço(s), cor do dente, data de entrada, previsão de entrega, observações, status.
- Status possíveis (a refinar): recebido, em_producao, pronto, entregue.
- Histórico por dentista e por paciente.
- Anexar fotos da ficha original ou do trabalho. Armazenamento de arquivos via **AWS S3** (upload pelo backend com `@aws-sdk/client-s3`, acesso via presigned URLs com expiração). Configurar bucket S3 com permissões IAM de menor privilégio (apenas upload e leitura).
- Listagem filtrável por status, dentista, período.

A modelagem (`ServiceOrder`, `ServiceOrderItem`, `OrderAttachment`, enum `OrderStatus`) já está em `apps/api/prisma/schema.prisma` para evitar migrations dolorosas no futuro. As relações com `Service` e `Dentist` já existem.

### Fase 3+ — Possíveis evoluções (apenas registrar)

- **Ajuste global de preços** (adiado do MVP). Aplicar percentual de aumento ou redução em todos os serviços de uma vez (ex: "+8% em tudo"), com confirmação por preview do antes/depois antes de aplicar. Escopo: afeta apenas preços-tabela; preços específicos por dentista permanecem inalterados (a usuária ajusta caso a caso). Documentar isso na UI quando implementar.
- Envio automático da tabela de preços por email para o dentista via **AWS SES** (Simple Email Service). Configurar domínio verificado, templates de email, envio transacional.
- Envio por WhatsApp (avaliar integrações disponíveis).
- Relatórios financeiros (faturamento por dentista, serviço, período).
- Notificações de prazos de entrega.
- Multi-usuário com perfis (admin, técnico, recepção).
- Recuperação de senha por email (via SES).
