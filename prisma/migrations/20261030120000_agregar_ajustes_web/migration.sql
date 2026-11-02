-- CreateTable
CREATE TABLE "ajustes_web" (
    "clave" TEXT NOT NULL,
    "valor" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ajustes_web_pkey" PRIMARY KEY ("clave")
);
