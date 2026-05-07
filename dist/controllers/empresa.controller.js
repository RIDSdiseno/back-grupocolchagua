"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eliminarEmpresa = exports.actualizarEmpresa = exports.crearEmpresa = exports.listarEmpresas = void 0;
const prisma_1 = require("../lib/prisma");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const validarRut_1 = require("../utils/validarRut");
const subirImagenCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.default.uploader.upload_stream({
            folder: "grupo-colchagua/empresas",
            resource_type: "image",
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
const limpiarTexto = (valor) => {
    if (valor === undefined || valor === null)
        return null;
    const texto = String(valor).trim();
    return texto.length > 0 ? texto : null;
};
const normalizarHoldingIds = (valor) => {
    if (valor === undefined || valor === null)
        return [];
    const array = Array.isArray(valor) ? valor : [valor];
    return array
        .map((item) => Number(item))
        .filter((id) => Number.isInteger(id) && id > 0);
};
const listarEmpresas = async (_req, res) => {
    try {
        const empresas = await prisma_1.prisma.empresa.findMany({
            orderBy: { id: "desc" },
            include: {
                holdings: {
                    include: {
                        Holding: true,
                    },
                },
            },
        });
        return res.json({
            ok: true,
            empresas,
        });
    }
    catch (error) {
        console.error("ERROR LISTAR EMPRESAS:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al listar empresas",
        });
    }
};
exports.listarEmpresas = listarEmpresas;
const crearEmpresa = async (req, res) => {
    try {
        const { razonSocial, alias, rut, encargadoNombre, encargadoCorreo, encargadoTelefono, holdingIds, } = req.body;
        const idsHoldings = normalizarHoldingIds(holdingIds);
        if (!razonSocial || !alias || !rut) {
            return res.status(400).json({
                ok: false,
                message: "Razón social, alias y RUT son obligatorios",
            });
        }
        if (idsHoldings.length === 0) {
            return res.status(400).json({
                ok: false,
                message: "Debes seleccionar al menos un holding",
            });
        }
        const rutLimpio = String(rut).trim();
        if (!(0, validarRut_1.validarRut)(rutLimpio)) {
            return res.status(400).json({
                ok: false,
                message: "El RUT ingresado no es válido",
            });
        }
        const rutFormateado = (0, validarRut_1.formatearRut)(rutLimpio);
        const empresaExistente = await prisma_1.prisma.empresa.findFirst({
            where: {
                rut: rutFormateado,
            },
        });
        if (empresaExistente) {
            return res.status(400).json({
                ok: false,
                message: "Ya existe una empresa registrada con este RUT",
            });
        }
        const holdingsExistentes = await prisma_1.prisma.holding.findMany({
            where: {
                id: {
                    in: idsHoldings,
                },
            },
            select: {
                id: true,
            },
        });
        if (holdingsExistentes.length !== idsHoldings.length) {
            return res.status(400).json({
                ok: false,
                message: "Uno o más holdings seleccionados no existen",
            });
        }
        let logoUrl = null;
        let logoPublicId = null;
        if (req.file) {
            const upload = await subirImagenCloudinary(req.file.buffer);
            logoUrl = upload.secure_url;
            logoPublicId = upload.public_id;
        }
        const empresa = await prisma_1.prisma.empresa.create({
            data: {
                razonSocial: String(razonSocial).trim(),
                nombre: String(alias).trim(),
                rut: rutFormateado,
                logoUrl,
                logoPublicId,
                encargadoNombre: limpiarTexto(encargadoNombre),
                encargadoCorreo: limpiarTexto(encargadoCorreo),
                encargadoTelefono: limpiarTexto(encargadoTelefono),
                holdings: {
                    create: idsHoldings.map((holdingId) => ({
                        holdingId,
                    })),
                },
            },
            include: {
                holdings: {
                    include: {
                        Holding: true,
                    },
                },
            },
        });
        return res.status(201).json({
            ok: true,
            message: "Empresa creada correctamente",
            empresa,
        });
    }
    catch (error) {
        console.error("ERROR CREAR EMPRESA:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al crear empresa",
        });
    }
};
exports.crearEmpresa = crearEmpresa;
const actualizarEmpresa = async (req, res) => {
    try {
        const { id } = req.params;
        const { razonSocial, alias, rut, encargadoNombre, encargadoCorreo, encargadoTelefono, holdingIds, } = req.body;
        const empresaId = Number(id);
        if (Number.isNaN(empresaId)) {
            return res.status(400).json({
                ok: false,
                message: "ID de empresa inválido",
            });
        }
        const idsHoldings = normalizarHoldingIds(holdingIds);
        if (idsHoldings.length === 0) {
            return res.status(400).json({
                ok: false,
                message: "Debes seleccionar al menos un holding",
            });
        }
        const empresaExistente = await prisma_1.prisma.empresa.findUnique({
            where: { id: empresaId },
            include: {
                holdings: true,
            },
        });
        if (!empresaExistente) {
            return res.status(404).json({
                ok: false,
                message: "Empresa no encontrada",
            });
        }
        const holdingsExistentes = await prisma_1.prisma.holding.findMany({
            where: {
                id: {
                    in: idsHoldings,
                },
            },
            select: {
                id: true,
            },
        });
        if (holdingsExistentes.length !== idsHoldings.length) {
            return res.status(400).json({
                ok: false,
                message: "Uno o más holdings seleccionados no existen",
            });
        }
        let rutFinal = empresaExistente.rut;
        if (rut) {
            const rutLimpio = String(rut).trim();
            if (!(0, validarRut_1.validarRut)(rutLimpio)) {
                return res.status(400).json({
                    ok: false,
                    message: "El RUT ingresado no es válido",
                });
            }
            rutFinal = (0, validarRut_1.formatearRut)(rutLimpio);
            const otraEmpresaConRut = await prisma_1.prisma.empresa.findFirst({
                where: {
                    rut: rutFinal,
                    NOT: {
                        id: empresaId,
                    },
                },
            });
            if (otraEmpresaConRut) {
                return res.status(400).json({
                    ok: false,
                    message: "Ya existe otra empresa registrada con este RUT",
                });
            }
        }
        let logoUrl = empresaExistente.logoUrl;
        let logoPublicId = empresaExistente.logoPublicId;
        if (req.file) {
            if (logoPublicId) {
                await cloudinary_1.default.uploader.destroy(logoPublicId);
            }
            const upload = await subirImagenCloudinary(req.file.buffer);
            logoUrl = upload.secure_url;
            logoPublicId = upload.public_id;
        }
        const empresa = await prisma_1.prisma.empresa.update({
            where: { id: empresaId },
            data: {
                razonSocial: razonSocial
                    ? String(razonSocial).trim()
                    : empresaExistente.razonSocial,
                nombre: alias ? String(alias).trim() : empresaExistente.nombre,
                rut: rutFinal,
                logoUrl,
                logoPublicId,
                encargadoNombre: encargadoNombre !== undefined
                    ? limpiarTexto(encargadoNombre)
                    : empresaExistente.encargadoNombre,
                encargadoCorreo: encargadoCorreo !== undefined
                    ? limpiarTexto(encargadoCorreo)
                    : empresaExistente.encargadoCorreo,
                encargadoTelefono: encargadoTelefono !== undefined
                    ? limpiarTexto(encargadoTelefono)
                    : empresaExistente.encargadoTelefono,
                holdings: {
                    deleteMany: {},
                    create: idsHoldings.map((holdingId) => ({
                        holdingId,
                    })),
                },
            },
            include: {
                holdings: {
                    include: {
                        Holding: true,
                    },
                },
            },
        });
        return res.json({
            ok: true,
            message: "Empresa actualizada correctamente",
            empresa,
        });
    }
    catch (error) {
        console.error("ERROR ACTUALIZAR EMPRESA:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al actualizar empresa",
        });
    }
};
exports.actualizarEmpresa = actualizarEmpresa;
const eliminarEmpresa = async (req, res) => {
    try {
        const { id } = req.params;
        const empresaId = Number(id);
        if (Number.isNaN(empresaId)) {
            return res.status(400).json({
                ok: false,
                message: "ID de empresa inválido",
            });
        }
        const empresa = await prisma_1.prisma.empresa.findUnique({
            where: { id: empresaId },
            include: {
                _count: {
                    select: {
                        Sucursal: true,
                        Asignacion: true,
                        Asistencia: true,
                        Tarifa: true,
                    },
                },
            },
        });
        if (!empresa) {
            return res.status(404).json({
                ok: false,
                message: "Empresa no encontrada",
            });
        }
        const tieneRelaciones = empresa._count.Sucursal > 0 ||
            empresa._count.Asignacion > 0 ||
            empresa._count.Asistencia > 0 ||
            empresa._count.Tarifa > 0;
        if (tieneRelaciones) {
            return res.status(400).json({
                ok: false,
                message: "No se puede eliminar esta empresa porque tiene sucursales, asignaciones, asistencias o tarifas asociadas",
            });
        }
        if (empresa.logoPublicId) {
            await cloudinary_1.default.uploader.destroy(empresa.logoPublicId);
        }
        await prisma_1.prisma.empresa.delete({
            where: { id: empresaId },
        });
        return res.json({
            ok: true,
            message: "Empresa eliminada correctamente",
        });
    }
    catch (error) {
        console.error("ERROR ELIMINAR EMPRESA:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al eliminar empresa",
        });
    }
};
exports.eliminarEmpresa = eliminarEmpresa;
