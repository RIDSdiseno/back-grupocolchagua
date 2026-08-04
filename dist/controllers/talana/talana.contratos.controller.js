"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerMuestraContrato = obtenerMuestraContrato;
const axios_1 = __importDefault(require("axios"));
const talana_empresas_1 = require("../../constants/talana.empresas");
const talana_contratos_service_1 = require("../../services/talana/talana.contratos.service");
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
            message: "Error obteniendo el contrato desde Talana",
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
            : "Error desconocido obteniendo el contrato",
    });
}
async function obtenerMuestraContrato(req, res) {
    const empresaId = Number(obtenerQueryString(req.query.empresa) ||
        talana_empresas_1.EMPRESAS_TALANA.GRUPO_COLCHAGUA);
    const fecha = obtenerQueryString(req.query.fecha);
    if (!Number.isInteger(empresaId) ||
        !talana_empresas_1.EMPRESAS_TALANA_PERMITIDAS.includes(empresaId)) {
        res.status(400).json({
            success: false,
            message: "La empresa Talana no es válida",
            empresasPermitidas: talana_empresas_1.EMPRESAS_TALANA_PERMITIDAS,
        });
        return;
    }
    if (fecha &&
        !(0, talana_validators_1.esFechaCompactaValida)(fecha)) {
        res.status(400).json({
            success: false,
            message: "La fecha debe tener el formato YYYYMMDD",
            ejemplo: "20260721",
        });
        return;
    }
    try {
        const resultado = await (0, talana_contratos_service_1.obtenerMuestraContratoTalana)(empresaId, fecha || undefined);
        if (!resultado.contratoEncontrado) {
            res.status(404).json({
                success: false,
                message: "No se encontraron contratos activos",
                data: resultado,
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Contrato activo obtenido correctamente",
            data: resultado,
        });
    }
    catch (error) {
        responderErrorTalana(res, error);
    }
}
