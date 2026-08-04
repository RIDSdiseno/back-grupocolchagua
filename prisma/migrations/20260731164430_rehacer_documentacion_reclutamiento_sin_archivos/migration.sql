-- AlterTable
ALTER TABLE "DatosEtapaDocumentacion" RENAME COLUMN "documentacionRechazada" TO "documentacionObservada";

-- AlterTable
ALTER TABLE "DocumentoRequeridoOportunidad" ADD COLUMN     "cantidadEntregada" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tipoDocumento" TEXT NOT NULL DEFAULT 'Otro';

UPDATE "DocumentoRequeridoOportunidad"
SET "tipoDocumento" = CASE
  WHEN "nombre" IN (
    'Cédula de identidad',
    'Certificado de antecedentes',
    'AFP',
    'Salud',
    'Cuenta bancaria',
    'Contrato firmado',
    'Examen preocupacional',
    'Licencia de conducir',
    'Certificados'
  ) THEN "nombre"
  ELSE 'Otro'
END;
