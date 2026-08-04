// src/routes/oportunidadComercial.routes.ts
import { Router } from "express";
import {
  actualizarEtapaContactado,
  actualizarEtapaNegociacion,
  actualizarEtapaOportunidadComercial,
  actualizarEtapaPropuesta,
  actualizarEtapaProspecto,
  actualizarOportunidadComercial,
  confirmarCierreGanada,
  crearOportunidadComercial,
  listarOportunidadesComerciales,
  marcarOportunidadPerdida,
  obtenerCierreGanada,
  obtenerEtapaContactado,
  obtenerEtapaNegociacion,
  obtenerEtapaPropuesta,
  obtenerEtapaProspecto,
  obtenerOportunidadComercial,
  postergarOportunidadComercial,
} from "../controllers/oportunidadComercial.controller";
import { verificarToken } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", verificarToken, listarOportunidadesComerciales);
router.post("/", verificarToken, crearOportunidadComercial);
router.get("/:id", verificarToken, obtenerOportunidadComercial);
router.patch("/:id", verificarToken, actualizarOportunidadComercial);
router.patch("/:id/etapa", verificarToken, actualizarEtapaOportunidadComercial);
router.get("/:id/etapa-prospecto", verificarToken, obtenerEtapaProspecto);
router.patch("/:id/etapa-prospecto", verificarToken, actualizarEtapaProspecto);
router.get("/:id/etapa-contactado", verificarToken, obtenerEtapaContactado);
router.patch("/:id/etapa-contactado", verificarToken, actualizarEtapaContactado);
router.get("/:id/etapa-propuesta", verificarToken, obtenerEtapaPropuesta);
router.patch("/:id/etapa-propuesta", verificarToken, actualizarEtapaPropuesta);
router.get("/:id/etapa-negociacion", verificarToken, obtenerEtapaNegociacion);
router.patch("/:id/etapa-negociacion", verificarToken, actualizarEtapaNegociacion);
router.get("/:id/cierre-ganada", verificarToken, obtenerCierreGanada);
router.post("/:id/cerrar-ganada", verificarToken, confirmarCierreGanada);
router.post("/:id/marcar-perdida", verificarToken, marcarOportunidadPerdida);
router.post("/:id/postergar", verificarToken, postergarOportunidadComercial);

export default router;
