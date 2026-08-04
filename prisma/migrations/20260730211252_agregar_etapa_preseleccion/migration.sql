-- AlterEnum
ALTER TYPE "TipoMovimientoOportunidad" ADD VALUE 'EDICION_ETAPA_PRESELECCION';

-- AlterTable
ALTER TABLE "OportunidadReclutamiento" ADD COLUMN     "fechaCierrePreseleccion" TIMESTAMP(3),
ADD COLUMN     "fechaInicioPreseleccion" TIMESTAMP(3),
ADD COLUMN     "observacionesPreseleccion" TEXT,
ADD COLUMN     "postulantesDescartados" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "postulantesPreseleccion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "postulantesRevisados" INTEGER NOT NULL DEFAULT 0;
