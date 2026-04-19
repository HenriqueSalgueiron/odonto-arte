-- CreateEnum
CREATE TYPE "StatusOrdem" AS ENUM ('RECEBIDO', 'EM_PRODUCAO', 'PRONTO', 'ENTREGUE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "preco" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dentistas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cro" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dentistas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "precos_especificos" (
    "id" TEXT NOT NULL,
    "dentista_id" TEXT NOT NULL,
    "servico_id" TEXT NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "precos_especificos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordens_servico" (
    "id" TEXT NOT NULL,
    "dentista_id" TEXT NOT NULL,
    "paciente_nome" TEXT NOT NULL,
    "cor_dente" TEXT,
    "observacoes" TEXT,
    "status" "StatusOrdem" NOT NULL DEFAULT 'RECEBIDO',
    "data_entrada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previsao_entrega" TIMESTAMP(3),
    "data_entrega" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordens_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordem_servico_itens" (
    "id" TEXT NOT NULL,
    "ordem_servico_id" TEXT NOT NULL,
    "servico_id" TEXT NOT NULL,
    "preco_na_data" DECIMAL(10,2) NOT NULL,
    "observacoes" TEXT,

    CONSTRAINT "ordem_servico_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anexos_ordem" (
    "id" TEXT NOT NULL,
    "ordem_servico_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anexos_ordem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "precos_especificos_dentista_id_servico_id_key" ON "precos_especificos"("dentista_id", "servico_id");

-- AddForeignKey
ALTER TABLE "precos_especificos" ADD CONSTRAINT "precos_especificos_dentista_id_fkey" FOREIGN KEY ("dentista_id") REFERENCES "dentistas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "precos_especificos" ADD CONSTRAINT "precos_especificos_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_dentista_id_fkey" FOREIGN KEY ("dentista_id") REFERENCES "dentistas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordem_servico_itens" ADD CONSTRAINT "ordem_servico_itens_ordem_servico_id_fkey" FOREIGN KEY ("ordem_servico_id") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordem_servico_itens" ADD CONSTRAINT "ordem_servico_itens_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexos_ordem" ADD CONSTRAINT "anexos_ordem_ordem_servico_id_fkey" FOREIGN KEY ("ordem_servico_id") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;
