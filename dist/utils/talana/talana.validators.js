"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.esFechaIsoValida = esFechaIsoValida;
exports.esFechaCompactaValida = esFechaCompactaValida;
exports.convertirFechaIsoUtc = convertirFechaIsoUtc;
exports.calcularDiasEntreFechas = calcularDiasEntreFechas;
function esFechaIsoValida(fecha) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return false;
    }
    const [anio, mes, dia] = fecha
        .split("-")
        .map(Number);
    const fechaUtc = new Date(Date.UTC(anio, mes - 1, dia));
    return (fechaUtc.getUTCFullYear() === anio &&
        fechaUtc.getUTCMonth() === mes - 1 &&
        fechaUtc.getUTCDate() === dia);
}
function esFechaCompactaValida(fecha) {
    if (!/^\d{8}$/.test(fecha)) {
        return false;
    }
    const anio = Number(fecha.slice(0, 4));
    const mes = Number(fecha.slice(4, 6));
    const dia = Number(fecha.slice(6, 8));
    const fechaUtc = new Date(Date.UTC(anio, mes - 1, dia));
    return (fechaUtc.getUTCFullYear() === anio &&
        fechaUtc.getUTCMonth() === mes - 1 &&
        fechaUtc.getUTCDate() === dia);
}
function convertirFechaIsoUtc(fecha) {
    return new Date(`${fecha}T00:00:00.000Z`);
}
function calcularDiasEntreFechas(desde, hasta) {
    const fechaDesde = convertirFechaIsoUtc(desde);
    const fechaHasta = convertirFechaIsoUtc(hasta);
    const milisegundosPorDia = 1000 * 60 * 60 * 24;
    return (Math.floor((fechaHasta.getTime() -
        fechaDesde.getTime()) /
        milisegundosPorDia) + 1);
}
