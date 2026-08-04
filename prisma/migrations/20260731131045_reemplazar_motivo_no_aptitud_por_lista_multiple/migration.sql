/*
  Warnings:

  - You are about to drop the column `motivoNoAptitud` on the `OportunidadEntrevista` table. All the data in the column will be lost.
  - You are about to drop the column `motivoNoAptitudOtro` on the `OportunidadEntrevista` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OportunidadEntrevista" DROP COLUMN "motivoNoAptitud",
DROP COLUMN "motivoNoAptitudOtro";

-- CreateTable
CREATE TABLE "OportunidadEntrevistaMotivoNoAptitud" (
    "id" SERIAL NOT NULL,
    "entrevistaId" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "motivoPersonalizado" TEXT,
    "motivoNormalizado" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OportunidadEntrevistaMotivoNoAptitud_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OportunidadEntrevistaMotivoNoAptitud_entrevistaId_idx" ON "OportunidadEntrevistaMotivoNoAptitud"("entrevistaId");

-- CreateIndex
CREATE UNIQUE INDEX "OportunidadEntrevistaMotivoNoAptitud_entrevistaId_motivoNor_key" ON "OportunidadEntrevistaMotivoNoAptitud"("entrevistaId", "motivoNormalizado");

-- AddForeignKey
ALTER TABLE "OportunidadEntrevistaMotivoNoAptitud" ADD CONSTRAINT "OportunidadEntrevistaMotivoNoAptitud_entrevistaId_fkey" FOREIGN KEY ("entrevistaId") REFERENCES "OportunidadEntrevista"("id") ON DELETE CASCADE ON UPDATE CASCADE;
