import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import cloudinary from "../config/cloudinary";
import { subirImagenCloudinary } from "../utils/subirImagenCloudinary";
import {
  buscarSlugLibre,
  generarSlug,
  limpiarTexto,
  parsearBooleano,
  parsearId,
} from "../utils/texto";

const CARPETA_PORTADAS = "grupo-colchagua/blog/portadas";
const CARPETA_IMAGENES = "grupo-colchagua/blog/imagenes";
const LARGO_MAXIMO_TITULO = 150;
const LARGO_MAXIMO_RESUMEN = 300;
// Largos que Google suele mostrar completos.
const LARGO_MAXIMO_SEO_TITULO = 70;
const LARGO_MAXIMO_SEO_DESCRIPCION = 160;
const LARGO_MAXIMO_TEXTO_BLOQUE = 5000;
const LARGO_MAXIMO_ITEM_LISTA = 300;
const MAXIMO_ITEMS_LISTA = 20;
const MAXIMO_BLOQUES = 150;
const MAXIMO_ETIQUETAS = 10;
const PALABRAS_POR_MINUTO = 200;

// Bloques del cuerpo de un artículo; cada tipo corresponde a un elemento de la
// maqueta del blog.
type Bloque =
  | { tipo: "parrafo"; texto: string }
  | { tipo: "subtitulo"; texto: string }
  | { tipo: "lista"; items: string[] }
  | { tipo: "dato"; titulo: string | null; texto: string }
  | { tipo: "imagen"; url: string; publicId: string; alt: string | null; pie: string | null };

// Imagen recién elegida en el editor: `archivo` es su posición en los archivos
// "imagenes" del formulario. Se reemplaza por un bloque "imagen" al subirla.
type BloqueImagenNueva = { tipo: "imagen-nueva"; archivo: number; alt: string | null; pie: string | null };

type BloqueEntrada = Bloque | BloqueImagenNueva;

class ErrorValidacion extends Error {}

const recortar = (valor: unknown, largoMaximo: number, campo: string) => {
  const texto = limpiarTexto(valor);

  if (texto && texto.length > largoMaximo) {
    throw new ErrorValidacion(`${campo} no puede superar los ${largoMaximo} caracteres`);
  }

  return texto;
};

// Normaliza el contenido recibido: descarta bloques vacíos y rechaza los
// inválidos. Una imagen es una ya guardada (url + publicId de la carpeta del
// blog) o un archivo nuevo del formulario (`archivo`).
const normalizarContenido = (valor: unknown, totalArchivos: number): BloqueEntrada[] => {
  let crudo: unknown = valor;

  if (typeof valor === "string") {
    try {
      crudo = JSON.parse(valor);
    } catch {
      throw new ErrorValidacion("El contenido del artículo no es válido");
    }
  }

  if (!Array.isArray(crudo)) {
    throw new ErrorValidacion("El contenido del artículo no es válido");
  }

  if (crudo.length > MAXIMO_BLOQUES) {
    throw new ErrorValidacion(`El artículo no puede tener más de ${MAXIMO_BLOQUES} bloques`);
  }

  const bloques: BloqueEntrada[] = [];
  const usados = new Set<number>();

  for (const item of crudo) {
    const bloque = (item ?? {}) as Record<string, unknown>;

    switch (bloque.tipo) {
      case "parrafo":
      case "subtitulo": {
        const texto = recortar(bloque.texto, LARGO_MAXIMO_TEXTO_BLOQUE, "Cada bloque de texto");
        if (texto) bloques.push({ tipo: bloque.tipo, texto });
        break;
      }

      case "lista": {
        const items = (Array.isArray(bloque.items) ? bloque.items : [])
          .map((i) => recortar(i, LARGO_MAXIMO_ITEM_LISTA, "Cada punto de una lista"))
          .filter((i): i is string => Boolean(i));

        if (items.length > MAXIMO_ITEMS_LISTA) {
          throw new ErrorValidacion(`Una lista no puede tener más de ${MAXIMO_ITEMS_LISTA} puntos`);
        }

        if (items.length > 0) bloques.push({ tipo: "lista", items });
        break;
      }

      case "dato": {
        const texto = recortar(bloque.texto, LARGO_MAXIMO_TEXTO_BLOQUE, "El dato clave");
        if (texto) {
          bloques.push({
            tipo: "dato",
            titulo: recortar(bloque.titulo, 80, "El título del dato clave"),
            texto,
          });
        }
        break;
      }

      case "imagen": {
        const alt = recortar(bloque.alt, 200, "La descripción de la imagen");
        const pie = recortar(bloque.pie, 300, "El pie de foto");

        // Imagen nueva: viene como archivo en el mismo formulario y se sube al guardar.
        if (bloque.archivo !== undefined) {
          const archivo = Number(bloque.archivo);

          if (!Number.isInteger(archivo) || archivo < 0 || archivo >= totalArchivos || usados.has(archivo)) {
            throw new ErrorValidacion("Hay una imagen del artículo que no es válida");
          }

          usados.add(archivo);
          bloques.push({ tipo: "imagen-nueva", archivo, alt, pie });
          break;
        }

        const url = limpiarTexto(bloque.url);
        const publicId = limpiarTexto(bloque.publicId);

        if (
          !url ||
          !publicId ||
          !url.startsWith("https://res.cloudinary.com/") ||
          !publicId.startsWith(`${CARPETA_IMAGENES}/`)
        ) {
          throw new ErrorValidacion("Hay una imagen del artículo que no es válida");
        }

        bloques.push({ tipo: "imagen", url, publicId, alt, pie });
        break;
      }

      default:
        throw new ErrorValidacion("El contenido tiene un tipo de bloque desconocido");
    }
  }

  return bloques;
};

