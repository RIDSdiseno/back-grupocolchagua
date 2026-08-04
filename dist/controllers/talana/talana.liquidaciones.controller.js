"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listarLiquidaciones = listarLiquidaciones;
exports.obtenerLiquidacion = obtenerLiquidacion;
exports.listarComprobantesLiquidaciones = listarComprobantesLiquidaciones;
exports.obtenerComprobanteLiquidacion = obtenerComprobanteLiquidacion;
exports.listarLiquidacionesVistaAncha = listarLiquidacionesVistaAncha;
const axios_1 = __importDefault(require("axios"));
const talana_liquidaciones_service_1 = require("../../services/talana/talana.liquidaciones.service");
const talana_liquidaciones_types_1 = require("../../types/talana/talana.liquidaciones.types");
/**
 * Convierte parámetros de Express a un string seguro.
 *
 * Soporta:
 * - string
 * - string[]
 * - undefined
 * - objetos ParsedQs
 */
function obtenerQueryString(valor) {
    if (typeof valor === "string") {
        return valor.trim();
    }
    if (Array.isArray(valor)) {
        for (const item of valor) {
            const texto = obtenerQueryString(item);
            if (texto) {
                return texto;
            }
        }
    }
    return "";
}
/**
 * Convierte un parámetro opcional a número.
 */
function obtenerNumeroOpcional(valor) {
    const texto = obtenerQueryString(valor);
    if (!texto) {
        return undefined;
    }
    const numero = Number(texto);
    if (!Number.isFinite(numero)) {
        return undefined;
    }
    return numero;
}
/**
 * Normaliza el nombre del tipo de liquidación.
 */
function normalizarTipoLiquidacion(valor) {
    if (!valor) {
        return undefined;
    }
    const textoNormalizado = valor
        .trim()
        .toLowerCase();
    const normalizado = textoNormalizado === "historica"
        ? "histórica"
        : textoNormalizado;
    return talana_liquidaciones_types_1.TIPOS_LIQUIDACION_TALANA.find((tipo) => tipo === normalizado);
}
/**
 * Valida que el mes esté entre 1 y 12.
 */
function validarMes(mes) {
    return (mes === undefined ||
        (Number.isInteger(mes) &&
            mes >= 1 &&
            mes <= 12));
}
/**
 * Valida un año razonable.
 */
function validarAno(ano) {
    return (ano === undefined ||
        (Number.isInteger(ano) &&
            ano >= 2000 &&
            ano <= 2100));
}
/**
 * Respuesta común para errores provenientes de Talana.
 */
function responderErrorTalana(res, error, mensaje) {
    if (axios_1.default.isAxiosError(error)) {
        const data = error.response?.data;
        res
            .status(error.response?.status ?? 500)
            .json({
            success: false,
            message: mensaje,
            talanaStatus: error.response?.status ?? null,
            talanaError: typeof data === "string"
                ? data.slice(0, 1500)
                : data ?? error.message,
        });
        return;
    }
    res.status(500).json({
        success: false,
        message: error instanceof Error
            ? error.message
            : mensaje,
    });
}
/**
 * Obtiene y normaliza los filtros comunes para:
 *
 * - GET /liquidaciones
 * - GET /liquidaciones/comprobantes
 */
function obtenerFiltrosListado(req) {
    const tipoTexto = obtenerQueryString(req.query.tipoLiquidacion);
    return {
        empleado: obtenerNumeroOpcional(req.query.empleado),
        tipoLiquidacion: normalizarTipoLiquidacion(tipoTexto),
        periodo: obtenerQueryString(req.query.periodo) || undefined,
        codigoDeProceso: obtenerQueryString(req.query.codigoDeProceso) || undefined,
        periodoMes: obtenerNumeroOpcional(req.query.periodo__mes),
        periodoAno: obtenerNumeroOpcional(req.query.periodo__ano),
        cursor: obtenerQueryString(req.query.cursor) || undefined,
        pageSize: obtenerNumeroOpcional(req.query.page_size) ?? 50,
        rut: obtenerQueryString(req.query.rut) || undefined,
        tipoTexto,
    };
}
/**
 * Valida los filtros de listado antes de consultar Talana.
 */
