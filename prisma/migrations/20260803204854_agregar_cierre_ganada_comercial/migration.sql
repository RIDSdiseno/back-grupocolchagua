-- CreateEnum
CREATE TYPE "EstadoAcuerdoComercial" AS ENUM ('CONFIRMADO', 'PENDIENTE_FIRMA');

-- CreateTable
CREATE TABLE "DatosCierreGanadaComercial" (
    "id" SERIAL NOT NULL,
    "oportunidadId" INTEGER NOT NULL,
    "fechaCierre" TIMESTAMP(3),
    "valorFinalAcordado" DOUBLE PRECISION,
    "servicioContratado" TEXT,
    "servicioContratadoOtro" TEXT,
    "cantidadFinalTrabajadores" INTEGER,
    "fechaInicioEstimada" TIMESTAMP(3),
    "duracionServicio" TEXT,
    "estadoAcuerdo" "EstadoAcuerdoComercial",
    "observacionesFinales" TEXT,
    "crearOportunidadReclutamiento" BOOLEAN NOT NULL DEFAULT false,
    "oportunidadReclutamientoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatosCierreGanadaComercial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DatosCierreGanadaComercial_oportunidadId_key" ON "DatosCierreGanadaComercial"("oportunidadId");

-- CreateIndex
CREATE UNIQUE INDEX "DatosCierreGanadaComercial_oportunidadReclutamientoId_key" ON "DatosCierreGanadaComercial"("oportunidadReclutamientoId");

-- CreateIndex
CREATE INDEX "DatosCierreGanadaComercial_oportunidadId_idx" ON "DatosCierreGanadaComercial"("oportunidadId");

-- CreateIndex
CREATE INDEX "DatosCierreGanadaComercial_oportunidadReclutamientoId_idx" ON "DatosCierreGanadaComercial"("oportunidadReclutamientoId");

-- AddForeignKey
ALTER TABLE "DatosCierreGanadaComercial" ADD CONSTRAINT "DatosCierreGanadaComercial_oportunidadId_fkey" FOREIGN KEY ("oportunidadId") REFERENCES "OportunidadComercial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatosCierreGanadaComercial" ADD CONSTRAINT "DatosCierreGanadaComercial_oportunidadReclutamientoId_fkey" FOREIGN KEY ("oportunidadReclutamientoId") REFERENCES "OportunidadReclutamiento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