// Acepta un arreglo JSON o texto separado por comas; quita los "#".
const normalizarEtiquetas = (valor: unknown): string[] => {
  let lista: unknown[] = [];

  if (Array.isArray(valor)) {
    lista = valor;
  } else if (typeof valor === "string") {
    try {
      const parseado = JSON.parse(valor);
      lista = Array.isArray(parseado) ? parseado : [valor];
    } catch {
      lista = valor.split(",");
    }
  }

  const etiquetas = [
    ...new Set(
      lista
        .map((e) => String(e ?? "").replace(/#/g, "").trim())
        .filter((e) => e.length > 0 && e.length <= 40)
    ),
  ];

  if (etiquetas.length > MAXIMO_ETIQUETAS) {
    throw new ErrorValidacion(`No puede haber más de ${MAXIMO_ETIQUETAS} etiquetas`);
  }

  return etiquetas;
};

// "2026-10-30" → fecha a mediodía UTC, para que no cambie de día en Chile.
const parsearFecha = (valor: unknown): Date | null | undefined => {
  if (valor === undefined) return undefined;

  const texto = limpiarTexto(valor);
  if (!texto) return null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    throw new ErrorValidacion("La fecha de publicación no es válida");
  }

  const fecha = new Date(`${texto}T12:00:00.000Z`);

  if (Number.isNaN(fecha.getTime())) {
    throw new ErrorValidacion("La fecha de publicación no es válida");
  }

  return fecha;
};

const calcularMinutosLectura = (titulo: string, resumen: string, bloques: BloqueEntrada[]) => {
  const textos = [titulo, resumen];

  for (const bloque of bloques) {
    if (bloque.tipo === "lista") textos.push(...bloque.items);
    else if (bloque.tipo === "dato") textos.push(bloque.titulo ?? "", bloque.texto);
    else if (bloque.tipo === "imagen" || bloque.tipo === "imagen-nueva") textos.push(bloque.pie ?? "");
    else textos.push(bloque.texto);
  }

  const palabras = textos.join(" ").split(/\s+/).filter(Boolean).length;

  return Math.max(1, Math.round(palabras / PALABRAS_POR_MINUTO));
};

const idsImagenes = (contenido: unknown): string[] =>
  Array.isArray(contenido)
    ? contenido
        .filter((b) => b && b.tipo === "imagen" && typeof b.publicId === "string")
        .map((b) => b.publicId as string)
    : [];

const borrarImagenes = async (publicIds: string[]) => {
  for (const publicId of publicIds) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error("ERROR BORRAR IMAGEN BLOG:", publicId, error);
    }
  }
};