function validarFiltrosListado(res, filtros) {
    if (filtros.tipoTexto &&
        !filtros.tipoLiquidacion) {
        res.status(400).json({
            success: false,
            message: "El tipo de liquidación no es válido",
            tiposPermitidos: talana_liquidaciones_types_1.TIPOS_LIQUIDACION_TALANA,
        });
        return false;
    }
    if (!validarMes(filtros.periodoMes)) {
        res.status(400).json({
            success: false,
            message: "periodo__mes debe ser un número entero entre 1 y 12",
        });
        return false;
    }
    if (!validarAno(filtros.periodoAno)) {
        res.status(400).json({
            success: false,
            message: "periodo__ano debe ser un año válido entre 2000 y 2100",
        });
        return false;
    }
    if (filtros.empleado !== undefined &&
        (!Number.isInteger(filtros.empleado) ||
            filtros.empleado <= 0)) {
        res.status(400).json({
            success: false,
            message: "empleado debe ser un ID entero mayor que cero",
        });
        return false;
    }
    if (filtros.pageSize === undefined ||
        !Number.isInteger(filtros.pageSize) ||
        filtros.pageSize < 1 ||
        filtros.pageSize > 500) {
        res.status(400).json({
            success: false,
            message: "page_size debe ser un número entero entre 1 y 500",
        });
        return false;
    }
    const tieneRutOEmpleado = Boolean(filtros.rut) ||
        filtros.empleado !== undefined;
    const tienePeriodo = Boolean(filtros.periodo) ||
        (filtros.periodoAno !== undefined &&
            filtros.periodoMes !== undefined);
    const tieneCursor = Boolean(filtros.cursor);
    if (!tieneRutOEmpleado &&
        !tienePeriodo &&
        !tieneCursor) {
        res.status(400).json({
            success: false,
            message: "Por seguridad debes filtrar por RUT, empleado, periodo o mes y año",
            ejemplo: "/api/talana/liquidaciones" +
                "?rut=12345678-9" +
                "&periodo__ano=2026" +
                "&periodo__mes=6",
        });
        return false;
    }
    return true;
}
/**
 * GET /api/talana/liquidaciones
 */
async function listarLiquidaciones(req, res) {
    const filtros = obtenerFiltrosListado(req);
    if (!validarFiltrosListado(res, filtros)) {
        return;
    }
    try {
        const data = await (0, talana_liquidaciones_service_1.listarLiquidacionesTalana)({
            empleado: filtros.empleado,
            tipoLiquidacion: filtros.tipoLiquidacion,
            periodo: filtros.periodo,
            codigoDeProceso: filtros.codigoDeProceso,
            periodoMes: filtros.periodoMes,
            periodoAno: filtros.periodoAno,
            cursor: filtros.cursor,
            pageSize: filtros.pageSize,
            rut: filtros.rut,
        });
        res.status(200).json({
            success: true,
            message: "Liquidaciones obtenidas correctamente",
            data,
        });
    }
    catch (error) {
        responderErrorTalana(res, error, "Error obteniendo las liquidaciones desde Talana");
    }
}
/**
 * GET /api/talana/liquidaciones/:id
 */
async function obtenerLiquidacion(req, res) {
    const id = obtenerQueryString(req.params.id);
    if (!id) {
        res.status(400).json({
            success: false,
            message: "Debes indicar el ID de la liquidación",
        });
        return;
    }
    try {
        const data = await (0, talana_liquidaciones_service_1.obtenerLiquidacionTalana)(id);
        res.status(200).json({
            success: true,
            message: "Liquidación obtenida correctamente",
            data,
        });
    }
    catch (error) {
        responderErrorTalana(res, error, "Error obteniendo el detalle de la liquidación");
    }
}
/**
 * GET /api/talana/liquidaciones/comprobantes
 */
