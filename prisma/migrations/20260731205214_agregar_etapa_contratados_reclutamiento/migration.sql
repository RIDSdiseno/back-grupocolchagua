-- AlterEnum
ALTER TYPE "TipoMovimientoOportunidad" ADD VALUE 'EDICION_ETAPA_CONTRATADOS';

-- CreateTable
CREATE TABLE "DatosEtapaContratados" (
    "id" SERIAL NOT NULL,
    "oportunidadId" INTEGER NOT NULL,
    "personasContratadas" INTEGER NOT NULL DEFAULT 0,
    "personasNoIngresaron" INTEGER NOT NULL DEFAULT 0,
    "fechaPrimerIngreso" TIMESTAMP(3),
    "fechaCierreProceso" TIMESTAMP(3),
    "observacionesContratados" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatosEtapaContratados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OportunidadContratadosMotivoNoIngreso" (
    "id" SERIAL NOT NULL,
    "contratadosId" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "motivoOtro" TEXT,
    "motivoNormalizado" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OportunidadContratadosMotivoNoIngreso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DatosEtapaContratados_oportunidadId_key" ON "DatosEtapaContratados"("oportunidadId");

-- CreateIndex
CREATE INDEX "DatosEtapaContratados_oportunidadId_idx" ON "DatosEtapaContratados"("oportunidadId");

-- CreateIndex
CREATE INDEX "OportunidadContratadosMotivoNoIngreso_contratadosId_idx" ON "OportunidadContratadosMotivoNoIngreso"("contratadosId");

-- CreateIndex
CREATE UNIQUE INDEX "OportunidadContratadosMotivoNoIngreso_contratadosId_motivoN_key" ON "OportunidadContratadosMotivoNoIngreso"("contratadosId", "motivoNormalizado");

-- AddForeignKey
ALTER TABLE "DatosEtapaContratados" ADD CONSTRAINT "DatosEtapaContratados_oportunidadId_fkey" FOREIGN KEY ("oportunidadId") REFERENCES "OportunidadReclutamiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OportunidadContratadosMotivoNoIngreso" ADD CONSTRAINT "OportunidadContratadosMotivoNoIngreso_contratadosId_fkey" FOREIGN KEY ("contratadosId") REFERENCES "DatosEtapaContratados"("id") ON DELETE CASCADE ON UPDATE CASCADE;