type ArchivosFormulario = { [campo: string]: Express.Multer.File[] } | undefined;

// Portada e imágenes del cuerpo que llegaron en el formulario. Rechaza
// cualquier archivo que no sea imagen.
const leerArchivos = (req: Request) => {
  const archivos = req.files as ArchivosFormulario;
  const portada = archivos?.portada?.[0];
  const imagenes = archivos?.imagenes ?? [];

  if ([...(portada ? [portada] : []), ...imagenes].some((a) => !a.mimetype.startsWith("image/"))) {
    throw new ErrorValidacion("Solo se pueden subir archivos de imagen");
  }

  return { portada, imagenes };
};

// Sube las imágenes nuevas del cuerpo (ya validadas) y las reemplaza por
// bloques "imagen". Devuelve también los publicId subidos, para borrarlos si
// después falla el guardado.
const subirImagenesNuevas = async (bloques: BloqueEntrada[], archivos: Express.Multer.File[]) => {
  const subidas: string[] = [];

  try {
    const contenido: Bloque[] = [];

    for (const bloque of bloques) {
      if (bloque.tipo !== "imagen-nueva") {
        contenido.push(bloque);
        continue;
      }

      const upload = await subirImagenCloudinary(archivos[bloque.archivo].buffer, CARPETA_IMAGENES);
      subidas.push(upload.public_id);
      contenido.push({
        tipo: "imagen",
        url: upload.secure_url,
        publicId: upload.public_id,
        alt: bloque.alt,
        pie: bloque.pie,
      });
    }

    return { contenido, subidas };
  } catch (error) {
    await borrarImagenes(subidas);
    throw error;
  }
};

const obtenerSlugDisponible = (titulo: string, idActual?: number) =>
  buscarSlugLibre(generarSlug(titulo) || "articulo", async (slug) =>
    Boolean(
      await prisma.publicacionBlog.findFirst({
        where: { slug, ...(idActual ? { NOT: { id: idActual } } : {}) },
        select: { id: true },
      })
    )
  );

// Lee y valida los campos del formulario. En una edición, los campos que no
// vienen conservan el valor actual.
const leerDatos = async (
  body: Record<string, unknown>,
  totalImagenesNuevas: number,
  actual?: Prisma.PublicacionBlogGetPayload<object>
) => {
  const tomar = (campo: string, valorActual: string | null, largoMaximo: number, nombre: string) =>
    body[campo] !== undefined ? recortar(body[campo], largoMaximo, nombre) : valorActual;

  const titulo = tomar("titulo", actual?.titulo ?? null, LARGO_MAXIMO_TITULO, "El título");
  const resumen = tomar("resumen", actual?.resumen ?? null, LARGO_MAXIMO_RESUMEN, "El resumen");

  if (!titulo || !resumen) {
    throw new ErrorValidacion("Título y resumen son obligatorios");
  }

  const categoriaId =
    body.categoriaId !== undefined ? parsearId(body.categoriaId) : actual?.categoriaId ?? null;

  if (!categoriaId) {
    throw new ErrorValidacion("Debes elegir una categoría");
  }

  if (categoriaId !== actual?.categoriaId) {
    const existe = await prisma.categoriaBlog.count({ where: { id: categoriaId } });
    if (!existe) throw new ErrorValidacion("La categoría elegida no existe");
  }

  const autorMiembroId =
    body.autorMiembroId !== undefined
      ? parsearId(body.autorMiembroId)
      : actual?.autorMiembroId ?? null;

  if (autorMiembroId && autorMiembroId !== actual?.autorMiembroId) {
    const existe = await prisma.miembroEquipoWeb.count({ where: { id: autorMiembroId } });
    if (!existe) throw new ErrorValidacion("La persona elegida como autor no existe");
  }

  // Si el autor es una persona del equipo, su nombre sale de Equipo.
  const autorNombre = autorMiembroId
    ? null
    : tomar("autorNombre", actual?.autorNombre ?? null, 100, "El nombre del autor");

  const contenido: BloqueEntrada[] =
    body.contenido !== undefined
      ? normalizarContenido(body.contenido, totalImagenesNuevas)
      : (actual?.contenido as Bloque[] | undefined) ?? [];

  const etiquetas =
    body.etiquetas !== undefined ? normalizarEtiquetas(body.etiquetas) : actual?.etiquetas ?? [];

  const publicado = parsearBooleano(body.publicado) ?? actual?.publicado ?? false;

  if (publicado && contenido.length === 0) {
    throw new ErrorValidacion("Para publicar, el artículo debe tener contenido");
  }

  const fechaRecibida = parsearFecha(body.fechaPublicacion);
  let fechaPublicacion =
    fechaRecibida !== undefined ? fechaRecibida : actual?.fechaPublicacion ?? null;

  // Al publicar sin fecha, se usa la de hoy.
  if (publicado && !fechaPublicacion) {
    fechaPublicacion = new Date();
  }

  return {
    titulo,
    resumen,
    categoriaId,
    autorMiembroId,
    autorNombre,
    portadaAlt: tomar("portadaAlt", actual?.portadaAlt ?? null, 200, "La descripción de la portada"),
    contenido,
    etiquetas,
    minutosLectura: calcularMinutosLectura(titulo, resumen, contenido),
    seoTitulo: tomar("seoTitulo", actual?.seoTitulo ?? null, LARGO_MAXIMO_SEO_TITULO, "El título SEO"),
    seoDescripcion: tomar(
      "seoDescripcion",
      actual?.seoDescripcion ?? null,
      LARGO_MAXIMO_SEO_DESCRIPCION,
      "La descripción SEO"
    ),
    publicado,
    fechaPublicacion,
  };
};

