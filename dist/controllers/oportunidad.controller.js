"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eliminarFuenteExterna = exports.actualizarFuenteExterna = exports.crearFuenteExterna = exports.eliminarDocumentoRequerido = exports.actualizarDocumentoRequerido = exports.crearDocumentoRequerido = exports.actualizarEtapaContratados = exports.obtenerEtapaContratados = exports.actualizarEtapaDocumentacion = exports.obtenerEtapaDocumentacion = exports.actualizarEtapaEntrevista = exports.actualizarEtapaPreseleccion = exports.actualizarEtapaNuevos = exports.postergarOportunidad = exports.marcarOportunidadPerdida = exports.actualizarEstadoOportunidad = exports.actualizarOportunidad = exports.crearOportunidad = exports.obtenerOportunidad = exports.listarOportunidades = void 0;
const prisma_1 = require("../lib/prisma");
const JORNADAS_OPORTUNIDAD = ["FULL_TIME", "PART_TIME", "AMBAS"];
const ESTADOS_BUSQUEDA = ["ACTIVA", "PAUSADA", "CERRADA", "CANCELADA"];
const PRIORIDADES_OPORTUNIDAD = ["ALTA", "MEDIA", "BAJA"];
const MOTIVOS_DESCARTE_PRESELECCION = [
    "No cumple experiencia requerida",
    "No cumple requisitos del cargo",
    "Disponibilidad incompatible",
    "Ubicación o comuna no compatible",
    "Pretensión de renta no compatible",
    "No fue posible contactar",
    "Desistió del proceso",
    "Antecedentes o documentación incompleta",
    "Perfil no se ajusta al cargo",
    "Otro",
];
const MOTIVOS_NO_APTITUD_ENTREVISTA = [
    "No cumple competencias técnicas",
    "No cumple competencias blandas",
    "Experiencia insuficiente",
    "Disponibilidad incompatible",
    "Pretensión de renta",
    "No asistió",
    "Desistió del proceso",
    "Otro",
];
const MODALIDADES_ENTREVISTA = ["Presencial", "Online", "Telefónica"];
const NIVELES_CANDIDATOS_ENTREVISTA = ["Excelente", "Bueno", "Regular", "Bajo"];
const MOTIVOS_REPUBLICACION_ENTREVISTA = [
    "Pocos postulantes",
    "Baja calidad de postulantes",
    "No se logró cubrir la vacante",
    "Cambio de requisitos",
    "Otro",
];
const TIPOS_DOCUMENTO_REQUERIDO = [
    "Cédula de identidad",
    "Certificado de antecedentes",
    "AFP",
    "Salud",
    "Cuenta bancaria",
    "Contrato firmado",
    "Examen preocupacional",
    "Licencia de conducir",
    "Certificados",
    "Otro",
];
const MOTIVOS_NO_INGRESO_CONTRATADOS = [
    "Renunció antes del ingreso",
    "No se presentó el primer día",
    "Cliente canceló el ingreso",
    "Documentación incompleta",
    "No aprobó examen preocupacional",
    "Cambio de condiciones laborales",
    "Otro",
];
const limpiarTexto = (valor) => {
    if (valor === undefined || valor === null)
        return null;
    const texto = String(valor).trim();
    return texto.length > 0 ? texto : null;
};
const parseFecha = (valor) => {
    if (!valor)
        return null;
    const fecha = new Date(String(valor));
    return Number.isNaN(fecha.getTime()) ? null : fecha;
};
const parseEnteroPositivo = (valor) => {
    const numero = Number(valor);
    if (Number.isNaN(numero) || numero < 1)
        return null;
    return Math.floor(numero);
};
const parseEnteroNoNegativo = (valor) => {
    if (valor === undefined || valor === null || String(valor).trim() === "")
        return null;
    const numero = Number(valor);
    if (Number.isNaN(numero) || numero < 0 || !Number.isInteger(numero))
        return null;
    return numero;
};
const parseBooleanOpcional = (valor) => {
    if (valor === undefined || valor === null || String(valor).trim() === "")
        return null;
    if (valor === true || valor === "true" || valor === "SI")
        return true;
    if (valor === false || valor === "false" || valor === "NO")
        return false;
    return null;
};
const normalizarNombreFuente = (valor) => valor.trim().toLowerCase().replace(/\s+/g, " ");
const normalizarNombreDocumento = (valor) => valor.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
const normalizarMotivoNoAptitud = (motivos, motivoPersonalizado) => {
    const clave = [...motivos].map((m) => m.trim().toLowerCase()).sort().join("|");
    return motivos.includes("Otro")
        ? `${clave}::${(motivoPersonalizado ?? "").trim().toLowerCase().replace(/\s+/g, " ")}`
        : clave;
};
const normalizarMotivoNoIngreso = (motivo, motivoOtro) => motivo === "Otro"
    ? `otro::${(motivoOtro ?? "").trim().toLowerCase().replace(/\s+/g, " ")}`
    : motivo.trim().toLowerCase();
