-- CreateTable
CREATE TABLE "miembros_equipo_web" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "resumen" TEXT,
    "fotoUrl" TEXT,
    "fotoPublicId" TEXT,
    "linkedinUrl" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "miembros_equipo_web_pkey" PRIMARY KEY ("id")
);
