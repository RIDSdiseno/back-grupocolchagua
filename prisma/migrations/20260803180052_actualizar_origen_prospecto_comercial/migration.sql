-- AlterEnum
-- La tabla "DatosEtapaProspectoComercial" está vacía (0 filas) al momento de
-- esta migración, así que el cast de abajo no puede fallar por valores
-- huérfanos de EVENTO_FERIA/BASE_DATOS.
BEGIN;
CREATE TYPE "OrigenProspectoComercial_new" AS ENUM ('REFERIDO', 'PAGINA_WEB', 'LLAMADA_SALIENTE', 'CORREO_ELECTRONICO', 'LINKEDIN', 'WHATSAPP', 'OTRO');
ALTER TABLE "DatosEtapaProspectoComercial" ALTER COLUMN "origenProspecto" TYPE "OrigenProspectoComercial_new" USING ("origenProspecto"::text::"OrigenProspectoComercial_new");
ALTER TYPE "OrigenProspectoComercial" RENAME TO "OrigenProspectoComercial_old";
ALTER TYPE "OrigenProspectoComercial_new" RENAME TO "OrigenProspectoComercial";
DROP TYPE "OrigenProspectoComercial_old";
COMMIT;
