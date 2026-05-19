"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginMicrosoft = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const generarToken = (usuario) => {
    return jsonwebtoken_1.default.sign({
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
    }, process.env.JWT_SECRET, { expiresIn: "8h" });
};
const responderLogin = (res, usuario) => {
    const token = generarToken(usuario);
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
};
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
        return responderLogin(res, usuario);
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
const loginMicrosoft = async (req, res) => {
    try {
        const { email, nombre, microsoftId } = req.body;
        if (!email || !nombre || !microsoftId) {
            return res.status(400).json({
                ok: false,
                message: "Faltan datos de la cuenta Microsoft",
            });
        }
        const emailNormalizado = String(email).toLowerCase().trim();
        const dominioPermitido = "@grupocolchagua.cl";
        if (!emailNormalizado.endsWith(dominioPermitido)) {
            return res.status(403).json({
                ok: false,
                message: "Solo se permiten cuentas corporativas de Grupo Colchagua",
            });
        }
        let usuario = await prisma_1.prisma.usuario.findUnique({
            where: { email: emailNormalizado },
        });
        if (!usuario) {
            const passwordTemporal = await bcryptjs_1.default.hash(`MICROSOFT_LOGIN_${microsoftId}_${Date.now()}`, 10);
            usuario = await prisma_1.prisma.usuario.create({
                data: {
                    nombre,
                    email: emailNormalizado,
                    password: passwordTemporal,
                    rol: "ADMIN",
                },
            });
        }
        return responderLogin(res, usuario);
    }
    catch (error) {
        console.error("ERROR LOGIN MICROSOFT:", error);
        return res.status(500).json({
            ok: false,
            message: "Error interno al iniciar sesión con Microsoft",
        });
    }
};
exports.loginMicrosoft = loginMicrosoft;
