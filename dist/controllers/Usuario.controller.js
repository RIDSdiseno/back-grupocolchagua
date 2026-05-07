"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eliminarUsuario = exports.actualizarUsuario = exports.crearUsuario = exports.listarUsuarios = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../lib/prisma");
const listarUsuarios = async (_req, res) => {
    try {
        const usuarios = await prisma_1.prisma.usuario.findMany({
            orderBy: { id: "desc" },
            select: {
                id: true,
                nombre: true,
                email: true,
                rol: true,
            },
        });
        return res.json({ ok: true, usuarios });
    }
    catch (error) {
        console.error("ERROR LISTAR USUARIOS:", error);
        return res.status(500).json({ ok: false, message: "Error al listar usuarios" });
    }
};
exports.listarUsuarios = listarUsuarios;
const crearUsuario = async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;
        if (!nombre?.trim() || !email?.trim() || !password?.trim()) {
            return res.status(400).json({
                ok: false,
                message: "Nombre, email y contraseña son obligatorios",
            });
        }
        const existe = await prisma_1.prisma.usuario.findUnique({ where: { email } });
        if (existe) {
            return res.status(400).json({
                ok: false,
                message: "Ya existe un usuario con ese email",
            });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const usuario = await prisma_1.prisma.usuario.create({
            data: {
                nombre: nombre.trim(),
                email: email.trim().toLowerCase(),
                password: passwordHash,
                rol: rol || "ADMIN",
            },
            select: { id: true, nombre: true, email: true, rol: true },
        });
        return res.status(201).json({
            ok: true,
            message: "Usuario creado correctamente",
            usuario,
        });
    }
    catch (error) {
        console.error("ERROR CREAR USUARIO:", error);
        return res.status(500).json({ ok: false, message: "Error al crear usuario" });
    }
};
exports.crearUsuario = crearUsuario;
const actualizarUsuario = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { nombre, email, password, rol } = req.body;
        if (Number.isNaN(id)) {
            return res.status(400).json({ ok: false, message: "ID inválido" });
        }
        const usuarioExistente = await prisma_1.prisma.usuario.findUnique({ where: { id } });
        if (!usuarioExistente) {
            return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
        }
        if (email && email !== usuarioExistente.email) {
            const emailEnUso = await prisma_1.prisma.usuario.findFirst({
                where: { email, NOT: { id } },
            });
            if (emailEnUso) {
                return res.status(400).json({
                    ok: false,
                    message: "Ya existe otro usuario con ese email",
                });
            }
        }
        const data = {};
        if (nombre?.trim())
            data.nombre = nombre.trim();
        if (email?.trim())
            data.email = email.trim().toLowerCase();
        if (rol)
            data.rol = rol;
        if (password?.trim())
            data.password = await bcryptjs_1.default.hash(password, 10);
        const usuario = await prisma_1.prisma.usuario.update({
            where: { id },
            data,
            select: { id: true, nombre: true, email: true, rol: true },
        });
        return res.json({
            ok: true,
            message: "Usuario actualizado correctamente",
            usuario,
        });
    }
    catch (error) {
        console.error("ERROR ACTUALIZAR USUARIO:", error);
        return res.status(500).json({ ok: false, message: "Error al actualizar usuario" });
    }
};
exports.actualizarUsuario = actualizarUsuario;
const eliminarUsuario = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ ok: false, message: "ID inválido" });
        }
        const usuario = await prisma_1.prisma.usuario.findUnique({ where: { id } });
        if (!usuario) {
            return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
        }
        await prisma_1.prisma.usuario.delete({ where: { id } });
        return res.json({ ok: true, message: "Usuario eliminado correctamente" });
    }
    catch (error) {
        console.error("ERROR ELIMINAR USUARIO:", error);
        return res.status(500).json({ ok: false, message: "Error al eliminar usuario" });
    }
};
exports.eliminarUsuario = eliminarUsuario;
