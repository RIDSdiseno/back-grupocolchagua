-- AlterEnum
ALTER TYPE "TipoMovimientoOportunidad" ADD VALUE 'MARCADA_PERDIDA';
ALTER TYPE "TipoMovimientoOportunidad" ADD VALUE 'POSTERGADA';

-- AlterTable
ALTER TABLE "OportunidadReclutamiento" ADD COLUMN     "motivoPerdida" TEXT,
ADD COLUMN     "motivoPostergacion" TEXT,
ADD COLUMN     "perdida" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "postergada" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "OportunidadComercial" ADD COLUMN     "motivoPerdida" TEXT,
ADD COLUMN     "motivoPostergacion" TEXT,
ADD COLUMN     "perdida" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "postergada" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum
CREATE TYPE "TipoMovimientoOportunidadComercial" AS ENUM ('CREACION', 'EDICION_GENERAL', 'CAMBIO_ETAPA', 'EDICION_ETAPA_PROSPECTO', 'EDICION_ETAPA_CONTACTADO', 'EDICION_ETAPA_PROPUESTA', 'EDICION_ETAPA_NEGOCIACION', 'CIERRE_GANADA', 'MARCADA_PERDIDA', 'POSTERGADA');

-- CreateTable
CREATE TABLE "HistorialOportunidadComercial" (
    "id" SERIAL NOT NULL,
    "oportunidadId" INTEGER NOT NULL,
    "tipo" "TipoMovimientoOportunidadComercial" NOT NULL,
    "etapaAnterior" "EtapaOportunidadComercial",
    "etapaNueva" "EtapaOportunidadComercial",
    "detalle" TEXT,
    "usuarioId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialOportunidadComercial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HistorialOportunidadComercial_oportunidadId_idx" ON "HistorialOportunidadComercial"("oportunidadId");

-- AddForeignKey
ALTER TABLE "HistorialOportunidadComercial" ADD CONSTRAINT "HistorialOportunidadComercial_oportunidadId_fkey" FOREIGN KEY ("oportunidadId") REFERENCES "OportunidadComercial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialOportunidadComercial" ADD CONSTRAINT "HistorialOportunidadComercial_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
