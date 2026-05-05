"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eliminarCargo = exports.actualizarCargo = exports.crearCargo = exports.listarCargos = void 0;
const prisma_1 = require("../lib/prisma");
const normalizarNombreCargo = (valor) => {
    return String(valor || "").trim();
};
const listarCargos = async (_req, res) => {
    try {
        const cargos = await prisma_1.prisma.cargo.findMany({
            orderBy: { nombre: "asc" },
            include: {
                _count: {
                    select: {
                        Asignacion: true,
                        Asistencia: true,
                        Tarifa: true,
                    },
                },
            },
        });
        return res.json({
            ok: true,
            cargos,
        });
    }
    catch (error) {
        console.error("ERROR LISTAR CARGOS:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al listar cargos",
        });
    }
};
exports.listarCargos = listarCargos;
const crearCargo = async (req, res) => {
    try {
        const nombreNormalizado = normalizarNombreCargo(req.body.nombre);
        if (!nombreNormalizado) {
            return res.status(400).json({
                ok: false,
                message: "El nombre del cargo es obligatorio",
            });
        }
        const cargoExistente = await prisma_1.prisma.cargo.findFirst({
            where: {
                nombre: {
                    equals: nombreNormalizado,
                    mode: "insensitive",
                },
            },
        });
        if (cargoExistente) {
            return res.status(400).json({
                ok: false,
                message: "Ya existe un cargo con este nombre",
            });
        }
        const cargo = await prisma_1.prisma.cargo.create({
            data: {
                nombre: nombreNormalizado,
            },
        });
        return res.status(201).json({
            ok: true,
            message: "Cargo creado correctamente",
            cargo,
        });
    }
    catch (error) {
        console.error("ERROR CREAR CARGO:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al crear cargo",
        });
    }
};
exports.crearCargo = crearCargo;
const actualizarCargo = async (req, res) => {
    try {
        const cargoId = Number(req.params.id);
        const nombreNormalizado = normalizarNombreCargo(req.body.nombre);
        if (Number.isNaN(cargoId)) {
            return res.status(400).json({
                ok: false,
                message: "ID de cargo inválido",
            });
        }
        if (!nombreNormalizado) {
            return res.status(400).json({
                ok: false,
                message: "El nombre del cargo es obligatorio",
            });
        }
        const cargoExistente = await prisma_1.prisma.cargo.findUnique({
            where: { id: cargoId },
        });
        if (!cargoExistente) {
            return res.status(404).json({
                ok: false,
                message: "Cargo no encontrado",
            });
        }
        const otroCargo = await prisma_1.prisma.cargo.findFirst({
            where: {
                nombre: {
                    equals: nombreNormalizado,
                    mode: "insensitive",
                },
                NOT: {
                    id: cargoId,
                },
            },
        });
        if (otroCargo) {
            return res.status(400).json({
                ok: false,
                message: "Ya existe otro cargo con este nombre",
            });
        }
        const cargo = await prisma_1.prisma.cargo.update({
            where: { id: cargoId },
            data: {
                nombre: nombreNormalizado,
            },
        });
        return res.json({
            ok: true,
            message: "Cargo actualizado correctamente",
            cargo,
        });
    }
    catch (error) {
        console.error("ERROR ACTUALIZAR CARGO:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al actualizar cargo",
        });
    }
};
exports.actualizarCargo = actualizarCargo;
const eliminarCargo = async (req, res) => {
    try {
        const cargoId = Number(req.params.id);
        if (Number.isNaN(cargoId)) {
            return res.status(400).json({
                ok: false,
                message: "ID de cargo inválido",
            });
        }
        const cargo = await prisma_1.prisma.cargo.findUnique({
            where: { id: cargoId },
            include: {
                _count: {
                    select: {
                        Asignacion: true,
                        Asistencia: true,
                        Tarifa: true,
                    },
                },
            },
        });
        if (!cargo) {
            return res.status(404).json({
                ok: false,
                message: "Cargo no encontrado",
            });
        }
        const tieneRelaciones = cargo._count.Asignacion > 0 ||
            cargo._count.Asistencia > 0 ||
            cargo._count.Tarifa > 0;
        if (tieneRelaciones) {
            return res.status(400).json({
                ok: false,
                message: "No se puede eliminar este cargo porque tiene asignaciones, asistencias o tarifas asociadas",
            });
        }
        await prisma_1.prisma.cargo.delete({
            where: { id: cargoId },
        });
        return res.json({
            ok: true,
            message: "Cargo eliminado correctamente",
        });
    }
    catch (error) {
        console.error("ERROR ELIMINAR CARGO:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al eliminar cargo",
        });
    }
};
exports.eliminarCargo = eliminarCargo;