async function listarComprobantesLiquidaciones(req, res) {
    const filtros = obtenerFiltrosListado(req);
    if (!validarFiltrosListado(res, filtros)) {
        return;
    }
    try {
        const data = await (0, talana_liquidaciones_service_1.listarComprobantesLiquidacionesTalana)({
            empleado: filtros.empleado,
            tipoLiquidacion: filtros.tipoLiquidacion,
            periodo: filtros.periodo,
            codigoDeProceso: filtros.codigoDeProceso,
            periodoMes: filtros.periodoMes,
            periodoAno: filtros.periodoAno,
            cursor: filtros.cursor,
            pageSize: filtros.pageSize,
            rut: filtros.rut,
        });
        res.status(200).json({
            success: true,
            message: "Comprobantes obtenidos correctamente",
            data,
        });
    }
    catch (error) {
        responderErrorTalana(res, error, "Error obteniendo los comprobantes desde Talana");
    }
}
/**
 * GET /api/talana/liquidaciones/:id/comprobante
 */
async function obtenerComprobanteLiquidacion(req, res) {
    const id = obtenerQueryString(req.params.id);
    if (!id) {
        res.status(400).json({
            success: false,
            message: "Debes indicar el ID de la liquidación",
        });
        return;
    }
    try {
        const data = await (0, talana_liquidaciones_service_1.obtenerComprobanteLiquidacionTalana)(id);
        res.status(200).json({
            success: true,
            message: "Comprobante obtenido correctamente",
            data,
        });
    }
    catch (error) {
        responderErrorTalana(res, error, "Error obteniendo el comprobante de la liquidación");
    }
}
/**
 * GET /api/talana/liquidaciones/vista-ancha
 */
async function listarLiquidacionesVistaAncha(req, res) {
    const ano = obtenerNumeroOpcional(req.query.ano);
    const mes = obtenerNumeroOpcional(req.query.mes);
    const centroCosto = obtenerNumeroOpcional(req.query.centro_costo);
    const personaId = obtenerNumeroOpcional(req.query.persona_id);
    const rut = obtenerQueryString(req.query.rut) || undefined;
    const tipoTexto = obtenerQueryString(req.query.tipo_liquidacion);
    const tipoLiquidacion = normalizarTipoLiquidacion(tipoTexto);
    if (tipoTexto &&
        !tipoLiquidacion) {
        res.status(400).json({
            success: false,
            message: "El tipo de liquidación no es válido",
            tiposPermitidos: talana_liquidaciones_types_1.TIPOS_LIQUIDACION_TALANA,
        });
        return;
    }
    if (!validarMes(mes)) {
        res.status(400).json({
            success: false,
            message: "mes debe ser un número entero entre 1 y 12",
        });
        return;
    }
    if (!validarAno(ano)) {
        res.status(400).json({
            success: false,
            message: "ano debe ser un año válido entre 2000 y 2100",
        });
        return;
    }
    if (personaId !== undefined &&
        (!Number.isInteger(personaId) ||
            personaId <= 0)) {
        res.status(400).json({
            success: false,
            message: "persona_id debe ser un ID entero mayor que cero",
        });
        return;
    }
    if (centroCosto !== undefined &&
        (!Number.isInteger(centroCosto) ||
            centroCosto <= 0)) {
        res.status(400).json({
            success: false,
            message: "centro_costo debe ser un ID entero mayor que cero",
        });
        return;
    }
    const tieneTrabajador = Boolean(rut) ||
        personaId !== undefined;
    const tienePeriodo = ano !== undefined &&
        mes !== undefined;
    if (!tieneTrabajador &&
        !tienePeriodo) {
        res.status(400).json({
            success: false,
            message: "Debes indicar un RUT, persona_id o un mes y año",
            ejemplo: "/api/talana/liquidaciones/vista-ancha" +
                "?rut=12345678-9" +
                "&ano=2026" +
                "&mes=6",
        });
        return;
    }
    try {
        const data = await (0, talana_liquidaciones_service_1.listarLiquidacionesVistaAnchaTalana)({
            ano,
            mes,
            centroCosto,
            rut,
            personaId,
            tipoLiquidacion,
        });
        res.status(200).json({
            success: true,
            message: "Vista ancha de liquidaciones obtenida correctamente",
            data,
        });
    }
    catch (error) {
        responderErrorTalana(res, error, "Error obteniendo la vista ancha de liquidaciones");
    }
}
