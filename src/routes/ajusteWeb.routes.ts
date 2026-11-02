import { Router } from "express";
import {
  actualizarAjuste,
  listarAjustesPublicos,
} from "../controllers/ajusteWeb.controller";
import { verificarToken } from "../middlewares/auth.middleware";

const router = Router();

// Pública: la consume la página web.
router.get("/publicos", listarAjustesPublicos);

router.put("/:clave", verificarToken, actualizarAjuste);

export default router;
