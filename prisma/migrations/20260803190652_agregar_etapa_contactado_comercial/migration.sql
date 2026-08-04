-- CreateEnum
CREATE TYPE "NecesidadActivaComercial" AS ENUM ('SI', 'NO', 'A_FUTURO');

-- CreateTable
CREATE TABLE "DatosEtapaContactadoComercial" (
    "id" SERIAL NOT NULL,
    "oportunidadId" INTEGER NOT NULL,
    "cambioServicio" BOOLEAN,
    "cambioCantidadTrabajadores" BOOLEAN,
    "cambioFechaInicio" BOOLEAN,
    "necesidadActiva" "NecesidadActivaComercial",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatosEtapaContactadoComercial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DatosEtapaContactadoComercial_oportunidadId_key" ON "DatosEtapaContactadoComercial"("oportunidadId");

-- CreateIndex
CREATE INDEX "DatosEtapaContactadoComercial_oportunidadId_idx" ON "DatosEtapaContactadoComercial"("oportunidadId");

-- AddForeignKey
ALTER TABLE "DatosEtapaContactadoComercial" ADD CONSTRAINT "DatosEtapaContactadoComercial_oportunidadId_fkey" FOREIGN KEY ("oportunidadId") REFERENCES "OportunidadComercial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
