import { Router } from "express";
import {
  crearEmpleo,
  listarEmpleos,
  listarEmpleosPublicos,
  obtenerEmpleo,
  actualizarEmpleo,
  publicarEmpleo,
  pausarEmpleo,
  cerrarEmpleo,
  eliminarEmpleo,
} from "../controllers/empleo.controller";

const router = Router();

router.get("/publicos", listarEmpleosPublicos);
router.get("/", listarEmpleos);
router.get("/:id", obtenerEmpleo);
router.post("/", crearEmpleo);
router.patch("/:id", actualizarEmpleo);
router.patch("/:id/publicar", publicarEmpleo);
router.patch("/:id/pausar", pausarEmpleo);
router.patch("/:id/cerrar", cerrarEmpleo);
router.delete("/:id", eliminarEmpleo);

export default router;