-- AlterEnum
-- La tabla "OportunidadComercial" tiene 0 filas en etapa REUNION al momento
-- de esta migración, así que el cast de abajo no puede fallar por valores
-- huérfanos. El default de la columna es 'PROSPECTO', que se conserva.
BEGIN;
CREATE TYPE "EtapaOportunidadComercial_new" AS ENUM ('PROSPECTO', 'CONTACTADO', 'PROPUESTA', 'NEGOCIACION', 'GANADA', 'PERDIDA');
ALTER TABLE "OportunidadComercial" ALTER COLUMN "etapa" DROP DEFAULT;
ALTER TABLE "OportunidadComercial" ALTER COLUMN "etapa" TYPE "EtapaOportunidadComercial_new" USING ("etapa"::text::"EtapaOportunidadComercial_new");
ALTER TYPE "EtapaOportunidadComercial" RENAME TO "EtapaOportunidadComercial_old";
ALTER TYPE "EtapaOportunidadComercial_new" RENAME TO "EtapaOportunidadComercial";
DROP TYPE "EtapaOportunidadComercial_old";
ALTER TABLE "OportunidadComercial" ALTER COLUMN "etapa" SET DEFAULT 'PROSPECTO';
COMMIT;
