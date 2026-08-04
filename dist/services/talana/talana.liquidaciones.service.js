"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listarLiquidacionesTalana = listarLiquidacionesTalana;
exports.obtenerLiquidacionTalana = obtenerLiquidacionTalana;
exports.listarComprobantesLiquidacionesTalana = listarComprobantesLiquidacionesTalana;
exports.obtenerComprobanteLiquidacionTalana = obtenerComprobanteLiquidacionTalana;
exports.listarLiquidacionesVistaAnchaTalana = listarLiquidacionesVistaAnchaTalana;
const talana_client_1 = require("../../config/talana/talana.client");
const talana_rut_1 = require("../../utils/talana/talana.rut");
function limpiarParametros(parametros) {
    return Object.fromEntries(Object.entries(parametros).filter(([, valor]) => valor !== undefined &&
        valor !== null &&
        valor !== ""));
}
function construirParametrosListado(filtros) {
    return limpiarParametros({
        empleado: filtros.empleado,
        tipoLiquidacion: filtros.tipoLiquidacion,
        periodo: filtros.periodo,
        codigoDeProceso: filtros.codigoDeProceso,
        periodo__mes: filtros.periodoMes,
        periodo__ano: filtros.periodoAno,
        cursor: filtros.cursor,
        page_size: filtros.pageSize,
        rut: filtros.rut
            ? (0, talana_rut_1.formatearRutParaTalana)(filtros.rut)
            : undefined,
    });
}
/**
 * Lista liquidaciones con desglose por ítem de pago.
 */
async function listarLiquidacionesTalana(filtros) {
    const response = await talana_client_1.talanaApi.get("/liquidaciones/", {
        params: construirParametrosListado(filtros),
    });
    return response.data;
}
/**
 * Obtiene el detalle completo de una liquidación.
 */
async function obtenerLiquidacionTalana(liquidacionId) {
    const id = encodeURIComponent(liquidacionId);
    const response = await talana_client_1.talanaApi.get(`/liquidaciones/${id}/`);
    return response.data;
}
/**
 * Lista comprobantes y URL de los PDF.
 */
async function listarComprobantesLiquidacionesTalana(filtros) {
    const response = await talana_client_1.talanaApi.get("/liquidaciones/comprobantes/", {
        params: construirParametrosListado(filtros),
    });
    return response.data;
}
/**
 * Obtiene la URL del PDF correspondiente
 * a una liquidación concreta.
 */
async function obtenerComprobanteLiquidacionTalana(liquidacionId) {
    const id = encodeURIComponent(liquidacionId);
    const response = await talana_client_1.talanaApi.get(`/liquidaciones/comprobantes/${id}/`);
    return response.data;
}
/**
 * Vista ancha para reportería, BI y cruces
 * entre trabajador, contrato y liquidación.
 */
async function listarLiquidacionesVistaAnchaTalana(filtros) {
    const params = limpiarParametros({
        ano: filtros.ano,
        mes: filtros.mes,
        centro_costo: filtros.centroCosto,
        rut: filtros.rut
            ? (0, talana_rut_1.formatearRutParaTalana)(filtros.rut)
            : undefined,
        persona_id: filtros.personaId,
        tipo_liquidacion: filtros.tipoLiquidacion,
    });
    const response = await talana_client_1.talanaApi.get("/payslips-wide-view", {
        params,
    });
    return response.data;
}
