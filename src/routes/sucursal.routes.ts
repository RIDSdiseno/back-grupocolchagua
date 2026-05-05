import { Router } from "express";
import {
  actualizarSucursal,
  crearSucursal,
  eliminarSucursal,
  listarSucursalesPorEmpresa,
  listarTodasSucursales,
} from "../controllers/sucursal.controller";
import { verificarToken } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", verificarToken, listarTodasSucursales);
router.get("/empresa/:empresaId", verificarToken, listarSucursalesPorEmpresa);
router.post("/empresa/:empresaId", verificarToken, crearSucursal);
router.put("/:id", verificarToken, actualizarSucursal);
router.delete("/:id", verificarToken, eliminarSucursal);

export default router;