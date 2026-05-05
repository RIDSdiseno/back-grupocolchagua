"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eliminarSucursal = exports.actualizarSucursal = exports.crearSucursal = exports.listarSucursalesPorEmpresa = exports.listarTodasSucursales = void 0;
const prisma_1 = require("../lib/prisma");
const listarTodasSucursales = async (_req, res) => {
    try {
        const sucursales = await prisma_1.prisma.sucursal.findMany({
            include: {
                Empresa: { select: { id: true, nombre: true } },
            },
            orderBy: [{ Empresa: { nombre: "asc" } }, { nombre: "asc" }],
        });
        return res.json({ ok: true, sucursales });
    }
    catch (error) {
        console.error("ERROR LISTAR SUCURSALES:", error);
        return res.status(500).json({ ok: false, message: "Error al listar sucursales" });
    }
};
exports.listarTodasSucursales = listarTodasSucursales;
const listarSucursalesPorEmpresa = async (req, res) => {
    try {
        const empresaId = Number(req.params.empresaId);
        if (Number.isNaN(empresaId)) {
            return res.status(400).json({ ok: false, message: "ID de empresa inválido" });
        }
        const sucursales = await prisma_1.prisma.sucursal.findMany({
            where: { empresaId },
            orderBy: { id: "desc" },
        });
        return res.json({ ok: true, sucursales });
    }
    catch (error) {
        console.error("ERROR LISTAR SUCURSALES:", error);
        return res.status(500).json({ ok: false, message: "Error al listar sucursales" });
    }
};
exports.listarSucursalesPorEmpresa = listarSucursalesPorEmpresa;
const crearSucursal = async (req, res) => {
    try {
        const empresaId = Number(req.params.empresaId);
        const { nombre, direccion, comuna, ciudad } = req.body;
        if (Number.isNaN(empresaId)) {
            return res.status(400).json({ ok: false, message: "ID de empresa inválido" });
        }
        if (!nombre || !String(nombre).trim()) {
            return res.status(400).json({ ok: false, message: "El nombre de la sucursal es obligatorio" });
        }
        const empresa = await prisma_1.prisma.empresa.findUnique({
            where: { id: empresaId },
        });
        if (!empresa) {
            return res.status(404).json({ ok: false, message: "Empresa no encontrada" });
        }
        const sucursalExistente = await prisma_1.prisma.sucursal.findFirst({
            where: {
                empresaId,
                nombre: {
                    equals: String(nombre).trim(),
                    mode: "insensitive",
                },
            },
        });
        if (sucursalExistente) {
            return res.status(400).json({
                ok: false,
                message: "Esta empresa ya tiene una sucursal con ese nombre",
            });
        }
        const sucursal = await prisma_1.prisma.sucursal.create({
            data: {
                empresaId,
                nombre: String(nombre).trim(),
                direccion: direccion ? String(direccion).trim() : null,
                comuna: comuna ? String(comuna).trim() : null,
                ciudad: ciudad ? String(ciudad).trim() : null,
            },
        });
        return res.status(201).json({
            ok: true,
            message: "Sucursal creada correctamente",
            sucursal,
        });
    }
    catch (error) {
        console.error("ERROR CREAR SUCURSAL:", error);
        return res.status(500).json({ ok: false, message: "Error al crear sucursal" });
    }
};
exports.crearSucursal = crearSucursal;
const actualizarSucursal = async (req, res) => {
    try {
        const sucursalId = Number(req.params.id);
        const { nombre, direccion, comuna, ciudad, activo } = req.body;
        if (Number.isNaN(sucursalId)) {
            return res.status(400).json({ ok: false, message: "ID de sucursal inválido" });
        }
        const sucursalExistente = await prisma_1.prisma.sucursal.findUnique({
            where: { id: sucursalId },
        });
        if (!sucursalExistente) {
            return res.status(404).json({ ok: false, message: "Sucursal no encontrada" });
        }
        const sucursal = await prisma_1.prisma.sucursal.update({
            where: { id: sucursalId },
            data: {
                nombre: nombre ? String(nombre).trim() : sucursalExistente.nombre,
                direccion: direccion !== undefined ? String(direccion).trim() : sucursalExistente.direccion,
                comuna: comuna !== undefined ? String(comuna).trim() : sucursalExistente.comuna,
                ciudad: ciudad !== undefined ? String(ciudad).trim() : sucursalExistente.ciudad,
                activo: activo !== undefined ? Boolean(activo) : sucursalExistente.activo,
            },
        });
        return res.json({
            ok: true,
            message: "Sucursal actualizada correctamente",
            sucursal,
        });
    }
    catch (error) {
        console.error("ERROR ACTUALIZAR SUCURSAL:", error);
        return res.status(500).json({ ok: false, message: "Error al actualizar sucursal" });
    }
};
exports.actualizarSucursal = actualizarSucursal;
const eliminarSucursal = async (req, res) => {
    try {
        const sucursalId = Number(req.params.id);
        if (Number.isNaN(sucursalId)) {
            return res.status(400).json({ ok: false, message: "ID de sucursal inválido" });
        }
        const sucursal = await prisma_1.prisma.sucursal.findUnique({
            where: { id: sucursalId },
            include: { Tarifa: true, Asignacion: true, Asistencia: true },
        });
        if (!sucursal) {
            return res.status(404).json({ ok: false, message: "Sucursal no encontrada" });
        }
        if (sucursal.Tarifa.length > 0 || sucursal.Asignacion.length > 0 || sucursal.Asistencia.length > 0) {
            return res.status(400).json({
                ok: false,
                message: "No se puede eliminar esta sucursal porque tiene datos asociados",
            });
        }
        await prisma_1.prisma.sucursal.delete({
            where: { id: sucursalId },
        });
        return res.json({
            ok: true,
            message: "Sucursal eliminada correctamente",
        });
    }
    catch (error) {
        console.error("ERROR ELIMINAR SUCURSAL:", error);
        return res.status(500).json({ ok: false, message: "Error al eliminar sucursal" });
    }
};
exports.eliminarSucursal = eliminarSucursal;
