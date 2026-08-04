"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizarRut = normalizarRut;
exports.formatearRutParaTalana = formatearRutParaTalana;
function normalizarRut(rut) {
    return rut
        .trim()
        .replace(/\./g, "")
        .replace(/-/g, "")
        .replace(/\s/g, "")
        .toUpperCase();
}
function formatearRutParaTalana(rut) {
    const rutNormalizado = normalizarRut(rut);
    if (rutNormalizado.length < 2) {
        throw new Error("El RUT ingresado no es válido");
    }
    const cuerpo = rutNormalizado.slice(0, -1);
    const digitoVerificador = rutNormalizado.slice(-1);
    return `${cuerpo}-${digitoVerificador}`;
}
