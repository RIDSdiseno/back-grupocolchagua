"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.actualizarEstadoPostulacion = exports.obtenerPostulacion = exports.listarPostulaciones = exports.crearPostulacion = void 0;
const prisma_1 = require("../lib/prisma");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const limpiarTexto = (valor) => {
    if (valor === undefined || valor === null)
        return null;
    const texto = String(valor).trim();
    return texto.length > 0 ? texto : null;
};
const subirCvCloudinary = (fileBuffer, originalName) => {
    return new Promise((resolve, reject) => {
        const nombreLimpio = originalName
            .replace(/\.[^/.]+$/, "")
            .replace(/\s+/g, "-")
            .replace(/[^a-zA-Z0-9-_]/g, "");
        const stream = cloudinary_1.default.uploader.upload_stream({
            folder: "grupo-colchagua/postulaciones/cv",
            resource_type: "raw",
            public_id: `${Date.now()}-${nombreLimpio}`,
        }, (error, result) => {
            if (error) {
                reject(error);
                return;
            }
            if (!result) {
                reject(new Error("Cloudinary no retornó resultado"));
                return;
            }
            resolve({
                secure_url: result.secure_url,
                public_id: result.public_id,
            });
        });
        stream.end(fileBuffer);
    });
};
const crearPostulacion = async (req, res) => {
    try {
        const { nombre, apellido, rut, email, telefono, cargoPostula, comuna, region, experiencia, disponibilidad, mensaje, } = req.body;
        if (!nombre || !apellido || !email || !telefono || !cargoPostula) {
            return res.status(400).json({
                ok: false,
                message: "Nombre, apellido, email, teléfono y cargo postula son obligatorios",
            });
        }
        if (!req.file) {
            return res.status(400).json({
                ok: false,
                message: "El CV es obligatorio",
            });
        }
        const upload = await subirCvCloudinary(req.file.buffer, req.file.originalname);
        const postulacion = await prisma_1.prisma.postulacion.create({
            data: {
                nombre: String(nombre).trim(),
                apellido: String(apellido).trim(),
                rut: limpiarTexto(rut),
                email: String(email).trim().toLowerCase(),
                telefono: String(telefono).trim(),
                cargoPostula: String(cargoPostula).trim(),
                comuna: limpiarTexto(comuna),
                region: limpiarTexto(region),
                experiencia: limpiarTexto(experiencia),
                disponibilidad: limpiarTexto(disponibilidad),
                mensaje: limpiarTexto(mensaje),
                cvUrl: upload.secure_url,
                cvPublicId: upload.public_id,
                estado: "PENDIENTE",
            },
        });
        return res.status(201).json({
            ok: true,
            message: "Postulación enviada correctamente",
            postulacion,
        });
    }
    catch (error) {
        console.error("ERROR CREAR POSTULACION:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al enviar postulación",
        });
    }
};
exports.crearPostulacion = crearPostulacion;
const listarPostulaciones = async (_req, res) => {
    try {
        const postulaciones = await prisma_1.prisma.postulacion.findMany({
            orderBy: { createdAt: "desc" },
        });
        return res.json({
            ok: true,
            postulaciones,
        });
    }
    catch (error) {
        console.error("ERROR LISTAR POSTULACIONES:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al listar postulaciones",
        });
    }
};
exports.listarPostulaciones = listarPostulaciones;
const obtenerPostulacion = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({
                ok: false,
                message: "ID inválido",
            });
        }
        const postulacion = await prisma_1.prisma.postulacion.findUnique({
            where: { id },
        });
        if (!postulacion) {
            return res.status(404).json({
                ok: false,
                message: "Postulación no encontrada",
            });
        }
        return res.json({
            ok: true,
            postulacion,
        });
    }
    catch (error) {
        console.error("ERROR OBTENER POSTULACION:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al obtener postulación",
        });
    }
};
exports.obtenerPostulacion = obtenerPostulacion;
const actualizarEstadoPostulacion = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { estado } = req.body;
        if (Number.isNaN(id)) {
            return res.status(400).json({
                ok: false,
                message: "ID inválido",
            });
        }
        const estadosPermitidos = [
            "PENDIENTE",
            "REVISADO",
            "CONTACTADO",
            "DESCARTADO",
        ];
        if (!estadosPermitidos.includes(String(estado))) {
            return res.status(400).json({
                ok: false,
                message: "Estado inválido",
            });
        }
        const postulacion = await prisma_1.prisma.postulacion.update({
            where: { id },
            data: {
                estado: String(estado),
            },
        });
        return res.json({
            ok: true,
            message: "Estado actualizado correctamente",
            postulacion,
        });
    }
    catch (error) {
        console.error("ERROR ACTUALIZAR ESTADO POSTULACION:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al actualizar estado",
        });
    }
};
exports.actualizarEstadoPostulacion = actualizarEstadoPostulacion;
