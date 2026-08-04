-- CreateEnum
CREATE TYPE "EstadoNegociacionComercial" AS ENUM ('EN_NEGOCIACION', 'SOLICITA_CAMBIOS', 'SOLICITA_REBAJA', 'EN_EVALUACION', 'ACEPTA_CONDICIONES', 'RECHAZA_PROPUESTA');

-- CreateTable
CREATE TABLE "DatosEtapaNegociacionComercial" (
    "id" SERIAL NOT NULL,
    "oportunidadId" INTEGER NOT NULL,
    "fechaRespuesta" TIMESTAMP(3),
    "estadoNegociacion" "EstadoNegociacionComercial",
    "descripcionCambiosSolicitados" TEXT,
    "cambioValorPropuesta" BOOLEAN,
    "cambioServicio" BOOLEAN,
    "cambioCantidadTrabajadores" BOOLEAN,
    "cambioFechaInicio" BOOLEAN,
    "proximaGestion" TEXT,
    "fechaProximaGestion" TIMESTAMP(3),
    "observacionesNegociacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatosEtapaNegociacionComercial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DatosEtapaNegociacionComercial_oportunidadId_key" ON "DatosEtapaNegociacionComercial"("oportunidadId");

-- CreateIndex
CREATE INDEX "DatosEtapaNegociacionComercial_oportunidadId_idx" ON "DatosEtapaNegociacionComercial"("oportunidadId");

-- AddForeignKey
ALTER TABLE "DatosEtapaNegociacionComercial" ADD CONSTRAINT "DatosEtapaNegociacionComercial_oportunidadId_fkey" FOREIGN KEY ("oportunidadId") REFERENCES "OportunidadComercial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