const responderError = (res: Response, error: unknown, accion: string, log: string) => {
  if (error instanceof ErrorValidacion) {
    return res.status(400).json({ ok: false, message: error.message });
  }

  console.error(log, error);

  return res.status(500).json({ ok: false, message: `Error al ${accion}` });
};

const camposListado = {
  id: true,
  titulo: true,
  slug: true,
  resumen: true,
  categoriaId: true,
  autorMiembroId: true,
  autorNombre: true,
  portadaUrl: true,
  etiquetas: true,
  minutosLectura: true,
  publicado: true,
  fechaPublicacion: true,
  updatedAt: true,
} satisfies Prisma.PublicacionBlogSelect;

export const listarPublicaciones = async (_req: Request, res: Response) => {
  try {
    const publicaciones = await prisma.publicacionBlog.findMany({
      orderBy: [{ fechaPublicacion: { sort: "desc", nulls: "first" } }, { id: "desc" }],
      select: camposListado,
    });

    return res.json({ ok: true, publicaciones });
  } catch (error) {
    return responderError(res, error, "listar los artículos", "ERROR LISTAR PUBLICACIONES BLOG:");
  }
};

export const obtenerPublicacion = async (req: Request, res: Response) => {
  try {
    const publicacion = await prisma.publicacionBlog.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!publicacion) {
      return res.status(404).json({ ok: false, message: "Artículo no encontrado" });
    }

    return res.json({ ok: true, publicacion });
  } catch (error) {
    return responderError(res, error, "obtener el artículo", "ERROR OBTENER PUBLICACION BLOG:");
  }
};

export const crearPublicacion = async (req: Request, res: Response) => {
  const subidas: string[] = [];

  try {
    const { portada, imagenes } = leerArchivos(req);

    // Se valida todo antes de subir imágenes, para no dejar archivos sin uso.
    const datos = await leerDatos(req.body, imagenes.length);
    const { contenido, subidas: subidasCuerpo } = await subirImagenesNuevas(datos.contenido, imagenes);
    subidas.push(...subidasCuerpo);

    const upload = portada ? await subirImagenCloudinary(portada.buffer, CARPETA_PORTADAS) : null;
    if (upload) subidas.push(upload.public_id);

    const publicacion = await prisma.publicacionBlog.create({
      data: {
        ...datos,
        contenido,
        slug: await obtenerSlugDisponible(datos.titulo),
        portadaUrl: upload?.secure_url ?? null,
        portadaPublicId: upload?.public_id ?? null,
      },
    });

    return res.status(201).json({
      ok: true,
      message: datos.publicado ? "Artículo publicado correctamente" : "Borrador guardado",
      publicacion,
    });
  } catch (error) {
    await borrarImagenes(subidas);
    return responderError(res, error, "crear el artículo", "ERROR CREAR PUBLICACION BLOG:");
  }
};

