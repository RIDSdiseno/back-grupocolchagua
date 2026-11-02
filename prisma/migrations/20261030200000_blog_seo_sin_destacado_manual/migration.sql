-- Campos SEO del artículo. El destacado pasa a ser automático (el más reciente),
-- así que se quita la marca manual.
-- AlterTable
ALTER TABLE "publicaciones_blog" DROP COLUMN "destacado",
ADD COLUMN     "seoDescripcion" TEXT,
ADD COLUMN     "seoTitulo" TEXT;

