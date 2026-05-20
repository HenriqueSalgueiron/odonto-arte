-- CreateTable
CREATE TABLE "export_template" (
    "id" TEXT NOT NULL,
    "category_order" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "observations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "export_template_pkey" PRIMARY KEY ("id")
);
