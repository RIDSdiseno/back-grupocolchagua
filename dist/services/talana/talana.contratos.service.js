"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerMuestraContratoTalana = obtenerMuestraContratoTalana;
const talana_client_1 = require("../../config/talana/talana.client");
const talana_empresas_1 = require("../../constants/talana.empresas");
async function obtenerMuestraContratoTalana(empresaId, activeOn) {
    (0, talana_empresas_1.validarEmpresaTalana)(empresaId);
    const params = {
        empresa: empresaId,
        type_status_search: "actives",
        page: 1,
        page_size: 1,
    };
    if (activeOn) {
        params.active_on = activeOn;
    }
    const response = await talana_client_1.talanaApi.get("/contrato-paginado/", {
        params,
    });
    const resultados = Array.isArray(response.data.results)
        ? response.data.results
        : [];
    return {
        empresaId,
        fechaConsulta: activeOn,
        totalContratos: Number(response.data.count ?? resultados.length),
        contratoEncontrado: resultados.length > 0,
        contrato: resultados[0] ?? null,
    };
}
