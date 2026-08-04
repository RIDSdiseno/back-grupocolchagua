-- CreateEnum
CREATE TYPE "EstadoEtapaDocumentacion" AS ENUM ('PENDIENTE', 'EN_REVISION', 'COMPLETA', 'OBSERVADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoArchivoDocumentacion" AS ENUM ('ACTIVO', 'REEMPLAZADO', 'ELIMINADO');

-- AlterEnum
ALTER TYPE "EstadoOportunidad" ADD VALUE 'DOCUMENTACION';

-- AlterEnum
ALTER TYPE "TipoMovimientoOportunidad" ADD VALUE 'EDICION_ETAPA_DOCUMENTACION';

-- CreateTable
CREATE TABLE "DatosEtapaDocumentacion" (
    "id" SERIAL NOT NULL,
    "oportunidadId" INTEGER NOT NULL,
    "documentacionPendiente" INTEGER NOT NULL DEFAULT 0,
    "documentacionEnRevision" INTEGER NOT NULL DEFAULT 0,
    "documentacionCompleta" INTEGER NOT NULL DEFAULT 0,
    "documentacionRechazada" INTEGER NOT NULL DEFAULT 0,
    "fechaInicioDocumentacion" TIMESTAMP(3),
    "fechaEstimadaDocumentacionCompleta" TIMESTAMP(3),
    "fechaRealDocumentacionCompleta" TIMESTAMP(3),
    "fechaEstimadaIngreso" TIMESTAMP(3),
    "estadoEtapa" "EstadoEtapaDocumentacion" NOT NULL DEFAULT 'PENDIENTE',
    "observacionesDocumentacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatosEtapaDocumentacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentoRequeridoOportunidad" (
    "id" SERIAL NOT NULL,
    "oportunidadId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreNormalizado" TEXT NOT NULL,
    "obligatorio" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentoRequeridoOportunidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchivoDocumentacionReclutamiento" (
    "id" SERIAL NOT NULL,
    "oportunidadId" INTEGER NOT NULL,
    "documentoRequeridoId" INTEGER,
    "postulacionId" INTEGER,
    "nombreOriginal" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "secureUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "formato" TEXT,
    "tamanoBytes" INTEGER NOT NULL,
    "fechaCarga" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioCargaId" INTEGER NOT NULL,
    "estadoArchivo" "EstadoArchivoDocumentacion" NOT NULL DEFAULT 'ACTIVO',
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArchivoDocumentacionReclutamiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DatosEtapaDocumentacion_oportunidadId_key" ON "DatosEtapaDocumentacion"("oportunidadId");

-- CreateIndex
CREATE INDEX "DatosEtapaDocumentacion_oportunidadId_idx" ON "DatosEtapaDocumentacion"("oportunidadId");

-- CreateIndex
CREATE INDEX "DatosEtapaDocumentacion_estadoEtapa_idx" ON "DatosEtapaDocumentacion"("estadoEtapa");

-- CreateIndex
CREATE INDEX "DocumentoRequeridoOportunidad_oportunidadId_idx" ON "DocumentoRequeridoOportunidad"("oportunidadId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentoRequeridoOportunidad_oportunidadId_nombreNormaliza_key" ON "DocumentoRequeridoOportunidad"("oportunidadId", "nombreNormalizado");

-- CreateIndex
CREATE INDEX "ArchivoDocumentacionReclutamiento_oportunidadId_idx" ON "ArchivoDocumentacionReclutamiento"("oportunidadId");

-- CreateIndex
CREATE INDEX "ArchivoDocumentacionReclutamiento_documentoRequeridoId_idx" ON "ArchivoDocumentacionReclutamiento"("documentoRequeridoId");

-- CreateIndex
CREATE INDEX "ArchivoDocumentacionReclutamiento_postulacionId_idx" ON "ArchivoDocumentacionReclutamiento"("postulacionId");

-- CreateIndex
CREATE INDEX "ArchivoDocumentacionReclutamiento_usuarioCargaId_idx" ON "ArchivoDocumentacionReclutamiento"("usuarioCargaId");

-- CreateIndex
CREATE INDEX "ArchivoDocumentacionReclutamiento_estadoArchivo_idx" ON "ArchivoDocumentacionReclutamiento"("estadoArchivo");

-- AddForeignKey
ALTER TABLE "DatosEtapaDocumentacion" ADD CONSTRAINT "DatosEtapaDocumentacion_oportunidadId_fkey" FOREIGN KEY ("oportunidadId") REFERENCES "OportunidadReclutamiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoRequeridoOportunidad" ADD CONSTRAINT "DocumentoRequeridoOportunidad_oportunidadId_fkey" FOREIGN KEY ("oportunidadId") REFERENCES "OportunidadReclutamiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchivoDocumentacionReclutamiento" ADD CONSTRAINT "ArchivoDocumentacionReclutamiento_oportunidadId_fkey" FOREIGN KEY ("oportunidadId") REFERENCES "OportunidadReclutamiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchivoDocumentacionReclutamiento" ADD CONSTRAINT "ArchivoDocumentacionReclutamiento_documentoRequeridoId_fkey" FOREIGN KEY ("documentoRequeridoId") REFERENCES "DocumentoRequeridoOportunidad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchivoDocumentacionReclutamiento" ADD CONSTRAINT "ArchivoDocumentacionReclutamiento_postulacionId_fkey" FOREIGN KEY ("postulacionId") REFERENCES "Postulacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchivoDocumentacionReclutamiento" ADD CONSTRAINT "ArchivoDocumentacionReclutamiento_usuarioCargaId_fkey" FOREIGN KEY ("usuarioCargaId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
