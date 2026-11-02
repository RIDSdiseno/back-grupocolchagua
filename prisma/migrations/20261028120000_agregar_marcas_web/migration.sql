-- CreateTable
CREATE TABLE "marcas_web" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "logoPublicId" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marcas_web_pkey" PRIMARY KEY ("id")
);
