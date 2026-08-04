"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMPRESAS_TALANA_PERMITIDAS = exports.EMPRESAS_TALANA = exports.TALANA_EMPRESA_SANTA_CRUZ_ID = exports.TALANA_EMPRESA_COLCHAGUA_ID = void 0;
exports.validarEmpresaTalana = validarEmpresaTalana;
exports.TALANA_EMPRESA_COLCHAGUA_ID = Number(process.env.TALANA_EMPRESA_COLCHAGUA_ID ?? 1408);
exports.TALANA_EMPRESA_SANTA_CRUZ_ID = Number(process.env.TALANA_EMPRESA_SANTA_CRUZ_ID ?? 1570);
exports.EMPRESAS_TALANA = {
    GRUPO_COLCHAGUA: exports.TALANA_EMPRESA_COLCHAGUA_ID,
    GRUPO_SANTA_CRUZ: exports.TALANA_EMPRESA_SANTA_CRUZ_ID,
};
exports.EMPRESAS_TALANA_PERMITIDAS = [
    exports.EMPRESAS_TALANA.GRUPO_COLCHAGUA,
    exports.EMPRESAS_TALANA.GRUPO_SANTA_CRUZ,
];
function validarEmpresaTalana(empresaId) {
    if (!Number.isInteger(empresaId) ||
        !exports.EMPRESAS_TALANA_PERMITIDAS.includes(empresaId)) {
        throw new Error(`Empresa Talana inválida. Valores permitidos: ${exports.EMPRESAS_TALANA_PERMITIDAS.join(", ")}`);
    }
}
