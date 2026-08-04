-- CreateEnum
CREATE TYPE "EstadoBusquedaOportunidad" AS ENUM ('ACTIVA', 'PAUSADA', 'CERRADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "PrioridadOportunidad" AS ENUM ('ALTA', 'MEDIA', 'BAJA');

-- AlterTable
ALTER TABLE "OportunidadReclutamiento" ADD COLUMN     "actualizadoPorId" INTEGER,
ADD COLUMN     "empleoId" INTEGER,
ADD COLUMN     "estadoBusqueda" "EstadoBusquedaOportunidad",
ADD COLUMN     "fechaCierreBusqueda" TIMESTAMP(3),
ADD COLUMN     "fechaEstimadaIngreso" TIMESTAMP(3),
ADD COLUMN     "fechaInicioBusqueda" TIMESTAMP(3),
ADD COLUMN     "observacionesEtapaNuevos" TEXT,
ADD COLUMN     "prioridad" "PrioridadOportunidad";

-- CreateTable
CREATE TABLE "FuentePostulacionExterna" (
    "id" SERIAL NOT NULL,
    "oportunidadId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreNormalizado" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuentePostulacionExterna_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FuentePostulacionExterna_oportunidadId_idx" ON "FuentePostulacionExterna"("oportunidadId");

-- CreateIndex
CREATE UNIQUE INDEX "FuentePostulacionExterna_oportunidadId_nombreNormalizado_key" ON "FuentePostulacionExterna"("oportunidadId", "nombreNormalizado");

-- AddForeignKey
ALTER TABLE "OportunidadReclutamiento" ADD CONSTRAINT "OportunidadReclutamiento_empleoId_fkey" FOREIGN KEY ("empleoId") REFERENCES "empleos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OportunidadReclutamiento" ADD CONSTRAINT "OportunidadReclutamiento_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuentePostulacionExterna" ADD CONSTRAINT "FuentePostulacionExterna_oportunidadId_fkey" FOREIGN KEY ("oportunidadId") REFERENCES "OportunidadReclutamiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
