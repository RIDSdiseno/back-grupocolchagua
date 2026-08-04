-- CreateEnum
CREATE TYPE "MedioEnvioPropuestaComercial" AS ENUM ('CORREO_ELECTRONICO', 'WHATSAPP', 'REUNION_PRESENCIAL', 'VIDEOLLAMADA', 'OTRO');

-- CreateTable
CREATE TABLE "DatosEtapaPropuestaComercial" (
    "id" SERIAL NOT NULL,
    "oportunidadId" INTEGER NOT NULL,
    "fechaEnvio" TIMESTAMP(3),
    "medioEnvio" "MedioEnvioPropuestaComercial",
    "medioEnvioOtro" TEXT,
    "propuestaEnviada" BOOLEAN,
    "valorPropuesta" DOUBLE PRECISION,
    "vigenciaPropuesta" TIMESTAMP(3),
    "responsableEnvioId" INTEGER,
    "observacionesPropuesta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatosEtapaPropuestaComercial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DatosEtapaPropuestaComercial_oportunidadId_key" ON "DatosEtapaPropuestaComercial"("oportunidadId");

-- CreateIndex
CREATE INDEX "DatosEtapaPropuestaComercial_oportunidadId_idx" ON "DatosEtapaPropuestaComercial"("oportunidadId");

-- CreateIndex
CREATE INDEX "DatosEtapaPropuestaComercial_responsableEnvioId_idx" ON "DatosEtapaPropuestaComercial"("responsableEnvioId");

-- AddForeignKey
ALTER TABLE "DatosEtapaPropuestaComercial" ADD CONSTRAINT "DatosEtapaPropuestaComercial_oportunidadId_fkey" FOREIGN KEY ("oportunidadId") REFERENCES "OportunidadComercial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatosEtapaPropuestaComercial" ADD CONSTRAINT "DatosEtapaPropuestaComercial_responsableEnvioId_fkey" FOREIGN KEY ("responsableEnvioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
