"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerTrabajadorTalana = obtenerTrabajadorTalana;
exports.listarTrabajadoresTalana = listarTrabajadoresTalana;
const axios_1 = __importDefault(require("axios"));
const talana_empresas_1 = require("../../constants/talana.empresas");
const talana_personas_service_1 = require("../../services/talana/talana.personas.service");
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
            message: "Error consultando el trabajador en Talana",
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
            : "Error desconocido consultando Talana",
    });
}
async function obtenerTrabajadorTalana(req, res) {
    const rut = obtenerQueryString(req.query.rut);
    const empresaQuery = obtenerQueryString(req.query.empresa) ||
        String(talana_empresas_1.EMPRESAS_TALANA.GRUPO_COLCHAGUA);
    if (!rut) {
        res.status(400).json({
            success: false,
            message: "Debes enviar el RUT del trabajador",
            ejemplos: [
                "/api/talana/trabajador?rut=21437577-8",
                "/api/talana/trabajador?rut=21437577-8&empresa=1408",
                "/api/talana/trabajador?rut=21437577-8&empresa=1570",
                "/api/talana/trabajador?rut=21437577-8&empresa=ambas",
            ],
        });
        return;
    }
    try {
        if (empresaQuery.toLowerCase() ===
            "ambas") {
            const resultados = await (0, talana_personas_service_1.buscarTrabajadorTalanaEnAmbasEmpresas)(rut);
            const coincidencias = resultados
                .filter((resultado) => resultado.persona !== null)
                .map((resultado) => ({
                empresaId: resultado.diagnostico.empresaId,
                persona: resultado.persona,
            }));
            if (coincidencias.length === 0) {
                res.status(404).json({
                    success: false,
                    message: "Trabajador no encontrado en ninguna empresa de Talana",
                    rut,
                    diagnosticos: resultados.map((resultado) => resultado.diagnostico),
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: "Trabajador encontrado en Talana",
                coincidencias,
            });
            return;
        }
        const empresaId = Number(empresaQuery);
        if (!Number.isInteger(empresaId) ||
            !talana_empresas_1.EMPRESAS_TALANA_PERMITIDAS.includes(empresaId)) {
            res.status(400).json({
                success: false,
                message: "La empresa indicada no es válida",
                empresasPermitidas: {
                    grupoColchagua: talana_empresas_1.EMPRESAS_TALANA.GRUPO_COLCHAGUA,
                    grupoSantaCruz: talana_empresas_1.EMPRESAS_TALANA.GRUPO_SANTA_CRUZ,
                    ambas: "ambas",
                },
            });
            return;
        }
        const resultado = await (0, talana_personas_service_1.buscarTrabajadorTalanaPorRut)(rut, empresaId);
        if (!resultado.persona) {
            res.status(404).json({
                success: false,
                message: "Trabajador no encontrado en Talana",
                rut,
                empresaId,
                diagnostico: resultado.diagnostico,
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Trabajador encontrado en Talana",
            empresaId,
            data: resultado.persona,
            diagnostico: resultado.diagnostico,
        });
    }
    catch (error) {
        responderErrorTalana(res, error);
    }
}
async function listarTrabajadoresTalana(req, res) {
    const empresaId = Number(obtenerQueryString(req.query.empresa) ||
        talana_empresas_1.EMPRESAS_TALANA.GRUPO_COLCHAGUA);
    const page = Number(obtenerQueryString(req.query.page) || 1);
    const pageSize = Number(obtenerQueryString(req.query.page_size) || 25);
    if (!Number.isInteger(empresaId) ||
        !talana_empresas_1.EMPRESAS_TALANA_PERMITIDAS.includes(empresaId)) {
        res.status(400).json({
            success: false,
            message: "La empresa indicada no es válida",
            empresasPermitidas: talana_empresas_1.EMPRESAS_TALANA_PERMITIDAS,
        });
        return;
    }
    if (!Number.isInteger(page) || page < 1) {
        res.status(400).json({
            success: false,
            message: "page debe ser un número entero mayor o igual a 1",
        });
        return;
    }
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 200) {
        res.status(400).json({
            success: false,
            message: "page_size debe ser un número entero entre 1 y 200",
        });
        return;
    }
    try {
        const resultado = await (0, talana_personas_service_1.listarPersonasTalana)(empresaId, page, pageSize);
        res.status(200).json({
            success: true,
            message: "Trabajadores obtenidos correctamente",
            empresaId,
            data: resultado,
        });
    }
    catch (error) {
        responderErrorTalana(res, error);
    }
}
