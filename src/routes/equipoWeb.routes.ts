import { Router } from "express";
import multer from "multer";
import {
  actualizarMiembro,
  crearMiembro,
  eliminarMiembro,
  listarEquipo,
  listarEquipoPublico,
  reordenarEquipo,
} from "../controllers/equipoWeb.controller";
import {
  actualizarArea,
  crearArea,
  eliminarArea,
  listarAreas,
  reordenarAreas,
} from "../controllers/areaEquipoWeb.controller";
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

// Pública: para la sección "Nuestro equipo" de la página web.
router.get("/publicos", listarEquipoPublico);

// Áreas (tarjetas de "Nuestro equipo").
router.get("/areas", verificarToken, listarAreas);
router.post("/areas", verificarToken, crearArea);
router.patch("/areas/orden", verificarToken, reordenarAreas);
router.put("/areas/:id", verificarToken, actualizarArea);
router.delete("/areas/:id", verificarToken, eliminarArea);

// Personas.
router.get("/", verificarToken, listarEquipo);
router.post("/", verificarToken, upload.single("foto"), crearMiembro);
router.patch("/orden", verificarToken, reordenarEquipo);
router.put("/:id", verificarToken, upload.single("foto"), actualizarMiembro);
router.delete("/:id", verificarToken, eliminarMiembro);

export default router;