const calcularEstadoFinalProceso = (personasContratadas, personasNecesarias) => {
    if (personasContratadas >= personasNecesarias)
        return "VACANTE_CUBIERTA";
    if (personasContratadas > 0)
        return "VACANTE_PARCIALMENTE_CUBIERTA";
    return "VACANTE_NO_CUBIERTA";
};
const calcularPostulantesOtros = (fuentes) => fuentes.reduce((acc, f) => acc + f.cantidad, 0);
const registrarHistorial = async (params) => {
    if (!params.usuarioId)
        return;
    await prisma_1.prisma.oportunidadHistorial.create({
        data: {
            oportunidadId: params.oportunidadId,
            tipo: params.tipo,
            usuarioId: params.usuarioId,
            detalle: params.detalle ?? null,
            estadoAnterior: params.estadoAnterior ?? null,
            estadoNuevo: params.estadoNuevo ?? null,
        },
    });
};
const INCLUDE_OPORTUNIDAD = {
    Empresa: true,
    Cargo: true,
    Sucursal: true,
    ReclutadorResponsable: true,
};
const serializarDatosDocumentacion = (oportunidad) => {
    const documentacion = oportunidad.Documentacion;
    const personasSeleccionadas = oportunidad.Entrevista?.aptos ?? 0;
    const documentacionCompleta = documentacion?.documentacionCompleta ?? 0;
    return {
        personasNecesarias: oportunidad.cantidadNecesaria,
        personasSeleccionadas,
        documentacionCompleta,
        documentacionPendiente: Math.max(personasSeleccionadas - documentacionCompleta, 0),
        fechaInicioDocumentacion: documentacion?.fechaInicioDocumentacion ?? null,
        fechaEstimadaDocumentacionCompleta: documentacion?.fechaEstimadaDocumentacionCompleta ?? null,
        fechaRealDocumentacionCompleta: documentacion?.fechaRealDocumentacionCompleta ?? null,
        observacionesDocumentacion: documentacion?.observacionesDocumentacion ?? null,
        updatedAt: documentacion?.updatedAt ?? null,
        documentosRequeridos: (oportunidad.DocumentosRequeridos ?? []).map((documento) => ({
            id: String(documento.id),
            nombre: documento.nombre,
            tipoDocumento: documento.tipoDocumento,
            obligatorio: documento.obligatorio,
            cantidadEntregada: documento.cantidadEntregada,
            cantidadPendiente: Math.max(personasSeleccionadas - documento.cantidadEntregada, 0),
            observaciones: documento.observaciones,
        })),
    };
};
const serializarDatosContratados = (oportunidad) => {
    const contratados = oportunidad.Contratados;
    const personasSeleccionadas = oportunidad.Entrevista?.aptos ?? 0;
    const personasContratadas = contratados?.personasContratadas ?? 0;
    return {
        personasNecesarias: oportunidad.cantidadNecesaria,
        personasSeleccionadas,
        documentacionCompleta: oportunidad.Documentacion?.documentacionCompleta ?? 0,
        personasContratadas,
        personasNoIngresaron: contratados?.personasNoIngresaron ?? 0,
        vacantesPendientes: Math.max(oportunidad.cantidadNecesaria - personasContratadas, 0),
        estadoFinalProceso: calcularEstadoFinalProceso(personasContratadas, oportunidad.cantidadNecesaria),
        fechaPrimerIngreso: contratados?.fechaPrimerIngreso ?? null,
        fechaCierreProceso: contratados?.fechaCierreProceso ?? null,
        observacionesContratados: contratados?.observacionesContratados ?? null,
        updatedAt: contratados?.updatedAt ?? null,
        motivosNoIngreso: (contratados?.MotivosNoIngreso ?? []).map((motivo) => ({
            id: String(motivo.id),
            motivo: motivo.motivo,
            motivoOtro: motivo.motivoOtro,
            cantidad: motivo.cantidad,
        })),
    };
};
const estadoVisibleOportunidad = (estado) => estado === "SELECCIONADOS" ? "DOCUMENTACION" : estado;
const serializarOportunidad = (oportunidad) => ({
    id: String(oportunidad.id),
    empresaId: String(oportunidad.empresaId),
    empresaNombre: oportunidad.Empresa.nombre,
    cargoId: String(oportunidad.cargoId),
    cargo: oportunidad.Cargo.nombre,
    sucursalId: oportunidad.sucursalId ? String(oportunidad.sucursalId) : null,
    sucursalNombre: oportunidad.Sucursal?.nombre ?? null,
    direccion: oportunidad.Sucursal?.direccion ?? null,
    comuna: oportunidad.Sucursal?.comuna ?? null,
    ciudad: oportunidad.Sucursal?.ciudad ?? null,
    cantidadNecesaria: oportunidad.cantidadNecesaria,
    jornada: oportunidad.jornada,
    fechaInicio: oportunidad.fechaInicio,
    fechaLimite: oportunidad.fechaLimite,
    reclutadorResponsableId: String(oportunidad.reclutadorResponsableId),
    reclutadorResponsable: oportunidad.ReclutadorResponsable.nombre,
    observaciones: oportunidad.observaciones,
    estado: estadoVisibleOportunidad(oportunidad.estado),
    createdAt: oportunidad.createdAt,
    postulantesPreseleccionados: oportunidad.postulantesPreseleccion,
    perdida: oportunidad.perdida,
    motivoPerdida: oportunidad.motivoPerdida,
    postergada: oportunidad.postergada,
    motivoPostergacion: oportunidad.motivoPostergacion,
});
/** Mismo criterio que `construirFiltros` de `oportunidadComercial.controller.ts`: filtros opcionales por query param, todos combinables. */
const construirFiltrosOportunidades = (query) => {
    const where = {};
    if (query.empresaId)
        where.empresaId = Number(query.empresaId);
    if (query.cargoId)
        where.cargoId = Number(query.cargoId);
    if (query.reclutadorId)
        where.reclutadorResponsableId = Number(query.reclutadorId);
    if (query.estado) {
        where.estado = String(query.estado);
    }
    const busqueda = query.busqueda ? String(query.busqueda).trim() : "";
    if (busqueda) {
        where.OR = [
            { observaciones: { contains: busqueda, mode: "insensitive" } },
            { Cargo: { nombre: { contains: busqueda, mode: "insensitive" } } },
            { Empresa: { nombre: { contains: busqueda, mode: "insensitive" } } },
        ];
    }
    return where;
};
const listarOportunidades = async (req, res) => {
    try {
        const where = construirFiltrosOportunidades(req.query);
        const oportunidades = await prisma_1.prisma.oportunidadReclutamiento.findMany({
            where,
            orderBy: { createdAt: "desc" },
            relationLoadStrategy: "join",
            include: {
                ...INCLUDE_OPORTUNIDAD,
                Empleo: { select: { _count: { select: { postulaciones: true } } } },
                FuentesExternas: { select: { cantidad: true } },
                Entrevista: { select: { aptos: true } },
                Documentacion: { select: { documentacionCompleta: true } },
                Contratados: { select: { personasContratadas: true } },
            },
        });
        return res.json({
            ok: true,
            oportunidades: oportunidades.map((o) => {
                const postulantesWeb = o.Empleo?._count.postulaciones ?? 0;
                const postulantesOtros = calcularPostulantesOtros(o.FuentesExternas);
                const personasContratadas = o.Contratados?.personasContratadas ?? 0;
                return {
                    ...serializarOportunidad(o),
                    postulantesWeb,
                    postulantesOtros,
                    totalPostulantes: postulantesWeb + postulantesOtros,
                    aptosEntrevista: o.Entrevista?.aptos ?? 0,
                    documentacionCompleta: o.Documentacion?.documentacionCompleta ?? 0,
                    documentacionPendiente: Math.max((o.Entrevista?.aptos ?? 0) - (o.Documentacion?.documentacionCompleta ?? 0), 0),
                    personasContratadas,
                    vacantesPendientes: Math.max(o.cantidadNecesaria - personasContratadas, 0),
                };
            }),
        });
    }
    catch (error) {
        console.error("ERROR LISTAR OPORTUNIDADES:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al listar oportunidades",
        });
    }
};
exports.listarOportunidades = listarOportunidades;
const obtenerOportunidad = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ ok: false, message: "ID de oportunidad inválido" });
        }
        const oportunidad = await prisma_1.prisma.oportunidadReclutamiento.findUnique({
            where: { id },
            relationLoadStrategy: "join",
            include: {
                ...INCLUDE_OPORTUNIDAD,
                ActualizadoPor: true,
                Empleo: {
                    include: {
                        _count: { select: { postulaciones: true } },
                        postulaciones: {
                            orderBy: { createdAt: "desc" },
                            take: 1,
                            select: { createdAt: true },
                        },
                    },
                },
                FuentesExternas: { orderBy: { createdAt: "asc" } },
                Entrevista: {
                    include: {
                        ResponsableEntrevista: { select: { id: true, nombre: true } },
                        MotivosNoAptitud: { orderBy: { createdAt: "asc" } },
                    },
                },
                Documentacion: true,
                DocumentosRequeridos: { orderBy: { createdAt: "asc" } },
                Contratados: {
                    include: { MotivosNoIngreso: { orderBy: { createdAt: "asc" } } },
                },
                Historial: {
                    orderBy: { createdAt: "desc" },
                    include: { Usuario: { select: { nombre: true } } },
                },
            },
        });
        if (!oportunidad) {
            return res.status(404).json({ ok: false, message: "Oportunidad no encontrada" });
        }
        const postulantesWeb = oportunidad.Empleo?._count.postulaciones ?? 0;
        const postulantesOtros = calcularPostulantesOtros(oportunidad.FuentesExternas);
        const totalPostulantes = postulantesWeb + postulantesOtros;
        return res.json({
            ok: true,
            oportunidad: {
                ...serializarOportunidad(oportunidad),
                etapaNuevos: {
                    empleoId: oportunidad.empleoId ? String(oportunidad.empleoId) : null,
                    ofertaTitulo: oportunidad.Empleo?.titulo ?? null,
                    ofertaPublicadoEn: oportunidad.Empleo?.publicadoEn ?? null,
                    postulantesWeb,
                    fechaUltimaPostulacionWeb: oportunidad.Empleo?.postulaciones[0]?.createdAt ?? null,
                    postulantesOtros,
                    totalPostulantes,
                    fechaInicioBusqueda: oportunidad.fechaInicioBusqueda,
                    fechaCierreBusqueda: oportunidad.fechaCierreBusqueda,
                    fechaEstimadaIngreso: oportunidad.fechaEstimadaIngreso,
                    estadoBusqueda: oportunidad.estadoBusqueda,
                    prioridad: oportunidad.prioridad,
                    observacionesEtapaNuevos: oportunidad.observacionesEtapaNuevos,
                    actualizadoPor: oportunidad.ActualizadoPor?.nombre ?? null,
                    updatedAt: oportunidad.updatedAt,
                },
                etapaPreseleccion: {
                    personasNecesarias: oportunidad.cantidadNecesaria,
                    postulantesWeb,
                    postulantesOtros,
                    totalPostulantes,
                    postulantesRevisados: oportunidad.postulantesRevisados,
                    postulantesPreseleccionados: oportunidad.postulantesPreseleccion,
                    postulantesDescartados: oportunidad.postulantesDescartados,
                    pendientesRevision: Math.max(totalPostulantes - oportunidad.postulantesRevisados, 0),
                    fechaInicioPreseleccion: oportunidad.fechaInicioPreseleccion,
                    fechaCierrePreseleccion: oportunidad.fechaCierrePreseleccion,
                    motivoDescarte: oportunidad.motivoDescarte,
                    motivoDescarteOtro: oportunidad.motivoDescarteOtro,
                    observacionesPreseleccion: oportunidad.observacionesPreseleccion,
                    updatedAt: oportunidad.updatedAt,
                },
                etapaEntrevista: {
                    personasNecesarias: oportunidad.cantidadNecesaria,
                    totalPostulantes,
                    postulantesPreseleccionados: oportunidad.postulantesPreseleccion,
                    entrevistasAgendadas: oportunidad.Entrevista?.entrevistasAgendadas ?? 0,
                    entrevistasRealizadas: oportunidad.Entrevista?.entrevistasRealizadas ?? 0,
                    noAsistieron: oportunidad.Entrevista?.noAsistieron ?? 0,
                    desistieronAntesEntrevista: oportunidad.Entrevista?.desistieronAntesEntrevista ?? 0,
                    aptos: oportunidad.Entrevista?.aptos ?? 0,
                    noAptos: oportunidad.Entrevista?.noAptos ?? 0,
                    motivosNoAptitud: (oportunidad.Entrevista?.MotivosNoAptitud ?? []).map((m) => ({
                        id: String(m.id),
                        motivos: m.motivos,
                        motivoPersonalizado: m.motivoPersonalizado,
                        cantidad: m.cantidad,
                    })),
                    fechaInicioEntrevistas: oportunidad.Entrevista?.fechaInicioEntrevistas ?? null,
                    fechaTerminoEntrevistas: oportunidad.Entrevista?.fechaTerminoEntrevistas ?? null,
                    modalidadEntrevista: oportunidad.Entrevista?.modalidadEntrevista ?? null,
                    responsableEntrevistaId: oportunidad.Entrevista?.responsableEntrevistaId
                        ? String(oportunidad.Entrevista.responsableEntrevistaId)
                        : null,
                    responsableEntrevistaNombre: oportunidad.Entrevista?.ResponsableEntrevista?.nombre ?? null,
                    nivelGeneralCandidatos: oportunidad.Entrevista?.nivelGeneralCandidatos ?? null,
                    fueNecesarioRepublicar: oportunidad.Entrevista?.fueNecesarioRepublicar ?? null,
                    motivoRepublicacion: oportunidad.Entrevista?.motivoRepublicacion ?? null,
                    motivoRepublicacionOtro: oportunidad.Entrevista?.motivoRepublicacionOtro ?? null,
                    observacionesEntrevista: oportunidad.Entrevista?.observacionesEntrevista ?? null,
                    updatedAt: oportunidad.Entrevista?.updatedAt ?? null,
                },
                etapaDocumentacion: serializarDatosDocumentacion(oportunidad),
                etapaContratados: serializarDatosContratados(oportunidad),
                fuentesExternas: oportunidad.FuentesExternas.map((f) => ({
                    id: String(f.id),
                    nombre: f.nombre,
                    cantidad: f.cantidad,
                })),
                historial: oportunidad.Historial.map((h) => ({
                    id: String(h.id),
                    tipo: h.tipo,
                    estadoAnterior: h.estadoAnterior,
                    estadoNuevo: h.estadoNuevo,
                    detalle: h.detalle,
                    usuarioNombre: h.Usuario.nombre,
                    createdAt: h.createdAt,
                })),
            },
        });
    }
    catch (error) {
        console.error("ERROR OBTENER OPORTUNIDAD:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al obtener la oportunidad",
        });
    }
};
exports.obtenerOportunidad = obtenerOportunidad;
const validarDatosGenerales = async (body) => {
    const { empresaId, cargoId, sucursalId, cantidadNecesaria, jornada, fechaInicio, fechaLimite, reclutadorResponsableId, observaciones } = body;
    const empresaIdNum = Number(empresaId);
    const cargoIdNum = Number(cargoId);
    const reclutadorIdNum = Number(reclutadorResponsableId);
    const cantidad = parseEnteroPositivo(cantidadNecesaria);
    const fechaInicioParsed = parseFecha(fechaInicio);
    if (Number.isNaN(empresaIdNum) || Number.isNaN(cargoIdNum) || Number.isNaN(reclutadorIdNum) || !cantidad || !fechaInicioParsed) {
        return {
            error: "Empresa, cargo, reclutador responsable, cantidad necesaria y fecha de inicio son obligatorios",
        };
    }
    if (!JORNADAS_OPORTUNIDAD.includes(String(jornada))) {
        return { error: "Jornada inválida", jornadasPermitidas: JORNADAS_OPORTUNIDAD };
    }
    const [empresa, cargo, reclutador] = await Promise.all([
        prisma_1.prisma.empresa.findUnique({ where: { id: empresaIdNum } }),
        prisma_1.prisma.cargo.findUnique({ where: { id: cargoIdNum } }),
        prisma_1.prisma.usuario.findUnique({ where: { id: reclutadorIdNum } }),
    ]);
    if (!empresa)
        return { error: "La empresa seleccionada no existe" };
    if (!cargo)
        return { error: "El cargo seleccionado no existe" };
    if (!reclutador)
        return { error: "El reclutador responsable seleccionado no existe" };
    let sucursalIdNum = null;
    if (sucursalId) {
        sucursalIdNum = Number(sucursalId);
        const sucursal = await prisma_1.prisma.sucursal.findUnique({ where: { id: sucursalIdNum } });
        if (!sucursal || sucursal.empresaId !== empresaIdNum) {
            return { error: "La sucursal seleccionada no existe o no pertenece a la empresa indicada" };
        }
    }
    return {
        data: {
            empresaId: empresaIdNum,
            cargoId: cargoIdNum,
            sucursalId: sucursalIdNum,
            cantidadNecesaria: cantidad,
            jornada: String(jornada),
            fechaInicio: fechaInicioParsed,
            fechaLimite: parseFecha(fechaLimite),
            reclutadorResponsableId: reclutadorIdNum,
            observaciones: limpiarTexto(observaciones),
        },
    };
};
const crearOportunidad = async (req, res) => {
    try {
        const validacion = await validarDatosGenerales(req.body);
        if (validacion.error || !validacion.data) {
            return res.status(400).json({ ok: false, message: validacion.error, jornadasPermitidas: validacion.jornadasPermitidas });
        }
        const oportunidad = await prisma_1.prisma.oportunidadReclutamiento.create({
            data: validacion.data,
            include: INCLUDE_OPORTUNIDAD,
        });
        await registrarHistorial({
            oportunidadId: oportunidad.id,
            tipo: "CREACION",
            usuarioId: req.usuario?.id,
            estadoNuevo: oportunidad.estado,
        });
        return res.status(201).json({
            ok: true,
            message: "Oportunidad creada correctamente",
            oportunidad: serializarOportunidad(oportunidad),
        });
    }
    catch (error) {
        console.error("ERROR CREAR OPORTUNIDAD:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al crear la oportunidad",
        });
    }
};
exports.crearOportunidad = crearOportunidad;
const actualizarOportunidad = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ ok: false, message: "ID de oportunidad inválido" });
        }
        const existente = await prisma_1.prisma.oportunidadReclutamiento.findUnique({ where: { id } });
        if (!existente) {
            return res.status(404).json({ ok: false, message: "Oportunidad no encontrada" });
        }
        const validacion = await validarDatosGenerales(req.body);
        if (validacion.error || !validacion.data) {
            return res.status(400).json({ ok: false, message: validacion.error, jornadasPermitidas: validacion.jornadasPermitidas });
        }
        const oportunidad = await prisma_1.prisma.oportunidadReclutamiento.update({
            where: { id },
            data: validacion.data,
            include: INCLUDE_OPORTUNIDAD,
        });
        let detalle = null;
        if (existente.reclutadorResponsableId !== oportunidad.reclutadorResponsableId) {
            const reclutadorAnterior = await prisma_1.prisma.usuario.findUnique({ where: { id: existente.reclutadorResponsableId } });
            const reclutadorNuevo = oportunidad.ReclutadorResponsable.nombre;
            detalle = `Reasignó el reclutador de ${reclutadorAnterior?.nombre ?? "—"} a ${reclutadorNuevo}`;
        }
        await registrarHistorial({
            oportunidadId: oportunidad.id,
            tipo: "EDICION_GENERAL",
            usuarioId: req.usuario?.id,
            detalle,
        });
        return res.json({
            ok: true,
            message: "Oportunidad actualizada correctamente",
            oportunidad: serializarOportunidad(oportunidad),
        });
    }
    catch (error) {
        console.error("ERROR ACTUALIZAR OPORTUNIDAD:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al actualizar la oportunidad",
        });
    }
};
exports.actualizarOportunidad = actualizarOportunidad;
const ESTADOS_OPORTUNIDAD_VALIDOS = [
    "NUEVOS",
    "PRESELECCION",
    "ENTREVISTA",
    "DOCUMENTACION",
    "CONTRATADOS",
];
const actualizarEstadoOportunidad = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ ok: false, message: "ID de oportunidad inválido" });
        }
        const existente = await prisma_1.prisma.oportunidadReclutamiento.findUnique({ where: { id } });
        if (!existente) {
            return res.status(404).json({ ok: false, message: "Oportunidad no encontrada" });
        }
        const { estado } = req.body;
        if (!ESTADOS_OPORTUNIDAD_VALIDOS.includes(String(estado))) {
            return res.status(400).json({
                ok: false,
                message: "Etapa inválida",
                estadosPermitidos: ESTADOS_OPORTUNIDAD_VALIDOS,
            });
        }
        const estadoNuevo = String(estado);
        if (existente.estado === estadoNuevo) {
            return res.json({ ok: true, message: "Sin cambios", oportunidadId: String(existente.id) });
        }
        const oportunidad = await prisma_1.prisma.oportunidadReclutamiento.update({
            where: { id },
            data: { estado: estadoNuevo },
        });
        await registrarHistorial({
            oportunidadId: oportunidad.id,
            tipo: "CAMBIO_ESTADO",
            usuarioId: req.usuario?.id,
            estadoAnterior: existente.estado,
            estadoNuevo: oportunidad.estado,
        });
        return res.json({
            ok: true,
            message: "Etapa actualizada correctamente",
            oportunidadId: String(oportunidad.id),
            estado: oportunidad.estado,
        });
    }
    catch (error) {
        console.error("ERROR ACTUALIZAR ESTADO OPORTUNIDAD:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al actualizar la etapa de la oportunidad",
        });
    }
};
exports.actualizarEstadoOportunidad = actualizarEstadoOportunidad;
/**
 * Igual que en el Funnel Comercial: "perdida" es un flag independiente de
 * `estado`, no un movimiento de columna — la oportunidad se queda donde
 * estaba, solo queda marcada.
 */
