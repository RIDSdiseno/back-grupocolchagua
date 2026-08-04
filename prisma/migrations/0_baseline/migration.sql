-- CreateEnum
CREATE TYPE "EstadoEmpleo" AS ENUM ('BORRADOR', 'PUBLICADO', 'PAUSADO', 'CERRADO');

-- CreateEnum
CREATE TYPE "JornadaEmpleo" AS ENUM ('FULL_TIME', 'PART_TIME', 'TURNOS', 'FREELANCE', 'PRACTICA');

-- CreateEnum
CREATE TYPE "ModalidadEmpleo" AS ENUM ('PRESENCIAL', 'REMOTO', 'HIBRIDO');

-- CreateTable
CREATE TABLE "Asignacion" (
    "id" SERIAL NOT NULL,
    "trabajadorId" INTEGER NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "sucursalId" INTEGER,
    "cargoId" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "gerencia" TEXT,
    "seccion" TEXT,
    "supervisor" TEXT,

    CONSTRAINT "Asignacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asistencia" (
    "id" SERIAL NOT NULL,
    "trabajadorId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "cargoId" INTEGER NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "sucursalId" INTEGER,
    "observacion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'A',
    "horasExtras" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "turno" TEXT NOT NULL DEFAULT 'diurno',

    CONSTRAINT "Asistencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cargo" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Cargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empresa" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "rut" TEXT,
    "logoPublicId" TEXT,
    "logoUrl" TEXT,
    "razonSocial" TEXT,
    "encargadoNombre" TEXT,
    "encargadoCorreo" TEXT,
    "encargadoTelefono" TEXT,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holding" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "logoUrl" TEXT,
    "logoPublicId" TEXT,

    CONSTRAINT "Holding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HoldingEmpresa" (
    "id" SERIAL NOT NULL,
    "holdingId" INTEGER NOT NULL,
    "empresaId" INTEGER NOT NULL,

    CONSTRAINT "HoldingEmpresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidenciaAsistencia" (
    "id" SERIAL NOT NULL,
    "trabajadorId" INTEGER NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "sucursalId" INTEGER,
    "cargoId" INTEGER,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT NOT NULL,
    "minutos" INTEGER NOT NULL DEFAULT 0,
    "monto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncidenciaAsistencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailingAdjunto" (
    "id" SERIAL NOT NULL,
    "campanaId" INTEGER NOT NULL,
    "nombreOriginal" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MailingAdjunto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailingCampana" (
    "id" SERIAL NOT NULL,
    "asunto" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "grupo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "fechaProgramada" TIMESTAMP(3),
    "enviados" INTEGER NOT NULL DEFAULT 0,
    "errores" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailingCampana_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailingDestinatario" (
    "id" SERIAL NOT NULL,
    "campanaId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "error" TEXT,
    "enviadoAt" TIMESTAMP(3),

    CONSTRAINT "MailingDestinatario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Postulacion" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "rut" TEXT,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "cargoPostula" TEXT NOT NULL,
    "comuna" TEXT,
    "region" TEXT,
    "experiencia" TEXT,
    "disponibilidad" TEXT,
    "mensaje" TEXT,
    "cvUrl" TEXT NOT NULL,
    "cvPublicId" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "empleoId" INTEGER,

    CONSTRAINT "Postulacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreLiquidacion" (
    "id" SERIAL NOT NULL,
    "trabajadorId" INTEGER NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "sucursalId" INTEGER,
    "cargoId" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "sueldoBase" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "diasTrabajados" INTEGER NOT NULL DEFAULT 0,
    "diasLibres" INTEGER NOT NULL DEFAULT 0,
    "diasFalta" INTEGER NOT NULL DEFAULT 0,
    "cantidadHorasExtras" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cantidadHorasExtrasPendientes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montoDiasTrabajados" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montoHorasExtras" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montoHorasExtrasPendientes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "difRem" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "difRem2" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "difLiq" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "asignacionPerdidaCaja" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "colacion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "movilizacion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "viatico" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonoImponible1" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonoImponible2" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonoImponible3" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "colacionExtraNoImponible" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonoTurnoNocturno" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalHaberes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDescuentos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "anticipo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montoInformar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreLiquidacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sucursal" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "comuna" TEXT,
    "ciudad" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" INTEGER NOT NULL,
    "holdingId" INTEGER NOT NULL,

    CONSTRAINT "Sucursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tarifa" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "sucursalId" INTEGER NOT NULL,
    "cargoId" INTEGER NOT NULL,
    "bonoAsistencia" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonoColacion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonoNoche" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otrosBonos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sueldoBase" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valorHoraExtra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonoCaja" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonoMovilizacion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonoResponsabilidad" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Tarifa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trabajador" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trabajador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'ADMIN',

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleos" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "empresa" TEXT,
    "cargo" TEXT,
    "ubicacion" TEXT,
    "comuna" TEXT,
    "region" TEXT,
    "modalidad" "ModalidadEmpleo",
    "jornada" "JornadaEmpleo",
    "sueldo" TEXT,
    "descripcion" TEXT NOT NULL,
    "requisitos" TEXT,
    "beneficios" TEXT,
    "vacantes" INTEGER NOT NULL DEFAULT 1,
    "estado" "EstadoEmpleo" NOT NULL DEFAULT 'BORRADOR',
    "fechaCierre" TIMESTAMP(3),
    "publicadoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empleos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asistencia_trabajadorId_fecha_empresaId_key" ON "Asistencia"("trabajadorId" ASC, "fecha" ASC, "empresaId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Cargo_nombre_key" ON "Cargo"("nombre" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_rut_key" ON "Empresa"("rut" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Holding_nombre_key" ON "Holding"("nombre" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "HoldingEmpresa_holdingId_empresaId_key" ON "HoldingEmpresa"("holdingId" ASC, "empresaId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PreLiquidacion_trabajadorId_empresaId_sucursalId_mes_anio_key" ON "PreLiquidacion"("trabajadorId" ASC, "empresaId" ASC, "sucursalId" ASC, "mes" ASC, "anio" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Sucursal_empresaId_holdingId_nombre_key" ON "Sucursal"("empresaId" ASC, "holdingId" ASC, "nombre" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Tarifa_empresaId_sucursalId_cargoId_key" ON "Tarifa"("empresaId" ASC, "sucursalId" ASC, "cargoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Trabajador_rut_key" ON "Trabajador"("rut" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email" ASC);

-- AddForeignKey
ALTER TABLE "Asignacion" ADD CONSTRAINT "Asignacion_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asignacion" ADD CONSTRAINT "Asignacion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asignacion" ADD CONSTRAINT "Asignacion_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asignacion" ADD CONSTRAINT "Asignacion_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "Trabajador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "Trabajador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoldingEmpresa" ADD CONSTRAINT "HoldingEmpresa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoldingEmpresa" ADD CONSTRAINT "HoldingEmpresa_holdingId_fkey" FOREIGN KEY ("holdingId") REFERENCES "Holding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidenciaAsistencia" ADD CONSTRAINT "IncidenciaAsistencia_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidenciaAsistencia" ADD CONSTRAINT "IncidenciaAsistencia_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidenciaAsistencia" ADD CONSTRAINT "IncidenciaAsistencia_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidenciaAsistencia" ADD CONSTRAINT "IncidenciaAsistencia_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "Trabajador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailingAdjunto" ADD CONSTRAINT "MailingAdjunto_campanaId_fkey" FOREIGN KEY ("campanaId") REFERENCES "MailingCampana"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailingDestinatario" ADD CONSTRAINT "MailingDestinatario_campanaId_fkey" FOREIGN KEY ("campanaId") REFERENCES "MailingCampana"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Postulacion" ADD CONSTRAINT "Postulacion_empleoId_fkey" FOREIGN KEY ("empleoId") REFERENCES "empleos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreLiquidacion" ADD CONSTRAINT "PreLiquidacion_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreLiquidacion" ADD CONSTRAINT "PreLiquidacion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreLiquidacion" ADD CONSTRAINT "PreLiquidacion_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreLiquidacion" ADD CONSTRAINT "PreLiquidacion_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "Trabajador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sucursal" ADD CONSTRAINT "Sucursal_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sucursal" ADD CONSTRAINT "Sucursal_holdingId_fkey" FOREIGN KEY ("holdingId") REFERENCES "Holding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarifa" ADD CONSTRAINT "Tarifa_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarifa" ADD CONSTRAINT "Tarifa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarifa" ADD CONSTRAINT "Tarifa_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

