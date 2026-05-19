import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const generarToken = (usuario: {
  id: number;
  email: string;
  rol: string;
}) => {
  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "8h" }
  );
};

const responderLogin = (res: Response, usuario: {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}) => {
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

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: "Email y contraseña son obligatorios",
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      return res.status(401).json({
        ok: false,
        message: "Credenciales inválidas",
      });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);

    if (!passwordValida) {
      return res.status(401).json({
        ok: false,
        message: "Credenciales inválidas",
      });
    }

    return responderLogin(res, usuario);
  } catch (error) {
    console.error("ERROR LOGIN:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor",
    });
  }
};

export const loginMicrosoft = async (req: Request, res: Response) => {
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

    let usuario = await prisma.usuario.findUnique({
      where: { email: emailNormalizado },
    });

    if (!usuario) {
      const passwordTemporal = await bcrypt.hash(
        `MICROSOFT_LOGIN_${microsoftId}_${Date.now()}`,
        10
      );

      usuario = await prisma.usuario.create({
        data: {
          nombre,
          email: emailNormalizado,
          password: passwordTemporal,
          rol: "ADMIN",
        },
      });
    }

    return responderLogin(res, usuario);
  } catch (error) {
    console.error("ERROR LOGIN MICROSOFT:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno al iniciar sesión con Microsoft",
    });
  }
};