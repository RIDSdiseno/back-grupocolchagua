import { Router } from "express";
import { recibirContacto, recibirCotizacion } from "../controllers/contacto.controller";
// Postulaciones desactivadas: ahora se postula solo por Computrabajo.
// import { crearPostulacion } from "../controllers/postulacion.controller";
// import { listarEmpleosPublicos } from "../controllers/empleo.controller";
import { listarCategoriasPublicas } from "../controllers/categoriaBlog.controller";
import {
  listarPublicacionesPublicas,
  obtenerPublicacionPublica,
} from "../controllers/publicacionBlog.controller";
import { listarMarcasPublicas } from "../controllers/marcaWeb.controller";
import { listarEquipoPublico } from "../controllers/equipoWeb.controller";
import { listarAjustesPublicos } from "../controllers/ajusteWeb.controller";
// import { uploadPostulacion } from "../middlewares/postulacion-upload.middleware";

// Únicas rutas que quedan activas mientras la intranet está dada de baja:
// las que usa el sitio público grupocolchagua.cl. Mantienen las mismas URL de
// antes, así que el sitio no necesita cambios.
//
// Las rutas de administración (trabajadores, preliquidaciones, mailing,
// Talana, finanzas, login, etc.) siguen en src/routes, pero no se montan en
// app.ts: así no exponen datos personales que nadie está usando
// (Ley 21.719, minimización y seguridad).
const router = Router();

// Formularios
router.post("/contacto", recibirContacto);
router.post("/contacto/cotizar", recibirCotizacion);

// Postulaciones y ofertas propias: DESACTIVADAS. El sitio ahora deriva a
// Computrabajo y ya no recibe currículums. Para reactivarlas, descomentar
// estas dos líneas y sus imports de arriba.
// router.post("/postulaciones", uploadPostulacion.single("cv"), crearPostulacion);
// router.get("/empleos/publicos", listarEmpleosPublicos);

// Contenido publicado
router.get("/blog/publico/categorias", listarCategoriasPublicas);
router.get("/blog/publico/publicaciones", listarPublicacionesPublicas);
router.get("/blog/publico/publicaciones/:slug", obtenerPublicacionPublica);
router.get("/marcas-web/publicas", listarMarcasPublicas);
router.get("/equipo-web/publicos", listarEquipoPublico);
router.get("/ajustes-web/publicos", listarAjustesPublicos);

export default router;
