-- CreateEnum
CREATE TYPE "OrigenProspectoComercial" AS ENUM ('REFERIDO', 'PAGINA_WEB', 'LLAMADA_SALIENTE', 'LINKEDIN', 'EVENTO_FERIA', 'BASE_DATOS', 'OTRO');

-- CreateEnum
CREATE TYPE "NivelInteresProspectoComercial" AS ENUM ('BAJO', 'MEDIO', 'ALTO');

-- CreateEnum
CREATE TYPE "MedioContactoComercial" AS ENUM ('TELEFONO', 'CORREO', 'WHATSAPP', 'REUNION');

-- CreateTable
CREATE TABLE "DatosEtapaProspectoComercial" (
    "id" SERIAL NOT NULL,
    "oportunidadId" INTEGER NOT NULL,
    "origenProspecto" "OrigenProspectoComercial",
    "origenProspectoOtro" TEXT,
    "fechaIncorporacion" TIMESTAMP(3),
    "necesidadPreliminar" TEXT,
    "nivelInteres" "NivelInteresProspectoComercial",
    "medioContactoPreferido" "MedioContactoComercial",
    "proximaAccion" TEXT,
    "fechaProximaAccion" TIMESTAMP(3),
    "observacionesProspecto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatosEtapaProspectoComercial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DatosEtapaProspectoComercial_oportunidadId_key" ON "DatosEtapaProspectoComercial"("oportunidadId");

-- CreateIndex
CREATE INDEX "DatosEtapaProspectoComercial_oportunidadId_idx" ON "DatosEtapaProspectoComercial"("oportunidadId");

-- AddForeignKey
ALTER TABLE "DatosEtapaProspectoComercial" ADD CONSTRAINT "DatosEtapaProspectoComercial_oportunidadId_fkey" FOREIGN KEY ("oportunidadId") REFERENCES "OportunidadComercial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