export const actualizarPublicacion = async (req: Request, res: Response) => {
  const subidas: string[] = [];

  try {
    const publicacionId = Number(req.params.id);

    const existente = await prisma.publicacionBlog.findUnique({
      where: { id: publicacionId },
    });

    if (!existente) {
      return res.status(404).json({ ok: false, message: "Artículo no encontrado" });
    }

    const { portada, imagenes } = leerArchivos(req);

    const datos = await leerDatos(req.body, imagenes.length, existente);
    const { contenido, subidas: subidasCuerpo } = await subirImagenesNuevas(datos.contenido, imagenes);
    subidas.push(...subidasCuerpo);

    let portadaUrl = existente.portadaUrl;
    let portadaPublicId = existente.portadaPublicId;
    const quitarPortada = parsearBooleano(req.body.quitarPortada) === true;

    if (portada || quitarPortada) {
      const upload = portada ? await subirImagenCloudinary(portada.buffer, CARPETA_PORTADAS) : null;
      if (upload) subidas.push(upload.public_id);

      portadaUrl = upload?.secure_url ?? null;
      portadaPublicId = upload?.public_id ?? null;
    }

    // Mientras nunca se haya publicado, la dirección sigue al título.
    const slug =
      datos.titulo !== existente.titulo && !existente.fechaPublicacion
        ? await obtenerSlugDisponible(datos.titulo, publicacionId)
        : existente.slug;

    const publicacion = await prisma.publicacionBlog.update({
      where: { id: publicacionId },
      data: { ...datos, contenido, slug, portadaUrl, portadaPublicId },
    });

    // Ya guardado: se borran la portada reemplazada y las imágenes que salieron del cuerpo.
    const enUso = new Set(idsImagenes(contenido));
    await borrarImagenes([
      ...(existente.portadaPublicId && existente.portadaPublicId !== portadaPublicId
        ? [existente.portadaPublicId]
        : []),
      ...idsImagenes(existente.contenido).filter((id) => !enUso.has(id)),
    ]);

    return res.json({
      ok: true,
      message: "Artículo actualizado correctamente",
      publicacion,
    });
  } catch (error) {
    await borrarImagenes(subidas);
    return responderError(res, error, "actualizar el artículo", "ERROR ACTUALIZAR PUBLICACION BLOG:");
  }
};

export const eliminarPublicacion = async (req: Request, res: Response) => {
  try {
    const publicacionId = Number(req.params.id);

    const publicacion = await prisma.publicacionBlog.findUnique({
      where: { id: publicacionId },
    });

    if (!publicacion) {
      return res.status(404).json({ ok: false, message: "Artículo no encontrado" });
    }

    await prisma.publicacionBlog.delete({ where: { id: publicacionId } });

    await borrarImagenes([
      ...(publicacion.portadaPublicId ? [publicacion.portadaPublicId] : []),
      ...idsImagenes(publicacion.contenido),
    ]);

    return res.json({ ok: true, message: "Artículo eliminado correctamente" });
  } catch (error) {
    return responderError(res, error, "eliminar el artículo", "ERROR ELIMINAR PUBLICACION BLOG:");
  }
};

// ── Página pública ─────────────────────────────────────

const MAXIMO_RELACIONADOS = 3;

// Visible en la web: publicado, con fecha ya cumplida y en una categoría visible.
const condicionPublica = (): Prisma.PublicacionBlogWhereInput => ({
  publicado: true,
  fechaPublicacion: { lte: new Date() },
  categoria: { activo: true },
});

