// src/routes/cargo.routes.ts
import { Router } from "express";
import {
  actualizarCargo,
  crearCargo,
  eliminarCargo,
  listarCargos,
} from "../controllers/cargo.controller";
import { verificarToken } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", verificarToken, listarCargos);
router.post("/", verificarToken, crearCargo);
router.put("/:id", verificarToken, actualizarCargo);
router.delete("/:id", verificarToken, eliminarCargo);

export default router;