const marcarOportunidadPerdida = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ ok: false, message: "ID de oportunidad inválido" });
        }
        const existente = await prisma_1.prisma.oportunidadReclutamiento.findUnique({ where: { id } });
        if (!existente) {
            return res.status(404).json({ ok: false, message: "Oportunidad no encontrada" });
        }
        if (existente.estado === "CONTRATADOS") {
            return res.status(400).json({ ok: false, message: "La oportunidad ya está en Contratados, no puede marcarse como perdida" });
        }
        const motivo = limpiarTexto(req.body.motivo);
        if (!motivo) {
            return res.status(400).json({ ok: false, message: "Debes indicar el motivo de la pérdida" });
        }
        const oportunidad = await prisma_1.prisma.oportunidadReclutamiento.update({
            where: { id },
            data: { perdida: true, motivoPerdida: motivo },
        });
        await registrarHistorial({ oportunidadId: oportunidad.id, tipo: "MARCADA_PERDIDA", usuarioId: req.usuario?.id, detalle: motivo });
        return res.json({ ok: true, message: "Oportunidad marcada como perdida correctamente", oportunidadId: String(oportunidad.id) });
    }
    catch (error) {
        console.error("ERROR MARCAR OPORTUNIDAD PERDIDA:", error);
        return res.status(500).json({ ok: false, message: "Error al marcar la oportunidad como perdida" });
    }
};
exports.marcarOportunidadPerdida = marcarOportunidadPerdida;
/** Reagenda `fechaLimite` (mismo campo que ya existe, sin duplicarlo) y deja marcada `postergada`; `estado` no cambia. */
const postergarOportunidad = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ ok: false, message: "ID de oportunidad inválido" });
        }
        const existente = await prisma_1.prisma.oportunidadReclutamiento.findUnique({ where: { id } });
        if (!existente) {
            return res.status(404).json({ ok: false, message: "Oportunidad no encontrada" });
        }
        const nuevaFecha = req.body.nuevaFecha ? new Date(String(req.body.nuevaFecha)) : null;
        if (!nuevaFecha || Number.isNaN(nuevaFecha.getTime())) {
            return res.status(400).json({ ok: false, message: "La nueva fecha es obligatoria" });
        }
        const motivo = limpiarTexto(req.body.motivo);
        const oportunidad = await prisma_1.prisma.oportunidadReclutamiento.update({
            where: { id },
            data: { postergada: true, motivoPostergacion: motivo, fechaLimite: nuevaFecha },
        });
        await registrarHistorial({ oportunidadId: oportunidad.id, tipo: "POSTERGADA", usuarioId: req.usuario?.id, detalle: motivo });
        return res.json({ ok: true, message: "Oportunidad postergada correctamente", oportunidadId: String(oportunidad.id) });
    }
    catch (error) {
        console.error("ERROR POSTERGAR OPORTUNIDAD:", error);
        return res.status(500).json({ ok: false, message: "Error al postergar la oportunidad" });
    }
};
exports.postergarOportunidad = postergarOportunidad;
const actualizarEtapaNuevos = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ ok: false, message: "ID de oportunidad inválido" });
        }
        const existente = await prisma_1.prisma.oportunidadReclutamiento.findUnique({ where: { id } });
        if (!existente) {
            return res.status(404).json({ ok: false, message: "Oportunidad no encontrada" });
        }
        const { empleoId, fechaInicioBusqueda, fechaCierreBusqueda, fechaEstimadaIngreso, estadoBusqueda, prioridad, observacionesEtapaNuevos } = req.body;
        let empleoIdNum = null;
        if (empleoId) {
            empleoIdNum = Number(empleoId);
            const empleo = await prisma_1.prisma.empleo.findUnique({ where: { id: empleoIdNum } });
            if (!empleo) {
                return res.status(400).json({ ok: false, message: "La oferta de empleo seleccionada no existe" });
            }
        }
        if (estadoBusqueda && !ESTADOS_BUSQUEDA.includes(String(estadoBusqueda))) {
            return res.status(400).json({ ok: false, message: "Estado de búsqueda inválido", estadosPermitidos: ESTADOS_BUSQUEDA });
        }
        if (prioridad && !PRIORIDADES_OPORTUNIDAD.includes(String(prioridad))) {
            return res.status(400).json({ ok: false, message: "Prioridad inválida", prioridadesPermitidas: PRIORIDADES_OPORTUNIDAD });
        }
        const oportunidad = await prisma_1.prisma.oportunidadReclutamiento.update({
            where: { id },
            data: {
                empleoId: empleoIdNum,
                fechaInicioBusqueda: parseFecha(fechaInicioBusqueda),
                fechaCierreBusqueda: parseFecha(fechaCierreBusqueda),
                fechaEstimadaIngreso: parseFecha(fechaEstimadaIngreso),
                estadoBusqueda: estadoBusqueda ? String(estadoBusqueda) : null,
                prioridad: prioridad ? String(prioridad) : null,
                observacionesEtapaNuevos: limpiarTexto(observacionesEtapaNuevos),
                actualizadoPorId: req.usuario?.id ?? null,
            },
        });
        await registrarHistorial({
            oportunidadId: oportunidad.id,
            tipo: "EDICION_ETAPA_NUEVOS",
            usuarioId: req.usuario?.id,
        });
        return res.json({
            ok: true,
            message: "Etapa Nuevos actualizada correctamente",
            oportunidadId: String(oportunidad.id),
        });
    }
    catch (error) {
        console.error("ERROR ACTUALIZAR ETAPA NUEVOS:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al actualizar la etapa Nuevos",
        });
    }
};
exports.actualizarEtapaNuevos = actualizarEtapaNuevos;
const actualizarEtapaPreseleccion = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ ok: false, message: "ID de oportunidad invÃ¡lido" });
        }
        const existente = await prisma_1.prisma.oportunidadReclutamiento.findUnique({
            where: { id },
            include: {
                Empleo: { select: { _count: { select: { postulaciones: true } } } },
                FuentesExternas: { select: { cantidad: true } },
            },
        });
        if (!existente) {
            return res.status(404).json({ ok: false, message: "Oportunidad no encontrada" });
        }
        const postulantesWeb = existente.Empleo?._count.postulaciones ?? 0;
        const postulantesOtros = calcularPostulantesOtros(existente.FuentesExternas);
        const totalPostulantes = postulantesWeb + postulantesOtros;
        const revisados = parseEnteroNoNegativo(req.body.postulantesRevisados);
        const preseleccionados = parseEnteroNoNegativo(req.body.postulantesPreseleccionados);
        const descartados = parseEnteroNoNegativo(req.body.postulantesDescartados);
        if (revisados === null || preseleccionados === null || descartados === null) {
            return res.status(400).json({ ok: false, message: "Los postulantes deben ser nÃºmeros enteros mayores o iguales a cero" });
        }
        if (revisados > totalPostulantes) {
            return res.status(400).json({ ok: false, message: "Los postulantes revisados no pueden superar el total de postulantes" });
        }
        if (preseleccionados > revisados) {
            return res.status(400).json({ ok: false, message: "Los postulantes preseleccionados no pueden superar los revisados" });
        }
        if (descartados > revisados) {
            return res.status(400).json({ ok: false, message: "Los postulantes descartados no pueden superar los revisados" });
        }
        if (preseleccionados + descartados > revisados) {
            return res.status(400).json({ ok: false, message: "Preseleccionados y descartados no pueden superar los revisados" });
        }
        const motivoDescarte = limpiarTexto(req.body.motivoDescarte);
        let motivoDescarteOtro = limpiarTexto(req.body.motivoDescarteOtro);
        if (descartados > 0 && !motivoDescarte) {
            return res.status(400).json({ ok: false, message: "El motivo principal de descarte es obligatorio si hay postulantes descartados" });
        }
        if (motivoDescarte && !MOTIVOS_DESCARTE_PRESELECCION.includes(motivoDescarte)) {
            return res.status(400).json({ ok: false, message: "Motivo principal de descarte inválido" });
        }
        if (descartados > 0 && motivoDescarte === "Otro" && !motivoDescarteOtro) {
            return res.status(400).json({ ok: false, message: "Debe especificar el motivo de descarte cuando selecciona Otro" });
        }
        if (descartados === 0) {
            motivoDescarteOtro = null;
        }
        else if (motivoDescarte !== "Otro") {
            motivoDescarteOtro = null;
        }
        const oportunidad = await prisma_1.prisma.oportunidadReclutamiento.update({
            where: { id },
            data: {
                postulantesRevisados: revisados,
                postulantesPreseleccion: preseleccionados,
                postulantesDescartados: descartados,
                fechaInicioPreseleccion: parseFecha(req.body.fechaInicioPreseleccion),
                fechaCierrePreseleccion: parseFecha(req.body.fechaCierrePreseleccion),
                motivoDescarte: descartados > 0 ? motivoDescarte : null,
                motivoDescarteOtro,
                observacionesPreseleccion: limpiarTexto(req.body.observacionesPreseleccion),
                actualizadoPorId: req.usuario?.id ?? null,
            },
        });
        await registrarHistorial({
            oportunidadId: oportunidad.id,
            tipo: "EDICION_ETAPA_PRESELECCION",
            usuarioId: req.usuario?.id,
        });
        return res.json({
            ok: true,
            message: "Etapa PreselecciÃ³n actualizada correctamente",
            oportunidadId: String(oportunidad.id),
            pendientesRevision: Math.max(totalPostulantes - revisados, 0),
        });
    }
    catch (error) {
        console.error("ERROR ACTUALIZAR ETAPA PRESELECCION:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al actualizar la etapa PreselecciÃ³n",
        });
    }
};
exports.actualizarEtapaPreseleccion = actualizarEtapaPreseleccion;
const actualizarEtapaEntrevista = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ ok: false, message: "ID de oportunidad inválido" });
        }
        const existente = await prisma_1.prisma.oportunidadReclutamiento.findUnique({ where: { id } });
        if (!existente) {
            return res.status(404).json({ ok: false, message: "Oportunidad no encontrada" });
        }
        const entrevistasAgendadas = parseEnteroNoNegativo(req.body.entrevistasAgendadas);
        const entrevistasRealizadas = parseEnteroNoNegativo(req.body.entrevistasRealizadas);
        const noAsistieron = parseEnteroNoNegativo(req.body.noAsistieron);
        const desistieronAntesEntrevista = parseEnteroNoNegativo(req.body.desistieronAntesEntrevista);
        const aptos = parseEnteroNoNegativo(req.body.aptos);
        const noAptos = parseEnteroNoNegativo(req.body.noAptos);
        if (entrevistasAgendadas === null ||
            entrevistasRealizadas === null ||
            noAsistieron === null ||
            desistieronAntesEntrevista === null ||
            aptos === null ||
            noAptos === null) {
            return res.status(400).json({ ok: false, message: "Los conteos deben ser enteros mayores o iguales a cero" });
        }
        if (entrevistasAgendadas > existente.postulantesPreseleccion) {
            return res.status(400).json({ ok: false, message: "Entrevistas agendadas no puede superar los preseleccionados" });
        }
        if (entrevistasAgendadas !== entrevistasRealizadas + noAsistieron + desistieronAntesEntrevista) {
            return res.status(400).json({
                ok: false,
                message: "Entrevistas agendadas debe ser igual a la suma de realizadas, no asistieron y desistieron",
            });
        }
        if (aptos > entrevistasRealizadas) {
            return res.status(400).json({ ok: false, message: "Aptos no puede superar las entrevistas realizadas" });
        }
        if (noAptos > entrevistasRealizadas) {
            return res.status(400).json({ ok: false, message: "No aptos no puede superar las entrevistas realizadas" });
        }
        if (aptos + noAptos > entrevistasRealizadas) {
            return res.status(400).json({ ok: false, message: "Aptos + no aptos no puede superar las entrevistas realizadas" });
        }
        const motivosNoAptitudRaw = Array.isArray(req.body.motivosNoAptitud) ? req.body.motivosNoAptitud : [];
        const motivosNoAptitud = [];
        const clavesVistas = new Set();
        for (const fila of motivosNoAptitudRaw) {
            const motivosLimpios = Array.isArray(fila?.motivos)
                ? fila.motivos
                    .map((m) => limpiarTexto(m))
                    .filter((m) => !!m)
                : [];
            const motivosFila = Array.from(new Set(motivosLimpios));
            const motivoPersonalizado = limpiarTexto(fila?.motivoPersonalizado);
            const cantidad = parseEnteroNoNegativo(fila?.cantidad);
            if (motivosFila.length === 0) {
                return res.status(400).json({ ok: false, message: "Cada fila debe tener al menos un motivo de descarte" });
            }
            if (motivosFila.some((m) => !MOTIVOS_NO_APTITUD_ENTREVISTA.includes(m))) {
                return res.status(400).json({ ok: false, message: "Hay un motivo de descarte inválido" });
            }
            if (cantidad === null || cantidad === 0) {
                return res.status(400).json({ ok: false, message: "La cantidad de cada motivo de descarte debe ser un entero mayor a cero" });
            }
            if (motivosFila.includes("Otro") && !motivoPersonalizado) {
                return res.status(400).json({ ok: false, message: "Debe especificar el motivo cuando selecciona Otro" });
            }
            const clave = normalizarMotivoNoAptitud(motivosFila, motivoPersonalizado);
            if (clavesVistas.has(clave)) {
                return res.status(400).json({ ok: false, message: "No puede repetir la misma combinación de motivos de descarte" });
            }
            clavesVistas.add(clave);
            motivosNoAptitud.push({
                motivos: motivosFila,
                motivoPersonalizado: motivosFila.includes("Otro") ? motivoPersonalizado : null,
                motivoNormalizado: clave,
                cantidad,
            });
        }
        const sumaMotivosNoAptitud = motivosNoAptitud.reduce((acc, m) => acc + m.cantidad, 0);
        if (sumaMotivosNoAptitud !== noAptos) {
            return res.status(400).json({
                ok: false,
                message: `La suma de las cantidades de los motivos de descarte (${sumaMotivosNoAptitud}) debe ser igual a "No aprobaron entrevista" (${noAptos})`,
            });
        }
        const fechaInicioEntrevistas = parseFecha(req.body.fechaInicioEntrevistas);
        const fechaTerminoEntrevistas = parseFecha(req.body.fechaTerminoEntrevistas);
        if (fechaInicioEntrevistas && fechaTerminoEntrevistas && fechaTerminoEntrevistas < fechaInicioEntrevistas) {
            return res.status(400).json({ ok: false, message: "La fecha de término no puede ser anterior a la fecha de inicio" });
        }
        const modalidadEntrevista = limpiarTexto(req.body.modalidadEntrevista);
        if (modalidadEntrevista && !MODALIDADES_ENTREVISTA.includes(modalidadEntrevista)) {
            return res.status(400).json({ ok: false, message: "Modalidad de entrevista inválida" });
        }
        const nivelGeneralCandidatos = limpiarTexto(req.body.nivelGeneralCandidatos);
        if (nivelGeneralCandidatos && !NIVELES_CANDIDATOS_ENTREVISTA.includes(nivelGeneralCandidatos)) {
            return res.status(400).json({ ok: false, message: "Nivel general de candidatos inválido" });
        }
        let responsableEntrevistaId = null;
        if (req.body.responsableEntrevistaId) {
            responsableEntrevistaId = Number(req.body.responsableEntrevistaId);
            if (Number.isNaN(responsableEntrevistaId)) {
                return res.status(400).json({ ok: false, message: "Responsable de entrevista inválido" });
            }
            const responsable = await prisma_1.prisma.usuario.findUnique({ where: { id: responsableEntrevistaId } });
            if (!responsable) {
                return res.status(400).json({ ok: false, message: "El responsable de entrevista seleccionado no existe" });
            }
        }
        const fueNecesarioRepublicar = parseBooleanOpcional(req.body.fueNecesarioRepublicar);
        const motivoRepublicacion = limpiarTexto(req.body.motivoRepublicacion);
        let motivoRepublicacionOtro = limpiarTexto(req.body.motivoRepublicacionOtro);
        if (fueNecesarioRepublicar === true && !motivoRepublicacion) {
            return res.status(400).json({ ok: false, message: "El motivo de nueva publicación es obligatorio" });
        }
        if (motivoRepublicacion && !MOTIVOS_REPUBLICACION_ENTREVISTA.includes(motivoRepublicacion)) {
            return res.status(400).json({ ok: false, message: "Motivo de nueva publicación inválido" });
        }
        if (fueNecesarioRepublicar === true && motivoRepublicacion === "Otro" && !motivoRepublicacionOtro) {
            return res.status(400).json({ ok: false, message: "Debe especificar el motivo de nueva publicación" });
        }
        if (fueNecesarioRepublicar !== true || motivoRepublicacion !== "Otro") {
            motivoRepublicacionOtro = null;
        }
        const data = {
            entrevistasAgendadas,
            entrevistasRealizadas,
            noAsistieron,
            desistieronAntesEntrevista,
            aptos,
            noAptos,
            fechaInicioEntrevistas,
            fechaTerminoEntrevistas,
            modalidadEntrevista,
            responsableEntrevistaId,
            nivelGeneralCandidatos,
            fueNecesarioRepublicar,
            motivoRepublicacion: fueNecesarioRepublicar === true ? motivoRepublicacion : null,
            motivoRepublicacionOtro,
            observacionesEntrevista: limpiarTexto(req.body.observacionesEntrevista),
        };
        await prisma_1.prisma.$transaction(async (tx) => {
            const entrevista = await tx.oportunidadEntrevista.upsert({
                where: { oportunidadId: id },
                create: { oportunidadId: id, ...data },
                update: data,
            });
            await tx.oportunidadEntrevistaMotivoNoAptitud.deleteMany({ where: { entrevistaId: entrevista.id } });
            if (motivosNoAptitud.length > 0) {
                await tx.oportunidadEntrevistaMotivoNoAptitud.createMany({
                    data: motivosNoAptitud.map((m) => ({
                        entrevistaId: entrevista.id,
                        motivos: m.motivos,
                        motivoPersonalizado: m.motivoPersonalizado,
                        motivoNormalizado: m.motivoNormalizado,
                        cantidad: m.cantidad,
                    })),
                });
            }
        });
        await registrarHistorial({
            oportunidadId: id,
            tipo: "EDICION_ETAPA_ENTREVISTA",
            usuarioId: req.usuario?.id,
        });
        return res.json({
            ok: true,
            message: "Etapa Entrevista actualizada correctamente",
            oportunidadId: String(id),
        });
    }
    catch (error) {
        console.error("ERROR ACTUALIZAR ETAPA ENTREVISTA:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al actualizar la etapa Entrevista",
        });
    }
};
exports.actualizarEtapaEntrevista = actualizarEtapaEntrevista;
const buscarOportunidadParaDocumentacion = async (id) => prisma_1.prisma.oportunidadReclutamiento.findUnique({
    where: { id },
    include: {
        Empresa: { select: { nombre: true } },
        Cargo: { select: { nombre: true } },
        Entrevista: { select: { aptos: true } },
        Documentacion: true,
        DocumentosRequeridos: { orderBy: { createdAt: "asc" } },
    },
});
const validarEtapaDocumentacion = (estado) => estado === "DOCUMENTACION" || estado === "CONTRATADOS";
const obtenerEtapaDocumentacion = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id))
            return res.status(400).json({ ok: false, message: "ID de oportunidad invÃ¡lido" });
        const oportunidad = await buscarOportunidadParaDocumentacion(id);
        if (!oportunidad)
            return res.status(404).json({ ok: false, message: "Oportunidad no encontrada" });
        return res.json({ ok: true, etapaDocumentacion: serializarDatosDocumentacion(oportunidad) });
    }
    catch (error) {
        console.error("ERROR OBTENER ETAPA DOCUMENTACION:", error);
        return res.status(500).json({ ok: false, message: "Error al obtener la etapa DocumentaciÃ³n" });
    }
};
exports.obtenerEtapaDocumentacion = obtenerEtapaDocumentacion;
const actualizarEtapaDocumentacion = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id))
            return res.status(400).json({ ok: false, message: "ID de oportunidad invÃ¡lido" });
        const oportunidad = await prisma_1.prisma.oportunidadReclutamiento.findUnique({
            where: { id },
            include: { Entrevista: { select: { aptos: true } } },
        });
        if (!oportunidad)
            return res.status(404).json({ ok: false, message: "Oportunidad no encontrada" });
        if (!validarEtapaDocumentacion(oportunidad.estado)) {
            return res.status(400).json({ ok: false, message: "La oportunidad debe estar en DocumentaciÃ³n para rellenar esta etapa" });
        }
        const completa = parseEnteroNoNegativo(req.body.documentacionCompleta);
        if (completa === null) {
            return res.status(400).json({ ok: false, message: "Personas con documentaciÃ³n completa debe ser un entero mayor o igual a cero" });
        }
        const seleccionados = oportunidad.Entrevista?.aptos ?? 0;
        if (completa > seleccionados) {
            return res.status(400).json({ ok: false, message: "Personas con documentaciÃ³n completa no puede superar las personas seleccionadas" });
        }
        await prisma_1.prisma.datosEtapaDocumentacion.upsert({
            where: { oportunidadId: id },
            create: {
                oportunidadId: id,
                documentacionCompleta: completa,
                fechaInicioDocumentacion: parseFecha(req.body.fechaInicioDocumentacion),
                fechaEstimadaDocumentacionCompleta: parseFecha(req.body.fechaEstimadaDocumentacionCompleta),
                fechaRealDocumentacionCompleta: parseFecha(req.body.fechaRealDocumentacionCompleta),
                observacionesDocumentacion: limpiarTexto(req.body.observacionesDocumentacion),
            },
            update: {
                documentacionCompleta: completa,
                fechaInicioDocumentacion: parseFecha(req.body.fechaInicioDocumentacion),
                fechaEstimadaDocumentacionCompleta: parseFecha(req.body.fechaEstimadaDocumentacionCompleta),
                fechaRealDocumentacionCompleta: parseFecha(req.body.fechaRealDocumentacionCompleta),
                observacionesDocumentacion: limpiarTexto(req.body.observacionesDocumentacion),
            },
        });
        await registrarHistorial({ oportunidadId: id, tipo: "EDICION_ETAPA_DOCUMENTACION", usuarioId: req.usuario?.id });
        return res.json({ ok: true, message: "Etapa DocumentaciÃ³n actualizada correctamente", oportunidadId: String(id) });
    }
    catch (error) {
        console.error("ERROR ACTUALIZAR ETAPA DOCUMENTACION:", error);
        return res.status(500).json({ ok: false, message: "Error al actualizar la etapa DocumentaciÃ³n" });
    }
};
exports.actualizarEtapaDocumentacion = actualizarEtapaDocumentacion;
const buscarOportunidadParaContratados = async (id) => prisma_1.prisma.oportunidadReclutamiento.findUnique({
    where: { id },
    include: {
        Empresa: { select: { nombre: true } },
        Cargo: { select: { nombre: true } },
        Entrevista: { select: { aptos: true } },
        Documentacion: { select: { documentacionCompleta: true } },
        Contratados: { include: { MotivosNoIngreso: { orderBy: { createdAt: "asc" } } } },
    },
});
const validarEtapaContratados = (estado) => estado === "CONTRATADOS";
const obtenerEtapaContratados = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id))
            return res.status(400).json({ ok: false, message: "ID de oportunidad inválido" });
        const oportunidad = await buscarOportunidadParaContratados(id);
        if (!oportunidad)
            return res.status(404).json({ ok: false, message: "Oportunidad no encontrada" });
        return res.json({ ok: true, etapaContratados: serializarDatosContratados(oportunidad) });
    }
    catch (error) {
        console.error("ERROR OBTENER ETAPA CONTRATADOS:", error);
        return res.status(500).json({ ok: false, message: "Error al obtener la etapa Contratados" });
    }
};
exports.obtenerEtapaContratados = obtenerEtapaContratados;
const actualizarEtapaContratados = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id))
            return res.status(400).json({ ok: false, message: "ID de oportunidad inválido" });
        const oportunidad = await prisma_1.prisma.oportunidadReclutamiento.findUnique({
            where: { id },
            include: { Entrevista: { select: { aptos: true } } },
        });
        if (!oportunidad)
            return res.status(404).json({ ok: false, message: "Oportunidad no encontrada" });
        if (!validarEtapaContratados(oportunidad.estado)) {
            return res.status(400).json({ ok: false, message: "La oportunidad debe estar en Contratados para rellenar esta etapa" });
        }
        const personasContratadas = parseEnteroNoNegativo(req.body.personasContratadas);
        const personasNoIngresaron = parseEnteroNoNegativo(req.body.personasNoIngresaron);
        if (personasContratadas === null || personasNoIngresaron === null) {
            return res.status(400).json({ ok: false, message: "Personas contratadas y personas que no ingresaron deben ser enteros mayores o iguales a cero" });
        }
        const personasSeleccionadas = oportunidad.Entrevista?.aptos ?? 0;
        if (personasContratadas + personasNoIngresaron !== personasSeleccionadas) {
            return res.status(400).json({
                ok: false,
                message: `Personas contratadas (${personasContratadas}) + personas que no ingresaron (${personasNoIngresaron}) debe ser igual a personas seleccionadas (${personasSeleccionadas})`,
            });
        }
        const motivosNoIngresoRaw = Array.isArray(req.body.motivosNoIngreso) ? req.body.motivosNoIngreso : [];
        const motivosNoIngreso = [];
        const clavesVistas = new Set();
        for (const fila of motivosNoIngresoRaw) {
            const motivo = limpiarTexto(fila?.motivo);
            if (!motivo || !MOTIVOS_NO_INGRESO_CONTRATADOS.includes(motivo)) {
                return res.status(400).json({ ok: false, message: "Hay un motivo de no ingreso inválido" });
            }
            const motivoOtro = limpiarTexto(fila?.motivoOtro);
            if (motivo === "Otro" && !motivoOtro) {
                return res.status(400).json({ ok: false, message: "Debe especificar el motivo cuando selecciona Otro" });
            }
            const cantidad = parseEnteroNoNegativo(fila?.cantidad);
            if (cantidad === null || cantidad === 0) {
                return res.status(400).json({ ok: false, message: "La cantidad de cada motivo de no ingreso debe ser un entero mayor a cero" });
            }
            const motivoNormalizado = normalizarMotivoNoIngreso(motivo, motivo === "Otro" ? motivoOtro : null);
            if (clavesVistas.has(motivoNormalizado)) {
                return res.status(400).json({ ok: false, message: "No puede repetir el mismo motivo de no ingreso" });
            }
            clavesVistas.add(motivoNormalizado);
            motivosNoIngreso.push({
                motivo,
                motivoOtro: motivo === "Otro" ? motivoOtro : null,
                motivoNormalizado,
                cantidad,
            });
        }
        const sumaMotivosNoIngreso = motivosNoIngreso.reduce((acc, m) => acc + m.cantidad, 0);
        if (sumaMotivosNoIngreso !== personasNoIngresaron) {
            return res.status(400).json({
                ok: false,
                message: `La suma de los motivos de no ingreso (${sumaMotivosNoIngreso}) debe ser igual a "Personas que no ingresaron" (${personasNoIngresaron})`,
            });
        }
        const fechaPrimerIngreso = parseFecha(req.body.fechaPrimerIngreso);
        const fechaCierreProceso = parseFecha(req.body.fechaCierreProceso);
        if (fechaPrimerIngreso && fechaCierreProceso && fechaCierreProceso < fechaPrimerIngreso) {
            return res.status(400).json({ ok: false, message: "La fecha de cierre del proceso no puede ser anterior a la fecha de primer ingreso" });
        }
        const data = {
            personasContratadas,
            personasNoIngresaron,
            fechaPrimerIngreso,
            fechaCierreProceso,
            observacionesContratados: limpiarTexto(req.body.observacionesContratados),
        };
        await prisma_1.prisma.$transaction(async (tx) => {
            const contratados = await tx.datosEtapaContratados.upsert({
                where: { oportunidadId: id },
                create: { oportunidadId: id, ...data },
                update: data,
            });
            await tx.oportunidadContratadosMotivoNoIngreso.deleteMany({ where: { contratadosId: contratados.id } });
            if (motivosNoIngreso.length > 0) {
                await tx.oportunidadContratadosMotivoNoIngreso.createMany({
                    data: motivosNoIngreso.map((m) => ({
                        contratadosId: contratados.id,
                        motivo: m.motivo,
                        motivoOtro: m.motivoOtro,
                        motivoNormalizado: m.motivoNormalizado,
                        cantidad: m.cantidad,
                    })),
                });
            }
        });
        await registrarHistorial({ oportunidadId: id, tipo: "EDICION_ETAPA_CONTRATADOS", usuarioId: req.usuario?.id });
        return res.json({ ok: true, message: "Etapa Contratados actualizada correctamente", oportunidadId: String(id) });
    }
    catch (error) {
        console.error("ERROR ACTUALIZAR ETAPA CONTRATADOS:", error);
        return res.status(500).json({ ok: false, message: "Error al actualizar la etapa Contratados" });
    }
};
exports.actualizarEtapaContratados = actualizarEtapaContratados;
const serializarDocumentoRequerido = (documento) => ({
    id: String(documento.id),
    nombre: documento.nombre,
    tipoDocumento: documento.tipoDocumento,
    obligatorio: documento.obligatorio,
    cantidadEntregada: documento.cantidadEntregada,
    observaciones: documento.observaciones,
});
const resolverDocumentoRequeridoPayload = (body) => {
    const tipoDocumento = limpiarTexto(body.tipoDocumento);
    if (!tipoDocumento || !TIPOS_DOCUMENTO_REQUERIDO.includes(tipoDocumento)) {
        return { error: "Tipo de documento invÃ¡lido" };
    }
    const nombreOtro = limpiarTexto(body.nombreOtro ?? body.nombre);
    const nombre = tipoDocumento === "Otro" ? nombreOtro : tipoDocumento;
    if (!nombre)
        return { error: "Debe indicar el nombre del documento cuando selecciona Otro" };
    const obligatorio = parseBooleanOpcional(body.obligatorio);
    const cantidadEntregada = parseEnteroNoNegativo(body.cantidadEntregada);
    if (cantidadEntregada === null) {
        return { error: "Personas que lo entregaron debe ser un entero mayor o igual a cero" };
    }
    return {
        data: {
            nombre,
            tipoDocumento,
            nombreNormalizado: normalizarNombreDocumento(nombre),
            obligatorio: obligatorio ?? true,
            cantidadEntregada,
            observaciones: limpiarTexto(body.observaciones),
        },
    };
};
const crearDocumentoRequerido = async (req, res) => {
    try {
        const oportunidadId = Number(req.params.id);
        if (Number.isNaN(oportunidadId))
            return res.status(400).json({ ok: false, message: "ID de oportunidad invÃ¡lido" });
        const oportunidad = await prisma_1.prisma.oportunidadReclutamiento.findUnique({
            where: { id: oportunidadId },
            include: { Entrevista: { select: { aptos: true } } },
        });
        if (!oportunidad)
            return res.status(404).json({ ok: false, message: "Oportunidad no encontrada" });
        const payload = resolverDocumentoRequeridoPayload(req.body);
        if (payload.error || !payload.data)
            return res.status(400).json({ ok: false, message: payload.error });
        if (payload.data.cantidadEntregada > (oportunidad.Entrevista?.aptos ?? 0)) {
            return res.status(400).json({ ok: false, message: "Personas que lo entregaron no puede superar las personas seleccionadas" });
        }
        const documento = await prisma_1.prisma.documentoRequeridoOportunidad.create({
            data: {
                oportunidadId,
                ...payload.data,
            },
        });
        return res.status(201).json({ ok: true, message: "Documento requerido agregado correctamente", documento: serializarDocumentoRequerido(documento) });
    }
    catch (error) {
        if (error?.code === "P2002") {
            return res.status(400).json({ ok: false, message: "Ya existe un documento requerido con ese nombre" });
        }
        console.error("ERROR CREAR DOCUMENTO REQUERIDO:", error);
        return res.status(500).json({ ok: false, message: "Error al agregar el documento requerido" });
    }
};
exports.crearDocumentoRequerido = crearDocumentoRequerido;
const actualizarDocumentoRequerido = async (req, res) => {
    try {
        const oportunidadId = Number(req.params.id);
        const documentoId = Number(req.params.documentoId);
        if (Number.isNaN(oportunidadId) || Number.isNaN(documentoId))
            return res.status(400).json({ ok: false, message: "ID invÃ¡lido" });
        const existente = await prisma_1.prisma.documentoRequeridoOportunidad.findUnique({ where: { id: documentoId } });
        if (!existente || existente.oportunidadId !== oportunidadId) {
            return res.status(404).json({ ok: false, message: "El documento requerido no pertenece a esta oportunidad" });
        }
        const oportunidad = await prisma_1.prisma.oportunidadReclutamiento.findUnique({
            where: { id: oportunidadId },
            include: { Entrevista: { select: { aptos: true } } },
        });
        if (!oportunidad)
            return res.status(404).json({ ok: false, message: "Oportunidad no encontrada" });
        const payload = resolverDocumentoRequeridoPayload(req.body);
        if (payload.error || !payload.data)
            return res.status(400).json({ ok: false, message: payload.error });
        if (payload.data.cantidadEntregada > (oportunidad.Entrevista?.aptos ?? 0)) {
            return res.status(400).json({ ok: false, message: "Personas que lo entregaron no puede superar las personas seleccionadas" });
        }
        const documento = await prisma_1.prisma.documentoRequeridoOportunidad.update({
            where: { id: documentoId },
            data: payload.data,
        });
        return res.json({ ok: true, message: "Documento requerido actualizado correctamente", documento: serializarDocumentoRequerido(documento) });
    }
    catch (error) {
        if (error?.code === "P2002") {
            return res.status(400).json({ ok: false, message: "Ya existe un documento requerido con ese nombre" });
        }
        console.error("ERROR ACTUALIZAR DOCUMENTO REQUERIDO:", error);
        return res.status(500).json({ ok: false, message: "Error al actualizar el documento requerido" });
    }
};
exports.actualizarDocumentoRequerido = actualizarDocumentoRequerido;
const eliminarDocumentoRequerido = async (req, res) => {
    try {
        const oportunidadId = Number(req.params.id);
        const documentoId = Number(req.params.documentoId);
        if (Number.isNaN(oportunidadId) || Number.isNaN(documentoId))
            return res.status(400).json({ ok: false, message: "ID invÃ¡lido" });
        const existente = await prisma_1.prisma.documentoRequeridoOportunidad.findUnique({ where: { id: documentoId } });
        if (!existente || existente.oportunidadId !== oportunidadId) {
            return res.status(404).json({ ok: false, message: "El documento requerido no pertenece a esta oportunidad" });
        }
        await prisma_1.prisma.documentoRequeridoOportunidad.delete({ where: { id: documentoId } });
        return res.json({ ok: true, message: "Documento requerido eliminado correctamente" });
    }
    catch (error) {
        console.error("ERROR ELIMINAR DOCUMENTO REQUERIDO:", error);
        return res.status(500).json({ ok: false, message: "Error al eliminar el documento requerido" });
    }
};
exports.eliminarDocumentoRequerido = eliminarDocumentoRequerido;
const serializarFuente = (fuente) => ({
    id: String(fuente.id),
    nombre: fuente.nombre,
    cantidad: fuente.cantidad,
});
const crearFuenteExterna = async (req, res) => {
    try {
        const oportunidadId = Number(req.params.id);
        if (Number.isNaN(oportunidadId)) {
            return res.status(400).json({ ok: false, message: "ID de oportunidad inválido" });
        }
        const oportunidad = await prisma_1.prisma.oportunidadReclutamiento.findUnique({ where: { id: oportunidadId } });
        if (!oportunidad) {
            return res.status(404).json({ ok: false, message: "Oportunidad no encontrada" });
        }
        const nombre = limpiarTexto(req.body.nombre);
        const cantidad = parseEnteroNoNegativo(req.body.cantidad);
        if (!nombre) {
            return res.status(400).json({ ok: false, message: "El nombre de la plataforma es obligatorio" });
        }
        if (cantidad === null) {
            return res.status(400).json({ ok: false, message: "La cantidad debe ser un número entero mayor o igual a cero" });
        }
        const nombreNormalizado = normalizarNombreFuente(nombre);
        const existente = await prisma_1.prisma.fuentePostulacionExterna.findUnique({
            where: { oportunidadId_nombreNormalizado: { oportunidadId, nombreNormalizado } },
        });
        if (existente) {
            return res.status(400).json({ ok: false, message: "Ya existe una plataforma con ese nombre en esta oportunidad" });
        }
        const fuente = await prisma_1.prisma.fuentePostulacionExterna.create({
            data: { oportunidadId, nombre, nombreNormalizado, cantidad },
        });
        return res.status(201).json({
            ok: true,
            message: "Plataforma agregada correctamente",
            fuente: serializarFuente(fuente),
        });
    }
    catch (error) {
        console.error("ERROR CREAR FUENTE EXTERNA:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al agregar la plataforma",
        });
    }
};
exports.crearFuenteExterna = crearFuenteExterna;
const actualizarFuenteExterna = async (req, res) => {
    try {
        const oportunidadId = Number(req.params.id);
        const fuenteId = Number(req.params.fuenteId);
        if (Number.isNaN(oportunidadId) || Number.isNaN(fuenteId)) {
            return res.status(400).json({ ok: false, message: "ID inválido" });
        }
        const fuente = await prisma_1.prisma.fuentePostulacionExterna.findUnique({ where: { id: fuenteId } });
        if (!fuente || fuente.oportunidadId !== oportunidadId) {
            return res.status(404).json({ ok: false, message: "La plataforma indicada no pertenece a esta oportunidad" });
        }
        const nombre = limpiarTexto(req.body.nombre);
        const cantidad = parseEnteroNoNegativo(req.body.cantidad);
        if (!nombre) {
            return res.status(400).json({ ok: false, message: "El nombre de la plataforma es obligatorio" });
        }
        if (cantidad === null) {
            return res.status(400).json({ ok: false, message: "La cantidad debe ser un número entero mayor o igual a cero" });
        }
        const nombreNormalizado = normalizarNombreFuente(nombre);
        const duplicada = await prisma_1.prisma.fuentePostulacionExterna.findUnique({
            where: { oportunidadId_nombreNormalizado: { oportunidadId, nombreNormalizado } },
        });
        if (duplicada && duplicada.id !== fuenteId) {
            return res.status(400).json({ ok: false, message: "Ya existe una plataforma con ese nombre en esta oportunidad" });
        }
        const actualizada = await prisma_1.prisma.fuentePostulacionExterna.update({
            where: { id: fuenteId },
            data: { nombre, nombreNormalizado, cantidad },
        });
        return res.json({
            ok: true,
            message: "Plataforma actualizada correctamente",
            fuente: serializarFuente(actualizada),
        });
    }
    catch (error) {
        console.error("ERROR ACTUALIZAR FUENTE EXTERNA:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al actualizar la plataforma",
        });
    }
};
exports.actualizarFuenteExterna = actualizarFuenteExterna;
const eliminarFuenteExterna = async (req, res) => {
    try {
        const oportunidadId = Number(req.params.id);
        const fuenteId = Number(req.params.fuenteId);
        if (Number.isNaN(oportunidadId) || Number.isNaN(fuenteId)) {
            return res.status(400).json({ ok: false, message: "ID inválido" });
        }
        const fuente = await prisma_1.prisma.fuentePostulacionExterna.findUnique({ where: { id: fuenteId } });
        if (!fuente || fuente.oportunidadId !== oportunidadId) {
            return res.status(404).json({ ok: false, message: "La plataforma indicada no pertenece a esta oportunidad" });
        }
        await prisma_1.prisma.fuentePostulacionExterna.delete({ where: { id: fuenteId } });
        return res.json({ ok: true, message: "Plataforma eliminada correctamente" });
    }
    catch (error) {
        console.error("ERROR ELIMINAR FUENTE EXTERNA:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al eliminar la plataforma",
        });
    }
};
exports.eliminarFuenteExterna = eliminarFuenteExterna;
