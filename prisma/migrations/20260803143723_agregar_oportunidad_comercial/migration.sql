-- CreateEnum
CREATE TYPE "PrioridadOportunidadComercial" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "EtapaOportunidadComercial" AS ENUM ('PROSPECTO', 'CONTACTADO', 'REUNION', 'PROPUESTA', 'NEGOCIACION', 'GANADA', 'PERDIDA');

-- CreateTable
CREATE TABLE "OportunidadComercial" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER,
    "prospectoNombre" TEXT,
    "prospectoRut" TEXT,
    "contactoNombre" TEXT NOT NULL,
    "contactoCargo" TEXT,
    "contactoTelefono" TEXT,
    "contactoEmail" TEXT,
    "nombreOportunidad" TEXT NOT NULL,
    "tipoServicio" TEXT NOT NULL,
    "descripcionNecesidad" TEXT,
    "cantidadTrabajadores" INTEGER,
    "cargoPerfil" TEXT,
    "region" TEXT,
    "comuna" TEXT,
    "montoEstimado" DOUBLE PRECISION,
    "fechaInicioEstimada" TIMESTAMP(3),
    "ejecutivoId" INTEGER NOT NULL,
    "prioridad" "PrioridadOportunidadComercial" NOT NULL DEFAULT 'MEDIA',
    "etapa" "EtapaOportunidadComercial" NOT NULL DEFAULT 'PROSPECTO',
    "proximaActividad" TEXT,
    "fechaProximaActividad" TIMESTAMP(3),
    "observaciones" TEXT,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OportunidadComercial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OportunidadComercial_empresaId_idx" ON "OportunidadComercial"("empresaId");

-- CreateIndex
CREATE INDEX "OportunidadComercial_ejecutivoId_idx" ON "OportunidadComercial"("ejecutivoId");

-- CreateIndex
CREATE INDEX "OportunidadComercial_createdById_idx" ON "OportunidadComercial"("createdById");

-- CreateIndex
CREATE INDEX "OportunidadComercial_etapa_idx" ON "OportunidadComercial"("etapa");

-- CreateIndex
CREATE INDEX "OportunidadComercial_prioridad_idx" ON "OportunidadComercial"("prioridad");

-- AddForeignKey
ALTER TABLE "OportunidadComercial" ADD CONSTRAINT "OportunidadComercial_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OportunidadComercial" ADD CONSTRAINT "OportunidadComercial_ejecutivoId_fkey" FOREIGN KEY ("ejecutivoId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OportunidadComercial" ADD CONSTRAINT "OportunidadComercial_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
