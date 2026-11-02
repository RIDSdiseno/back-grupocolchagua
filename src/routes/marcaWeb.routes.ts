import { Router } from "express";
import multer from "multer";
import {
  actualizarMarca,
  crearMarca,
  eliminarMarca,
  listarMarcas,
  listarMarcasPublicas,
  reordenarMarcas,
} from "../controllers/marcaWeb.controller";
import { verificarToken } from "../middlewares/auth.middleware";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype.startsWith("image/"));
  },
});

// Pública: la consume la página web.
router.get("/publicas", listarMarcasPublicas);

router.get("/", verificarToken, listarMarcas);
router.post("/", verificarToken, upload.single("logo"), crearMarca);
router.patch("/orden", verificarToken, reordenarMarcas);
router.put("/:id", verificarToken, upload.single("logo"), actualizarMarca);
router.delete("/:id", verificarToken, eliminarMarca);

export default router;
