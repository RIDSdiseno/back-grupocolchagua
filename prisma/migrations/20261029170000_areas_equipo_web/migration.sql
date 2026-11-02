-- CreateTable
CREATE TABLE "areas_equipo_web" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "areas_equipo_web_pkey" PRIMARY KEY ("id")
);

-- Áreas que la página Nosotros tenía fijas en el código.
INSERT INTO "areas_equipo_web" ("nombre", "descripcion", "orden", "updatedAt") VALUES
    ('Dirección', 'Conducción estratégica del grupo y las decisiones que guían el servicio a clientes y trabajadores.', 0, CURRENT_TIMESTAMP),
    ('Comercial', 'Tu primer contacto para cotizar y diseñar la solución que necesita tu empresa.', 1, CURRENT_TIMESTAMP),
    ('Operaciones', 'El equipo que está en terreno, junto a cada cliente, asegurando que el servicio funcione todos los días.', 2, CURRENT_TIMESTAMP),
    ('Reclutamiento y Selección', 'Buscamos, evaluamos y elegimos a las personas que llegan a cada empresa.', 3, CURRENT_TIMESTAMP),
    ('Prevención de Riesgos', 'Cuidamos la seguridad de nuestros trabajadores en cada instalación.', 4, CURRENT_TIMESTAMP),
    ('Gestión de Personas', 'Contratos, remuneraciones y todo lo que nuestros trabajadores necesitan resolver.', 5, CURRENT_TIMESTAMP),
    ('Administración y Finanzas', 'Gestión contable, presupuestaria y financiera de ambas marcas del grupo.', 6, CURRENT_TIMESTAMP),
    ('Logística y Servicios Generales', 'Uniformes, implementos y la atención en nuestras oficinas.', 7, CURRENT_TIMESTAMP);

-- AlterTable: el área pasa de texto a una referencia a areas_equipo_web.
ALTER TABLE "miembros_equipo_web" DROP COLUMN "area",
ADD COLUMN     "areaId" INTEGER;

-- CreateIndex
CREATE INDEX "miembros_equipo_web_areaId_idx" ON "miembros_equipo_web"("areaId");

-- AddForeignKey
ALTER TABLE "miembros_equipo_web" ADD CONSTRAINT "miembros_equipo_web_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas_equipo_web"("id") ON DELETE SET NULL ON UPDATE CASCADE;
