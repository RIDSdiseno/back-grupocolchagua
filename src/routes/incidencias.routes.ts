import { Router } from "express";
import {
  listarIncidencias,
  crearIncidencia,
  actualizarIncidencia,
  eliminarIncidencia,
  resumenIncidencias,
} from "../controllers/incidencias.controller";

import { verificarToken } from "../middlewares/auth.middleware";

const router = Router();

// Todas las rutas requieren sesión de administrador.
router.use(verificarToken);

router.get("/", listarIncidencias);
router.get("/resumen", resumenIncidencias);
router.post("/", crearIncidencia);
router.put("/:id", actualizarIncidencia);
router.delete("/:id", eliminarIncidencia);

export default router;