-- CreateEnum
CREATE TYPE "TipoMovimientoOportunidad" AS ENUM ('CREACION', 'EDICION_GENERAL', 'EDICION_ETAPA_NUEVOS', 'CAMBIO_ESTADO');

-- CreateTable
CREATE TABLE "OportunidadHistorial" (
    "id" SERIAL NOT NULL,
    "oportunidadId" INTEGER NOT NULL,
    "tipo" "TipoMovimientoOportunidad" NOT NULL,
    "estadoAnterior" "EstadoOportunidad",
    "estadoNuevo" "EstadoOportunidad",
    "detalle" TEXT,
    "usuarioId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OportunidadHistorial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OportunidadHistorial_oportunidadId_idx" ON "OportunidadHistorial"("oportunidadId");

-- AddForeignKey
ALTER TABLE "OportunidadHistorial" ADD CONSTRAINT "OportunidadHistorial_oportunidadId_fkey" FOREIGN KEY ("oportunidadId") REFERENCES "OportunidadReclutamiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OportunidadHistorial" ADD CONSTRAINT "OportunidadHistorial_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
