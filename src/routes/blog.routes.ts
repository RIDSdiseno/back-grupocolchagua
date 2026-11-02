import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import {
  actualizarCategoria,
  crearCategoria,
  eliminarCategoria,
  listarCategorias,
  listarCategoriasPublicas,
  reordenarCategorias,
} from "../controllers/categoriaBlog.controller";
import {
  actualizarPublicacion,
  crearPublicacion,
  eliminarPublicacion,
  listarPublicaciones,
  listarPublicacionesPublicas,
  obtenerPublicacion,
  obtenerPublicacionPublica,
} from "../controllers/publicacionBlog.controller";
import { verificarToken } from "../middlewares/auth.middleware";

const router = Router();

const MAXIMO_IMAGENES_CUERPO = 30;

// Portada + imágenes del cuerpo del artículo. Sin fileFilter: las imágenes del
// cuerpo se identifican por posición, así que descartar una correría las demás;
// el controlador rechaza las que no sean imagen.
const leerArchivos = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).fields([
  { name: "portada", maxCount: 1 },
  { name: "imagenes", maxCount: MAXIMO_IMAGENES_CUERPO },
]);

const archivosPublicacion = (req: Request, res: Response, next: NextFunction) =>
  leerArchivos(req, res, (error: unknown) => {
    if (!error) return next();

    const codigo = error instanceof multer.MulterError ? error.code : null;

    return res.status(400).json({
      ok: false,
      message:
        codigo === "LIMIT_FILE_SIZE"
          ? "Cada imagen puede pesar como máximo 5 MB"
          : codigo === "LIMIT_UNEXPECTED_FILE"
            ? `El artículo puede tener como máximo ${MAXIMO_IMAGENES_CUERPO} imágenes nuevas por guardado`
            : "No se pudieron leer las imágenes",
    });
  });

// Públicas: las consume la página web.
router.get("/publico/categorias", listarCategoriasPublicas);
router.get("/publico/publicaciones", listarPublicacionesPublicas);
router.get("/publico/publicaciones/:slug", obtenerPublicacionPublica);

router.get("/categorias", verificarToken, listarCategorias);
router.post("/categorias", verificarToken, crearCategoria);
router.patch("/categorias/orden", verificarToken, reordenarCategorias);
router.put("/categorias/:id", verificarToken, actualizarCategoria);
router.delete("/categorias/:id", verificarToken, eliminarCategoria);

router.get("/publicaciones", verificarToken, listarPublicaciones);
router.get("/publicaciones/:id", verificarToken, obtenerPublicacion);
router.post("/publicaciones", verificarToken, archivosPublicacion, crearPublicacion);
router.put("/publicaciones/:id", verificarToken, archivosPublicacion, actualizarPublicacion);
router.delete("/publicaciones/:id", verificarToken, eliminarPublicacion);

export default router;
