"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerTrabajadoresConMarcaciones = obtenerTrabajadoresConMarcaciones;
const axios_1 = __importDefault(require("axios"));
const talana_empresas_1 = require("../../constants/talana.empresas");
const talana_marcas_service_1 = require("../../services/talana/talana.marcas.service");
const talana_validators_1 = require("../../utils/talana/talana.validators");
function obtenerQueryString(valor) {
    return typeof valor === "string"
        ? valor.trim()
        : "";
}
function responderErrorTalana(res, error) {
    if (axios_1.default.isAxiosError(error)) {
        const data = error.response?.data;
        res.status(error.response?.status ?? 500).json({
            success: false,
            message: "Error obteniendo las marcaciones de Talana",
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
            : "Error desconocido obteniendo marcaciones",
    });
}
async function obtenerTrabajadoresConMarcaciones(req, res) {
    const desde = obtenerQueryString(req.query.desde);
    const hasta = obtenerQueryString(req.query.hasta);
    const empresaId = Number(obtenerQueryString(req.query.empresa) ||
        talana_empresas_1.EMPRESAS_TALANA.GRUPO_COLCHAGUA);
    if (!(0, talana_validators_1.esFechaIsoValida)(desde) ||
        !(0, talana_validators_1.esFechaIsoValida)(hasta)) {
        res.status(400).json({
            success: false,
            message: "Debes enviar desde y hasta en formato YYYY-MM-DD",
            ejemplo: "/api/talana/trabajadores-con-marcaciones" +
                "?desde=2026-07-20" +
                "&hasta=2026-07-21" +
                "&empresa=1408",
        });
        return;
    }
    if ((0, talana_validators_1.convertirFechaIsoUtc)(desde).getTime() >
        (0, talana_validators_1.convertirFechaIsoUtc)(hasta).getTime()) {
        res.status(400).json({
            success: false,
            message: "La fecha desde no puede ser posterior a la fecha hasta",
        });
        return;
    }
    const diasConsultados = (0, talana_validators_1.calcularDiasEntreFechas)(desde, hasta);
    if (diasConsultados > 31) {
        res.status(400).json({
            success: false,
            message: "El período máximo permitido es de 31 días",
            diasConsultados,
        });
        return;
    }
    if (!Number.isInteger(empresaId) ||
        !talana_empresas_1.EMPRESAS_TALANA_PERMITIDAS.includes(empresaId)) {
        res.status(400).json({
            success: false,
            message: "La empresa Talana no es válida",
            empresasPermitidas: talana_empresas_1.EMPRESAS_TALANA_PERMITIDAS,
        });
        return;
    }
    try {
        const resultado = await (0, talana_marcas_service_1.listarTrabajadoresQueMarcanTalana)(desde, hasta, empresaId);
        res.status(200).json({
            success: true,
            message: "Trabajadores con marcaciones obtenidos correctamente",
            data: resultado,
        });
    }
    catch (error) {
        responderErrorTalana(res, error);
    }
}
