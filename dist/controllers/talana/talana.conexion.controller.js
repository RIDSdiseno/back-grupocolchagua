"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConexionTalana = testConexionTalana;
const axios_1 = __importDefault(require("axios"));
const talana_marcas_service_1 = require("../../services/talana/talana.marcas.service");
function responderErrorTalana(res, error) {
    if (axios_1.default.isAxiosError(error)) {
        const data = error.response?.data;
        res.status(error.response?.status ?? 500).json({
            success: false,
            message: "Error conectando con Talana",
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
            : "Error desconocido conectando con Talana",
    });
}
async function testConexionTalana(_req, res) {
    try {
        const resultado = await (0, talana_marcas_service_1.probarConexionTalana)();
        res.status(200).json({
            success: true,
            message: "Conexión con Talana exitosa",
            data: resultado,
        });
    }
    catch (error) {
        responderErrorTalana(res, error);
    }
}
