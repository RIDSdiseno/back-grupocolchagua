"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.limpiarRut = limpiarRut;
exports.formatearRut = formatearRut;
exports.validarRut = validarRut;
function limpiarRut(rut) {
    return String(rut)
        .replace(/\./g, "")
        .replace(/-/g, "")
        .replace(/\s/g, "")
        .toUpperCase();
}
function formatearRut(rut) {
    const limpio = limpiarRut(rut);
    if (limpio.length < 2)
        return rut;
    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1);
    return cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "-" + dv;
}
function validarRut(rut) {
    const limpio = limpiarRut(rut);
    if (!/^[0-9]+[0-9K]$/.test(limpio))
        return false;
    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1);
    let suma = 0;
    let multiplo = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += Number(cuerpo[i]) * multiplo;
        multiplo = multiplo < 7 ? multiplo + 1 : 2;
    }
    const dvEsperadoNum = 11 - (suma % 11);
    const dvEsperado = dvEsperadoNum === 11
        ? "0"
        : dvEsperadoNum === 10
            ? "K"
            : String(dvEsperadoNum);
    return dv === dvEsperado;
}
