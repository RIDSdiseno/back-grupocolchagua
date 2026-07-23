import { Router } from "express";

import { verificarToken } from "../middlewares/auth.middleware";

import { testConexionTalana } from "../controllers/talana/talana.conexion.controller";

import {
  listarTrabajadoresTalana,
  obtenerTrabajadorTalana,
} from "../controllers/talana/talana.personas.controller";

import { obtenerTrabajadoresConMarcaciones } from "../controllers/talana/talana.marcas.controller";

import { obtenerMuestraContrato } from "../controllers/talana/talana.contratos.controller";

import {
  listarComprobantesLiquidaciones,
  listarLiquidaciones,
  listarLiquidacionesVistaAncha,
  obtenerComprobanteLiquidacion,
  obtenerLiquidacion,
} from "../controllers/talana/talana.liquidaciones.controller";

const router = Router();

router.use(verificarToken);


router.get(
  "/test",
  testConexionTalana,
);


router.get(
  "/trabajador",
  obtenerTrabajadorTalana,
);


router.get(
  "/personas",
  listarTrabajadoresTalana,
);


router.get(
  "/trabajadores-con-marcaciones",
  obtenerTrabajadoresConMarcaciones,
);


router.get(
  "/contratos/muestra",
  obtenerMuestraContrato,
);


router.get(
  "/liquidaciones/vista-ancha",
  listarLiquidacionesVistaAncha,
);


router.get(
  "/liquidaciones/comprobantes",
  listarComprobantesLiquidaciones,
);


router.get(
  "/liquidaciones",
  listarLiquidaciones,
);


router.get(
  "/liquidaciones/:id/comprobante",
  obtenerComprobanteLiquidacion,
);


router.get(
  "/liquidaciones/:id",
  obtenerLiquidacion,
);

export default router;