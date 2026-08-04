-- CreateIndex
CREATE INDEX "OportunidadReclutamiento_empresaId_idx" ON "OportunidadReclutamiento"("empresaId");

-- CreateIndex
CREATE INDEX "OportunidadReclutamiento_cargoId_idx" ON "OportunidadReclutamiento"("cargoId");

-- CreateIndex
CREATE INDEX "OportunidadReclutamiento_sucursalId_idx" ON "OportunidadReclutamiento"("sucursalId");

-- CreateIndex
CREATE INDEX "OportunidadReclutamiento_reclutadorResponsableId_idx" ON "OportunidadReclutamiento"("reclutadorResponsableId");

-- CreateIndex
CREATE INDEX "OportunidadReclutamiento_actualizadoPorId_idx" ON "OportunidadReclutamiento"("actualizadoPorId");

-- CreateIndex
CREATE INDEX "OportunidadReclutamiento_empleoId_idx" ON "OportunidadReclutamiento"("empleoId");

-- CreateIndex
CREATE INDEX "OportunidadReclutamiento_estado_idx" ON "OportunidadReclutamiento"("estado");
