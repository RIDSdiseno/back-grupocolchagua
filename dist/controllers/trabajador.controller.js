"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eliminarTrabajador = exports.actualizarTrabajador = exports.crearTrabajador = exports.obtenerTrabajador = exports.listarTrabajadores = void 0;
const prisma_1 = require("../lib/prisma");
const validarRut_1 = require("../utils/validarRut");
const listarTrabajadores = async (req, res) => {
    try {
        const { activo, holdingId, empresaId, sucursalId } = req.query;
        const where = {};
        if (activo !== undefined) {
            where.activo = activo === "true";
        }
        if (holdingId || empresaId || sucursalId) {
            where.Asignacion = {
                some: {
                    ...(empresaId ? { empresaId: Number(empresaId) } : {}),
                    ...(sucursalId ? { sucursalId: Number(sucursalId) } : {}),
                    ...(holdingId
                        ? {
                            Sucursal: {
                                holdingId: Number(holdingId),
                            },
                        }
                        : {}),
                },
            };
        }
        const trabajadores = await prisma_1.prisma.trabajador.findMany({
            where,
            orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
            include: {
                Asignacion: {
                    include: {
                        Empresa: true,
                        Cargo: true,
                        Sucursal: {
                            include: {
                                Holding: true,
                            },
                        },
                    },
                },
            },
        });
        return res.json({ ok: true, trabajadores });
    }
    catch (error) {
        console.error("ERROR LISTAR TRABAJADORES:", error);
        return res.status(500).json({
            ok: false,
            message: error.message || "Error al listar trabajadores",
        });
    }
};
exports.listarTrabajadores = listarTrabajadores;
const obtenerTrabajador = async (req, res) => {
    try {
        const trabajadorId = Number(req.params.id);
        if (Number.isNaN(trabajadorId)) {
            return res
                .status(400)
                .json({ ok: false, message: "ID de trabajador inválido" });
        }
        const trabajador = await prisma_1.prisma.trabajador.findUnique({
            where: { id: trabajadorId },
            include: {
                Asignacion: {
                    include: {
                        Empresa: true,
                        Cargo: true,
                        Sucursal: {
                            include: {
                                Holding: true,
                            },
                        },
                    },
                },
            },
        });
        if (!trabajador) {
            return res
                .status(404)
                .json({ ok: false, message: "Trabajador no encontrado" });
        }
        return res.json({ ok: true, trabajador });
    }
    catch (error) {
        console.error("ERROR OBTENER TRABAJADOR:", error);
        return res
            .status(500)
            .json({ ok: false, message: "Error al obtener trabajador" });
    }
};
exports.obtenerTrabajador = obtenerTrabajador;
const crearTrabajador = async (req, res) => {
    try {
        const { nombre, apellido, rut, telefono, email } = req.body;
        if (!nombre || !String(nombre).trim()) {
            return res
                .status(400)
                .json({ ok: false, message: "El nombre es obligatorio" });
        }
        if (!apellido || !String(apellido).trim()) {
            return res
                .status(400)
                .json({ ok: false, message: "El apellido es obligatorio" });
        }
        if (!rut || !String(rut).trim()) {
            return res
                .status(400)
                .json({ ok: false, message: "El RUT es obligatorio" });
        }
        const rutLimpio = (0, validarRut_1.limpiarRut)(String(rut));
        if (!(0, validarRut_1.validarRut)(rutLimpio)) {
            return res
                .status(400)
                .json({ ok: false, message: "El RUT ingresado no es válido" });
        }
        const rutFormateado = (0, validarRut_1.formatearRut)(rutLimpio);
        const existente = await prisma_1.prisma.trabajador.findUnique({
            where: { rut: rutFormateado },
        });
        if (existente) {
            return res
                .status(400)
                .json({ ok: false, message: "Ya existe un trabajador con este RUT" });
        }
        const trabajador = await prisma_1.prisma.trabajador.create({
            data: {
                nombre: String(nombre).trim(),
                apellido: String(apellido).trim(),
                rut: rutFormateado,
                telefono: telefono ? String(telefono).trim() : null,
                email: email ? String(email).trim().toLowerCase() : null,
            },
        });
        return res.status(201).json({
            ok: true,
            message: "Trabajador creado correctamente",
            trabajador,
        });
    }
    catch (error) {
        console.error("ERROR CREAR TRABAJADOR:", error);
        return res
            .status(500)
            .json({ ok: false, message: "Error al crear trabajador" });
    }
};
exports.crearTrabajador = crearTrabajador;
const actualizarTrabajador = async (req, res) => {
    try {
        const trabajadorId = Number(req.params.id);
        if (Number.isNaN(trabajadorId)) {
            return res
                .status(400)
                .json({ ok: false, message: "ID de trabajador inválido" });
        }
        const { nombre, apellido, rut, telefono, email, activo } = req.body;
        const existente = await prisma_1.prisma.trabajador.findUnique({
            where: { id: trabajadorId },
        });
        if (!existente) {
            return res
                .status(404)
                .json({ ok: false, message: "Trabajador no encontrado" });
        }
        const data = {};
        if (nombre !== undefined) {
            if (!String(nombre).trim()) {
                return res
                    .status(400)
                    .json({ ok: false, message: "El nombre no puede estar vacío" });
            }
            data.nombre = String(nombre).trim();
        }
        if (apellido !== undefined) {
            if (!String(apellido).trim()) {
                return res
                    .status(400)
                    .json({ ok: false, message: "El apellido no puede estar vacío" });
            }
            data.apellido = String(apellido).trim();
        }
        if (rut !== undefined) {
            const rutLimpio = (0, validarRut_1.limpiarRut)(String(rut));
            if (!(0, validarRut_1.validarRut)(rutLimpio)) {
                return res
                    .status(400)
                    .json({ ok: false, message: "El RUT ingresado no es válido" });
            }
            const rutFormateado = (0, validarRut_1.formatearRut)(rutLimpio);
            const duplicado = await prisma_1.prisma.trabajador.findFirst({
                where: { rut: rutFormateado, NOT: { id: trabajadorId } },
            });
            if (duplicado) {
                return res.status(400).json({
                    ok: false,
                    message: "Ya existe otro trabajador con este RUT",
                });
            }
            data.rut = rutFormateado;
        }
        if (telefono !== undefined) {
            data.telefono = telefono ? String(telefono).trim() : null;
        }
        if (email !== undefined) {
            data.email = email ? String(email).trim().toLowerCase() : null;
        }
        if (activo !== undefined) {
            data.activo = Boolean(activo);
        }
        const trabajador = await prisma_1.prisma.trabajador.update({
            where: { id: trabajadorId },
            data,
        });
        return res.json({
            ok: true,
            message: "Trabajador actualizado correctamente",
            trabajador,
        });
    }
    catch (error) {
        console.error("ERROR ACTUALIZAR TRABAJADOR:", error);
        return res
            .status(500)
            .json({ ok: false, message: "Error al actualizar trabajador" });
    }
};
exports.actualizarTrabajador = actualizarTrabajador;
const eliminarTrabajador = async (req, res) => {
    try {
        const trabajadorId = Number(req.params.id);
        if (Number.isNaN(trabajadorId)) {
            return res
                .status(400)
                .json({ ok: false, message: "ID de trabajador inválido" });
        }
        const trabajador = await prisma_1.prisma.trabajador.findUnique({
            where: { id: trabajadorId },
            include: { Asignacion: true, Asistencia: true },
        });
        if (!trabajador) {
            return res
                .status(404)
                .json({ ok: false, message: "Trabajador no encontrado" });
        }
        if (trabajador.Asignacion.length > 0 || trabajador.Asistencia.length > 0) {
            return res.status(400).json({
                ok: false,
                message: "No se puede eliminar este trabajador porque tiene asignaciones o asistencias registradas",
            });
        }
        await prisma_1.prisma.trabajador.delete({ where: { id: trabajadorId } });
        return res.json({ ok: true, message: "Trabajador eliminado correctamente" });
    }
    catch (error) {
        console.error("ERROR ELIMINAR TRABAJADOR:", error);
        return res
            .status(500)
            .json({ ok: false, message: "Error al eliminar trabajador" });
    }
};
exports.eliminarTrabajador = eliminarTrabajador;