const camposAutor = {
  autorNombre: true,
  autorMiembro: {
    select: { nombre: true, cargo: true, fotoUrl: true, linkedinUrl: true, activo: true },
  },
} satisfies Prisma.PublicacionBlogSelect;

const camposTarjeta = {
  id: true,
  titulo: true,
  slug: true,
  resumen: true,
  portadaUrl: true,
  portadaAlt: true,
  minutosLectura: true,
  fechaPublicacion: true,
  categoria: { select: { nombre: true, slug: true } },
} satisfies Prisma.PublicacionBlogSelect;

// Deja un solo `autor` para la web. Una persona oculta en Equipo se muestra
// solo con su nombre, sin foto ni LinkedIn.
const armarAutor = (publicacion: Prisma.PublicacionBlogGetPayload<{ select: typeof camposAutor }>) => {
  const miembro = publicacion.autorMiembro;

  if (miembro) {
    return miembro.activo
      ? {
          nombre: miembro.nombre,
          cargo: miembro.cargo,
          fotoUrl: miembro.fotoUrl,
          linkedinUrl: miembro.linkedinUrl,
        }
      : { nombre: miembro.nombre, cargo: miembro.cargo, fotoUrl: null, linkedinUrl: null };
  }

  return publicacion.autorNombre
    ? { nombre: publicacion.autorNombre, cargo: null, fotoUrl: null, linkedinUrl: null }
    : null;
};

// Pública: artículos visibles, del más nuevo al más antiguo. Acepta ?categoria=slug.
export const listarPublicacionesPublicas = async (req: Request, res: Response) => {
  try {
    const categoria = limpiarTexto(req.query.categoria);

    const publicaciones = await prisma.publicacionBlog.findMany({
      where: {
        ...condicionPublica(),
        ...(categoria ? { categoria: { activo: true, slug: categoria } } : {}),
      },
      orderBy: [{ fechaPublicacion: "desc" }, { id: "desc" }],
      select: camposTarjeta,
    });

    return res.json({ ok: true, publicaciones });
  } catch (error) {
    return responderError(res, error, "listar los artículos", "ERROR LISTAR PUBLICACIONES BLOG PUBLICAS:");
  }
};

// Pública: un artículo por su slug, con autor y artículos relacionados.
export const obtenerPublicacionPublica = async (req: Request, res: Response) => {
  try {
    const publicacion = await prisma.publicacionBlog.findFirst({
      where: { ...condicionPublica(), slug: String(req.params.slug) },
      select: {
        ...camposTarjeta,
        ...camposAutor,
        contenido: true,
        etiquetas: true,
        seoTitulo: true,
        seoDescripcion: true,
        categoriaId: true,
      },
    });

    if (!publicacion) {
      return res.status(404).json({ ok: false, message: "Artículo no encontrado" });
    }

    // Primero de la misma categoría; si faltan, se completa con los más recientes.
    const mismaCategoria = await prisma.publicacionBlog.findMany({
      where: { ...condicionPublica(), categoriaId: publicacion.categoriaId, NOT: { id: publicacion.id } },
      orderBy: [{ fechaPublicacion: "desc" }, { id: "desc" }],
      take: MAXIMO_RELACIONADOS,
      select: camposTarjeta,
    });

    const otros =
      mismaCategoria.length < MAXIMO_RELACIONADOS
        ? await prisma.publicacionBlog.findMany({
            where: {
              ...condicionPublica(),
              id: { notIn: [publicacion.id, ...mismaCategoria.map((p) => p.id)] },
            },
            orderBy: [{ fechaPublicacion: "desc" }, { id: "desc" }],
            take: MAXIMO_RELACIONADOS - mismaCategoria.length,
            select: camposTarjeta,
          })
        : [];

    const { autorNombre: _autorNombre, autorMiembro: _autorMiembro, categoriaId: _categoriaId, ...resto } =
      publicacion;

    return res.json({
      ok: true,
      publicacion: { ...resto, autor: armarAutor(publicacion) },
      relacionados: [...mismaCategoria, ...otros],
    });
  } catch (error) {
    return responderError(res, error, "obtener el artículo", "ERROR OBTENER PUBLICACION BLOG PUBLICA:");
  }
};
