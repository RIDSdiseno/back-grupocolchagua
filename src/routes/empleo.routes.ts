import { Router } from "express";
import {
  actualizarEmpleo,
  cerrarEmpleo,
  crearEmpleo,
  eliminarEmpleo,
  listarEmpleos,
  listarEmpleosPublicos,
  obtenerEmpleo,
  pausarEmpleo,
  publicarEmpleo,
} from "../controllers/empleo.controller";

const router = Router();

router.get("/", listarEmpleos);
router.get("/publicos", listarEmpleosPublicos);
router.get("/:id", obtenerEmpleo);

router.post("/", crearEmpleo);
router.put("/:id", actualizarEmpleo);
router.patch("/:id", actualizarEmpleo);

router.patch("/:id/publicar", publicarEmpleo);
router.patch("/:id/pausar", pausarEmpleo);
router.patch("/:id/cerrar", cerrarEmpleo);

router.delete("/:id", eliminarEmpleo);

export default router;