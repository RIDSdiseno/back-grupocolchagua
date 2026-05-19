"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resumenAsistencia = exports.eliminarAsistencia = exports.actualizarAsistencia = exports.registrarAsistenciaMasiva = exports.registrarAsistencia = exports.listarAsistencia = void 0;
const prisma_1 = require("../lib/prisma");
const include = {
    Trabajador: { select: { id: true, nombre: true, apellido: true, rut: true } },
    Cargo: { select: { id: true, nombre: true } },
    Empresa: { select: { id: true, nombre: true } },
    Sucursal: { select: { id: true, nombre: true } },
};
function normalizarFecha(fechaStr) {
    const d = new Date(fechaStr);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}
function esDomingo(fecha) {
    return fecha.getUTCDay() === 0;
}
function validarEstado(estado) {
    const valor = String(estado || "").trim().toUpperCase();
    if (valor === "A" || valor === "L" || valor === "F") {
        return valor;
    }
    return "A";
}
function validarTurno(turno) {
    const valor = String(turno || "").trim().toLowerCase();
    if (valor === "diurno" || valor === "nocturno") {
        return valor;
    }
    return "diurno";
}
function estadoPorFecha(fecha, estado) {
    if (esDomingo(fecha)) {
        return "L";
    }
    return validarEstado(estado);
}
function numeroONull(valor) {
    if (valor === undefined || valor === null || valor === "") {
        return null;
    }
    const numero = Number(valor);
    return Number.isNaN(numero) ? null : numero;
}
function textoONull(valor) {
    if (valor === undefined || valor === null) {
        return null;
    }
    const texto = String(valor).trim();
    return texto.length > 0 ? texto : null;
}
function rangoMes(mes, año) {
    const inicio = new Date(Date.UTC(año, mes - 1, 1));
    const fin = new Date(Date.UTC(año, mes, 0, 23, 59, 59, 999));
    return { inicio, fin };
}
const listarAsistencia = async (req, res) => {
    try {
        const { empresaId, sucursalId, mes, año } = req.query;
        if (!empresaId) {
            return res.status(400).json({
                ok: false,
                message: "empresaId es obligatorio",
            });
        }
        const where = {
            empresaId: Number(empresaId),
        };
        if (sucursalId) {
            where.sucursalId = Number(sucursalId);
        }
        if (mes && año) {
            const mesNum = Number(mes);
            const añoNum = Number(año);
            const { inicio, fin } = rangoMes(mesNum, añoNum);
            where.fecha = { gte: inicio, lte: fin };
        }
        const registros = await prisma_1.prisma.asistencia.findMany({
            where,
            include,
            orderBy: [{ fecha: "asc" }, { trabajadorId: "asc" }],
        });
        return res.json({ ok: true, registros });
    }
    catch (error) {
        console.error("ERROR LISTAR ASISTENCIA:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al listar asistencia",
        });
    }
};
exports.listarAsistencia = listarAsistencia;
const registrarAsistencia = async (req, res) => {
    try {
        const { trabajadorId, fecha, estado, horasExtras, turno, cargoId, empresaId, sucursalId, observacion, } = req.body;
        if (!trabajadorId || !fecha || !cargoId || !empresaId) {
            return res.status(400).json({
                ok: false,
                message: "trabajadorId, fecha, cargoId y empresaId son obligatorios",
            });
        }
        const fechaNorm = normalizarFecha(String(fecha));
        const estadoValido = estadoPorFecha(fechaNorm, estado);
        const turnoValido = validarTurno(turno);
        const sucursalIdFinal = numeroONull(sucursalId);
        const registro = await prisma_1.prisma.asistencia.upsert({
            where: {
                trabajadorId_fecha_empresaId: {
                    trabajadorId: Number(trabajadorId),
                    fecha: fechaNorm,
                    empresaId: Number(empresaId),
                },
            },
            create: {
                trabajadorId: Number(trabajadorId),
                fecha: fechaNorm,
                estado: estadoValido,
                horasExtras: esDomingo(fechaNorm) ? 0 : Number(horasExtras) || 0,
                turno: turnoValido,
                cargoId: Number(cargoId),
                empresaId: Number(empresaId),
                sucursalId: sucursalIdFinal,
                observacion: textoONull(observacion),
            },
            update: {
                estado: estadoValido,
                horasExtras: esDomingo(fechaNorm) ? 0 : Number(horasExtras) || 0,
                turno: turnoValido,
                cargoId: Number(cargoId),
                sucursalId: sucursalIdFinal,
                observacion: textoONull(observacion),
            },
            include,
        });
        return res.status(201).json({
            ok: true,
            message: "Asistencia registrada correctamente",
            registro,
        });
    }
    catch (error) {
        console.error("ERROR REGISTRAR ASISTENCIA:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al registrar asistencia",
        });
    }
};
exports.registrarAsistencia = registrarAsistencia;
const registrarAsistenciaMasiva = async (req, res) => {
    try {
        const { registros } = req.body;
        if (!Array.isArray(registros) || registros.length === 0) {
            return res.status(400).json({
                ok: false,
                message: "Debes enviar un arreglo de registros",
            });
        }
        if (registros.length > 500) {
            return res.status(400).json({
                ok: false,
                message: "No puedes registrar más de 500 asistencias a la vez",
            });
        }
        let procesados = 0;
        const errores = [];
        await prisma_1.prisma.$transaction(async (tx) => {
            for (let i = 0; i < registros.length; i++) {
                const r = registros[i];
                if (!r.trabajadorId || !r.fecha || !r.cargoId || !r.empresaId) {
                    errores.push(`Registro ${i + 1}: trabajadorId, fecha, cargoId y empresaId son obligatorios`);
                    continue;
                }
                const fechaNorm = normalizarFecha(String(r.fecha));
                const estadoValido = estadoPorFecha(fechaNorm, r.estado);
                const turnoValido = validarTurno(r.turno);
                const horasExtrasFinal = esDomingo(fechaNorm)
                    ? 0
                    : Number(r.horasExtras) || 0;
                await tx.asistencia.upsert({
                    where: {
                        trabajadorId_fecha_empresaId: {
                            trabajadorId: Number(r.trabajadorId),
                            fecha: fechaNorm,
                            empresaId: Number(r.empresaId),
                        },
                    },
                    create: {
                        trabajadorId: Number(r.trabajadorId),
                        fecha: fechaNorm,
                        estado: estadoValido,
                        horasExtras: horasExtrasFinal,
                        turno: turnoValido,
                        cargoId: Number(r.cargoId),
                        empresaId: Number(r.empresaId),
                        sucursalId: numeroONull(r.sucursalId),
                        observacion: textoONull(r.observacion),
                    },
                    update: {
                        estado: estadoValido,
                        horasExtras: horasExtrasFinal,
                        turno: turnoValido,
                        cargoId: Number(r.cargoId),
                        sucursalId: numeroONull(r.sucursalId),
                        observacion: textoONull(r.observacion),
                    },
                });
                procesados++;
            }
        });
        return res.status(201).json({
            ok: true,
            message: "Asistencias registradas correctamente",
            procesados,
            errores,
        });
    }
    catch (error) {
        console.error("ERROR REGISTRAR ASISTENCIA MASIVA:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al registrar asistencia masiva",
        });
    }
};
exports.registrarAsistenciaMasiva = registrarAsistenciaMasiva;
const actualizarAsistencia = async (req, res) => {
    try {
        const asistenciaId = Number(req.params.id);
        if (Number.isNaN(asistenciaId)) {
            return res.status(400).json({
                ok: false,
                message: "ID de asistencia inválido",
            });
        }
        const existente = await prisma_1.prisma.asistencia.findUnique({
            where: { id: asistenciaId },
        });
        if (!existente) {
            return res.status(404).json({
                ok: false,
                message: "Registro de asistencia no encontrado",
            });
        }
        const { estado, horasExtras, turno, observacion } = req.body;
        const estadoFinal = estado !== undefined ? validarEstado(estado) : existente.estado;
        const turnoFinal = turno !== undefined ? validarTurno(turno) : existente.turno;
        const horasExtrasFinal = horasExtras !== undefined ? Number(horasExtras) || 0 : existente.horasExtras;
        const registro = await prisma_1.prisma.asistencia.update({
            where: { id: asistenciaId },
            data: {
                estado: estadoFinal,
                horasExtras: horasExtrasFinal,
                turno: turnoFinal,
                observacion: observacion !== undefined
                    ? textoONull(observacion)
                    : existente.observacion,
            },
            include,
        });
        return res.json({
            ok: true,
            message: "Asistencia actualizada correctamente",
            registro,
        });
    }
    catch (error) {
        console.error("ERROR ACTUALIZAR ASISTENCIA:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al actualizar asistencia",
        });
    }
};
exports.actualizarAsistencia = actualizarAsistencia;
const eliminarAsistencia = async (req, res) => {
    try {
        const asistenciaId = Number(req.params.id);
        if (Number.isNaN(asistenciaId)) {
            return res.status(400).json({
                ok: false,
                message: "ID de asistencia inválido",
            });
        }
        const existente = await prisma_1.prisma.asistencia.findUnique({
            where: { id: asistenciaId },
        });
        if (!existente) {
            return res.status(404).json({
                ok: false,
                message: "Registro de asistencia no encontrado",
            });
        }
        await prisma_1.prisma.asistencia.delete({
            where: { id: asistenciaId },
        });
        return res.json({
            ok: true,
            message: "Registro eliminado correctamente",
        });
    }
    catch (error) {
        console.error("ERROR ELIMINAR ASISTENCIA:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al eliminar asistencia",
        });
    }
};
exports.eliminarAsistencia = eliminarAsistencia;
const resumenAsistencia = async (req, res) => {
    try {
        const { empresaId, sucursalId, mes, año } = req.query;
        if (!empresaId || !mes || !año) {
            return res.status(400).json({
                ok: false,
                message: "empresaId, mes y año son obligatorios",
            });
        }
        const mesNum = Number(mes);
        const añoNum = Number(año);
        const { inicio, fin } = rangoMes(mesNum, añoNum);
        const where = {
            empresaId: Number(empresaId),
            fecha: { gte: inicio, lte: fin },
        };
        if (sucursalId) {
            where.sucursalId = Number(sucursalId);
        }
        const registros = await prisma_1.prisma.asistencia.findMany({
            where,
            include: {
                Trabajador: {
                    select: { id: true, nombre: true, apellido: true, rut: true },
                },
                Cargo: { select: { id: true, nombre: true } },
            },
        });
        const porTrabajador = new Map();
        for (const registro of registros) {
            const key = registro.trabajadorId;
            if (!porTrabajador.has(key)) {
                porTrabajador.set(key, {
                    trabajador: registro.Trabajador,
                    cargo: registro.Cargo,
                    diasAsistio: 0,
                    diasLibre: 0,
                    diasFalta: 0,
                    totalHorasExtras: 0,
                });
            }
            const entry = porTrabajador.get(key);
            if (!entry)
                continue;
            const estado = esDomingo(registro.fecha)
                ? "L"
                : validarEstado(registro.estado);
            if (estado === "A") {
                entry.diasAsistio++;
            }
            if (estado === "L") {
                entry.diasLibre++;
            }
            if (estado === "F") {
                entry.diasFalta++;
            }
            if (!esDomingo(registro.fecha)) {
                entry.totalHorasExtras += Number(registro.horasExtras) || 0;
            }
        }
        return res.json({
            ok: true,
            resumen: Array.from(porTrabajador.values()),
        });
    }
    catch (error) {
        console.error("ERROR RESUMEN ASISTENCIA:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al generar resumen",
        });
    }
};
exports.resumenAsistencia = resumenAsistencia;
