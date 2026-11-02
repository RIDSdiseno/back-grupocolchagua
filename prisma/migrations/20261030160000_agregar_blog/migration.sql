-- CreateTable
CREATE TABLE "categorias_blog" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publicaciones_blog" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "resumen" TEXT NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "autorMiembroId" INTEGER,
    "autorNombre" TEXT,
    "portadaUrl" TEXT,
    "portadaPublicId" TEXT,
    "portadaAlt" TEXT,
    "contenido" JSONB NOT NULL,
    "etiquetas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "minutosLectura" INTEGER NOT NULL DEFAULT 1,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "fechaPublicacion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publicaciones_blog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_blog_slug_key" ON "categorias_blog"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "publicaciones_blog_slug_key" ON "publicaciones_blog"("slug");

-- CreateIndex
CREATE INDEX "publicaciones_blog_categoriaId_idx" ON "publicaciones_blog"("categoriaId");

-- CreateIndex
CREATE INDEX "publicaciones_blog_autorMiembroId_idx" ON "publicaciones_blog"("autorMiembroId");

-- CreateIndex
CREATE INDEX "publicaciones_blog_publicado_fechaPublicacion_idx" ON "publicaciones_blog"("publicado", "fechaPublicacion");

-- AddForeignKey
ALTER TABLE "publicaciones_blog" ADD CONSTRAINT "publicaciones_blog_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias_blog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicaciones_blog" ADD CONSTRAINT "publicaciones_blog_autorMiembroId_fkey" FOREIGN KEY ("autorMiembroId") REFERENCES "miembros_equipo_web"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Categorías iniciales (las de la maqueta del blog); se editan desde la intranet.
INSERT INTO "categorias_blog" ("nombre", "slug", "orden", "updatedAt") VALUES
  ('Para empresas', 'para-empresas', 0, CURRENT_TIMESTAMP),
  ('Para postulantes', 'para-postulantes', 1, CURRENT_TIMESTAMP),
  ('Prevención de riesgos', 'prevencion-de-riesgos', 2, CURRENT_TIMESTAMP),
  ('Noticias', 'noticias', 3, CURRENT_TIMESTAMP);

-- La sección pasó a llamarse Blog: se conserva el valor del interruptor.
UPDATE "ajustes_web" SET "clave" = 'blogVisible' WHERE "clave" = 'publicacionesVisibles';
