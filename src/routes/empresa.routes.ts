import { Router } from "express";
import multer from "multer";
import {
  actualizarEmpresa,
  crearEmpresa,
  eliminarEmpresa,
  listarEmpresas,
} from "../controllers/empresa.controller";
import { verificarToken } from "../middlewares/auth.middleware";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.get("/", verificarToken, listarEmpresas);
router.post("/", verificarToken, upload.single("foto"), crearEmpresa);
router.put("/:id", verificarToken, upload.single("foto"), actualizarEmpresa);
router.delete("/:id", verificarToken, eliminarEmpresa);

export default router;