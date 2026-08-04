// src/routes/oportunidad.routes.ts
import { Router } from "express";
import {
  actualizarEstadoOportunidad,
  actualizarDocumentoRequerido,
  actualizarEtapaContratados,
  actualizarEtapaDocumentacion,
  actualizarEtapaEntrevista,
  actualizarEtapaNuevos,
  actualizarEtapaPreseleccion,
  actualizarFuenteExterna,
  actualizarOportunidad,
  crearDocumentoRequerido,
  crearFuenteExterna,
  crearOportunidad,
  eliminarDocumentoRequerido,
  eliminarFuenteExterna,
  listarOportunidades,
  marcarOportunidadPerdida,
  obtenerOportunidad,
  obtenerEtapaContratados,
  obtenerEtapaDocumentacion,
  postergarOportunidad,
} from "../controllers/oportunidad.controller";
import { verificarToken } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", verificarToken, listarOportunidades);
router.post("/", verificarToken, crearOportunidad);
router.get("/:id", verificarToken, obtenerOportunidad);
router.patch("/:id", verificarToken, actualizarOportunidad);
router.patch("/:id/estado", verificarToken, actualizarEstadoOportunidad);
router.post("/:id/marcar-perdida", verificarToken, marcarOportunidadPerdida);
router.post("/:id/postergar", verificarToken, postergarOportunidad);
router.patch("/:id/etapa-nuevos", verificarToken, actualizarEtapaNuevos);
router.patch("/:id/etapa-preseleccion", verificarToken, actualizarEtapaPreseleccion);
router.patch("/:id/etapa-entrevista", verificarToken, actualizarEtapaEntrevista);
router.get("/:id/etapa-documentacion", verificarToken, obtenerEtapaDocumentacion);
router.patch("/:id/etapa-documentacion", verificarToken, actualizarEtapaDocumentacion);
router.get("/:id/etapa-contratados", verificarToken, obtenerEtapaContratados);
router.patch("/:id/etapa-contratados", verificarToken, actualizarEtapaContratados);
router.post("/:id/documentos-requeridos", verificarToken, crearDocumentoRequerido);
router.patch("/:id/documentos-requeridos/:documentoId", verificarToken, actualizarDocumentoRequerido);
router.delete("/:id/documentos-requeridos/:documentoId", verificarToken, eliminarDocumentoRequerido);
router.post("/:id/fuentes-externas", verificarToken, crearFuenteExterna);
router.patch("/:id/fuentes-externas/:fuenteId", verificarToken, actualizarFuenteExterna);
router.delete("/:id/fuentes-externas/:fuenteId", verificarToken, eliminarFuenteExterna);

export default router;
