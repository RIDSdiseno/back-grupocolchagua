-- CreateEnum
CREATE TYPE "EstadoOportunidad" AS ENUM ('NUEVOS', 'PRESELECCION', 'ENTREVISTA', 'SELECCIONADOS', 'CONTRATADOS');

-- CreateEnum
CREATE TYPE "JornadaOportunidad" AS ENUM ('FULL_TIME', 'PART_TIME', 'AMBAS');

-- CreateTable
CREATE TABLE "OportunidadReclutamiento" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "cargoId" INTEGER NOT NULL,
    "sucursalId" INTEGER,
    "cantidadNecesaria" INTEGER NOT NULL,
    "jornada" "JornadaOportunidad" NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaLimite" TIMESTAMP(3),
    "reclutadorResponsableId" INTEGER NOT NULL,
    "observaciones" TEXT,
    "estado" "EstadoOportunidad" NOT NULL DEFAULT 'NUEVOS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OportunidadReclutamiento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OportunidadReclutamiento" ADD CONSTRAINT "OportunidadReclutamiento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OportunidadReclutamiento" ADD CONSTRAINT "OportunidadReclutamiento_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OportunidadReclutamiento" ADD CONSTRAINT "OportunidadReclutamiento_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OportunidadReclutamiento" ADD CONSTRAINT "OportunidadReclutamiento_reclutadorResponsableId_fkey" FOREIGN KEY ("reclutadorResponsableId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
