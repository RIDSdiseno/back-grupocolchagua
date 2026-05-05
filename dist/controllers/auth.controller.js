"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                ok: false,
                message: "Email y contraseña son obligatorios",
            });
        }
        const usuario = await prisma_1.prisma.usuario.findUnique({
            where: { email },
        });
        if (!usuario) {
            return res.status(401).json({
                ok: false,
                message: "Credenciales inválidas",
            });
        }
        const passwordValida = await bcryptjs_1.default.compare(password, usuario.password);
        if (!passwordValida) {
            return res.status(401).json({
                ok: false,
                message: "Credenciales inválidas",
            });
        }
        const token = jsonwebtoken_1.default.sign({
            id: usuario.id,
            email: usuario.email,
            rol: usuario.rol,
        }, process.env.JWT_SECRET, { expiresIn: "8h" });
        return res.json({
            ok: true,
            message: "Login exitoso",
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol,
            },
        });
    }
    catch (error) {
        console.error("ERROR LOGIN:", error);
        return res.status(500).json({
            ok: false,
            message: "Error interno del servidor",
        });
    }
};
exports.login = login;
