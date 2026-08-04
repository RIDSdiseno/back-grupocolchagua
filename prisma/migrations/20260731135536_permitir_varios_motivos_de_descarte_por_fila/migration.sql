/*
  Warnings:

  - You are about to drop the column `motivo` on the `OportunidadEntrevistaMotivoNoAptitud` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OportunidadEntrevistaMotivoNoAptitud" DROP COLUMN "motivo",
ADD COLUMN     "motivos" TEXT[];
