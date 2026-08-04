-- AlterEnum
ALTER TYPE "TipoMovimientoOportunidad" ADD VALUE 'EDICION_ETAPA_ENTREVISTA';

-- CreateTable
CREATE TABLE "OportunidadEntrevista" (
    "id" SERIAL NOT NULL,
    "oportunidadId" INTEGER NOT NULL,
    "entrevistasAgendadas" INTEGER NOT NULL DEFAULT 0,
    "entrevistasRealizadas" INTEGER NOT NULL DEFAULT 0,
    "noAsistieron" INTEGER NOT NULL DEFAULT 0,
    "desistieronAntesEntrevista" INTEGER NOT NULL DEFAULT 0,
    "aptos" INTEGER NOT NULL DEFAULT 0,
    "noAptos" INTEGER NOT NULL DEFAULT 0,
    "motivoNoAptitud" TEXT,
    "motivoNoAptitudOtro" TEXT,
    "fechaInicioEntrevistas" TIMESTAMP(3),
    "fechaTerminoEntrevistas" TIMESTAMP(3),
    "modalidadEntrevista" TEXT,
    "responsableEntrevistaId" INTEGER,
    "nivelGeneralCandidatos" TEXT,
    "fueNecesarioRepublicar" BOOLEAN,
    "motivoRepublicacion" TEXT,
    "motivoRepublicacionOtro" TEXT,
    "observacionesEntrevista" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OportunidadEntrevista_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OportunidadEntrevista_oportunidadId_key" ON "OportunidadEntrevista"("oportunidadId");

-- CreateIndex
CREATE INDEX "OportunidadEntrevista_oportunidadId_idx" ON "OportunidadEntrevista"("oportunidadId");

-- CreateIndex
CREATE INDEX "OportunidadEntrevista_responsableEntrevistaId_idx" ON "OportunidadEntrevista"("responsableEntrevistaId");

-- AddForeignKey
ALTER TABLE "OportunidadEntrevista" ADD CONSTRAINT "OportunidadEntrevista_oportunidadId_fkey" FOREIGN KEY ("oportunidadId") REFERENCES "OportunidadReclutamiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OportunidadEntrevista" ADD CONSTRAINT "OportunidadEntrevista_responsableEntrevistaId_fkey" FOREIGN KEY ("responsableEntrevistaId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
