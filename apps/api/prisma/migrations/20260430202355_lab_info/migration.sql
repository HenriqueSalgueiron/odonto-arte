-- CreateTable
CREATE TABLE "lab_info" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'OdontoArte',
    "responsible_technician" TEXT,
    "responsible_technician_cro" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_info_pkey" PRIMARY KEY ("id")
);
