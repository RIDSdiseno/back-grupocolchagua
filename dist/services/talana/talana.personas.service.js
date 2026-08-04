"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buscarTrabajadorTalanaPorRut = buscarTrabajadorTalanaPorRut;
exports.listarPersonasTalana = listarPersonasTalana;
exports.buscarTrabajadorTalanaEnAmbasEmpresas = buscarTrabajadorTalanaEnAmbasEmpresas;
const talana_client_1 = require("../../config/talana/talana.client");
const talana_empresas_1 = require("../../constants/talana.empresas");
const talana_rut_1 = require("../../utils/talana/talana.rut");
async function buscarTrabajadorTalanaPorRut(rut, empresaId) {
    (0, talana_empresas_1.validarEmpresaTalana)(empresaId);
    const rutNormalizado = (0, talana_rut_1.normalizarRut)(rut);
    const rutConsultado = (0, talana_rut_1.formatearRutParaTalana)(rut);
    const response = await talana_client_1.talanaApi.get("/personas-paginadas/", {
        params: {
            empresa: empresaId,
            rut: rutConsultado,
            page: 1,
            page_size: 100,
        },
    });
    const resultados = Array.isArray(response.data.results)
        ? response.data.results
        : [];
    const persona = resultados.find((item) => {
        if (!item.rut) {
            return false;
        }
        return ((0, talana_rut_1.normalizarRut)(String(item.rut)) ===
            rutNormalizado);
    }) ?? null;
    return {
        persona,
        diagnostico: {
            empresaId,
            rutOriginal: rut,
            rutConsultado,
            totalTalana: Number(response.data.count ?? resultados.length),
            resultadosRecibidos: resultados.length,
            rutsDevueltos: resultados
                .slice(0, 10)
                .map((item) => String(item.rut ?? "")),
        },
    };
}
async function listarPersonasTalana(empresaId, page, pageSize) {
    (0, talana_empresas_1.validarEmpresaTalana)(empresaId);
    const response = await talana_client_1.talanaApi.get("/personas-paginadas/", {
        params: {
            empresa: empresaId,
            page,
            page_size: pageSize,
        },
    });
    return response.data;
}
async function buscarTrabajadorTalanaEnAmbasEmpresas(rut) {
    const empresas = [
        talana_empresas_1.EMPRESAS_TALANA.GRUPO_COLCHAGUA,
        talana_empresas_1.EMPRESAS_TALANA.GRUPO_SANTA_CRUZ,
    ];
    const resultados = [];
    for (const empresaId of empresas) {
        const resultado = await buscarTrabajadorTalanaPorRut(rut, empresaId);
        resultados.push(resultado);
    }
    return resultados;
}
