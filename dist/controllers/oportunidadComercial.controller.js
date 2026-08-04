"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmarCierreGanada = exports.obtenerCierreGanada = exports.actualizarEtapaNegociacion = exports.obtenerEtapaNegociacion = exports.actualizarEtapaPropuesta = exports.obtenerEtapaPropuesta = exports.actualizarEtapaContactado = exports.obtenerEtapaContactado = exports.actualizarEtapaProspecto = exports.obtenerEtapaProspecto = exports.postergarOportunidadComercial = exports.marcarOportunidadPerdida = exports.actualizarEtapaOportunidadComercial = exports.actualizarOportunidadComercial = exports.obtenerOportunidadComercial = exports.listarOportunidadesComerciales = exports.crearOportunidadComercial = void 0;
const prisma_1 = require("../lib/prisma");
const validarRut_1 = require("../utils/validarRut");
const PRIORIDADES_VALIDAS = ["BAJA", "MEDIA", "ALTA", "URGENTE"];
// "PERDIDA" ya no es un destino válido de este flujo: perder una oportunidad
// ahora es un flag independiente de la etapa (ver `marcarOportunidadPerdida`),
// no un movimiento de columna. Se deja fuera de aquí para que ni el PATCH de
// etapa ni el filtro `etapa` la acepten.
const ETAPAS_VALIDAS = [
    "PROSPECTO",
    "CONTACTADO",
    "PROPUESTA",
    "NEGOCIACION",
    "GANADA",
];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORIGEN_PROSPECTO_OTRO = "OTRO";
const ORIGENES_PROSPECTO_VALIDOS = [
    "REFERIDO",
    "PAGINA_WEB",
    "LLAMADA_SALIENTE",
    "CORREO_ELECTRONICO",
    "LINKEDIN",
    "WHATSAPP",
    "OTRO",
];
const NIVELES_INTERES_VALIDOS = ["BAJO", "MEDIO", "ALTO"];
const MEDIOS_CONTACTO_VALIDOS = ["TELEFONO", "CORREO", "WHATSAPP", "REUNION"];
const NECESIDADES_ACTIVAS_VALIDAS = ["SI", "NO", "A_FUTURO"];
const MEDIO_ENVIO_PROPUESTA_OTRO = "OTRO";
const MEDIOS_ENVIO_PROPUESTA_VALIDOS = [
    "CORREO_ELECTRONICO",
    "WHATSAPP",
    "REUNION_PRESENCIAL",
    "VIDEOLLAMADA",
    "OTRO",
];
const ESTADO_NEGOCIACION_SOLICITA_CAMBIOS = "SOLICITA_CAMBIOS";
const ESTADOS_NEGOCIACION_VALIDOS = [
    "EN_NEGOCIACION",
    "SOLICITA_CAMBIOS",
    "SOLICITA_REBAJA",
    "EN_EVALUACION",
    "ACEPTA_CONDICIONES",
    "RECHAZA_PROPUESTA",
];
const ESTADOS_ACUERDO_VALIDOS = ["CONFIRMADO", "PENDIENTE_FIRMA"];
const JORNADAS_VALIDAS = ["FULL_TIME", "PART_TIME", "AMBAS"];
const TIPO_SERVICIO_OTRO = "Otro";
const TIPOS_SERVICIO_OFICIALES = [
    "Outsourcing",
    "Servicios Transitorios",
    "Formación y Capacitación",
    "Reclutamiento y Selección",
    "Reposición Multimarca",
];
const TIPOS_SERVICIO_VALIDOS = [...TIPOS_SERVICIO_OFICIALES, TIPO_SERVICIO_OTRO];
/** Compartido entre la creación/edición general y la etapa Contactado (cuando el servicio cambió). */
const validarTipoServicio = (tipoServicioRaw, tipoServicioOtroRaw) => {
    const tipoServicio = limpiarTexto(tipoServicioRaw);
    if (!tipoServicio) {
        return { error: "El tipo de servicio es obligatorio", tipoServicio: null, tipoServicioOtro: null };
    }
    if (!TIPOS_SERVICIO_VALIDOS.includes(tipoServicio)) {
        return {
            error: `El tipo de servicio debe ser uno de: ${TIPOS_SERVICIO_VALIDOS.join(", ")}`,
            tipoServicio: null,
            tipoServicioOtro: null,
        };
    }
    if (tipoServicio === TIPO_SERVICIO_OTRO) {
        const tipoServicioOtro = limpiarTexto(tipoServicioOtroRaw);
        if (!tipoServicioOtro) {
            return {
                error: 'Debes especificar el tipo de servicio cuando eliges "Otro"',
                tipoServicio: null,
                tipoServicioOtro: null,
            };
        }
        return { error: null, tipoServicio, tipoServicioOtro };
    }
    return { error: null, tipoServicio, tipoServicioOtro: null };
};
const parseBooleanRequerido = (valor) => {
    if (valor === true || valor === "true")
        return true;
    if (valor === false || valor === "false")
        return false;
    return null;
};
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
/** `null` = no informado, `"invalido"` = informado pero no es un entero >= 0, número = valor válido. */
const parseEnteroNoNegativoOpcional = (valor) => {
    if (valor === undefined || valor === null || String(valor).trim() === "")
        return null;
    const numero = Number(valor);
    if (Number.isNaN(numero) || numero < 0 || !Number.isInteger(numero))
        return "invalido";
    return numero;
};
const parseMontoNoNegativoOpcional = (valor) => {
    if (valor === undefined || valor === null || String(valor).trim() === "")
        return null;
    const numero = Number(valor);
    if (Number.isNaN(numero) || numero < 0)
        return "invalido";
    return numero;
};
/** Igual que la creación de oportunidades de Reclutamiento: la cantidad de personas necesarias debe ser un entero > 0. */
const parseEnteroPositivo = (valor) => {
    const numero = Number(valor);
    if (Number.isNaN(numero) || numero <= 0 || !Number.isInteger(numero))
        return null;
    return numero;
};
/** Mismo patrón que `registrarHistorial` del controller de Reclutamiento (`oportunidad.controller.ts`). */
const registrarHistorialComercial = async (params) => {
    if (!params.usuarioId)
        return;
    await prisma_1.prisma.historialOportunidadComercial.create({
        data: {
            oportunidadId: params.oportunidadId,
            tipo: params.tipo,
            usuarioId: params.usuarioId,
            detalle: params.detalle ?? null,
            etapaAnterior: params.etapaAnterior ?? null,
            etapaNueva: params.etapaNueva ?? null,
        },
    });
};
const INCLUDE_OPORTUNIDAD_COMERCIAL = {
    Empresa: { select: { id: true, nombre: true } },
    Ejecutivo: { select: { id: true, nombre: true } },
    CreadoPor: { select: { id: true, nombre: true } },
};
const serializarOportunidadComercial = (o) => ({
    id: String(o.id),
    empresaId: o.empresaId !== null ? String(o.empresaId) : null,
    empresaNombre: o.Empresa?.nombre ?? null,
    prospectoNombre: o.prospectoNombre,
    prospectoRut: o.prospectoRut,
    contactoNombre: o.contactoNombre,
    contactoCargo: o.contactoCargo,
    contactoTelefono: o.contactoTelefono,
    contactoEmail: o.contactoEmail,
    nombreOportunidad: o.nombreOportunidad,
    tipoServicio: o.tipoServicio,
    tipoServicioOtro: o.tipoServicioOtro,
    descripcionNecesidad: o.descripcionNecesidad,
    cantidadTrabajadores: o.cantidadTrabajadores,
    cargoPerfil: o.cargoPerfil,
    region: o.region,
    comuna: o.comuna,
    montoEstimado: o.montoEstimado,
    fechaInicioEstimada: o.fechaInicioEstimada,
    ejecutivoId: String(o.ejecutivoId),
    ejecutivoNombre: o.Ejecutivo.nombre,
    prioridad: o.prioridad,
    etapa: o.etapa,
    proximaActividad: o.proximaActividad,
    fechaProximaActividad: o.fechaProximaActividad,
    observaciones: o.observaciones,
    perdida: o.perdida,
    motivoPerdida: o.motivoPerdida,
    postergada: o.postergada,
    motivoPostergacion: o.motivoPostergacion,
    createdById: String(o.createdById),
    createdByNombre: o.CreadoPor?.nombre ?? null,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
});
/**
 * Reglas de creación: empresaId O prospectoNombre (no exige ambos), empresa y
 * ejecutivo deben existir realmente, RUT del prospecto se normaliza/valida si
 * viene informado, montos/cantidades no negativos, correo válido si viene
 * informado. La etapa NUNCA se toma del body: la asigna el caller como
 * PROSPECTO después de esta validación.
 */
const validarPayloadOportunidadComercial = async (body) => {
    const empresaIdInformado = body.empresaId !== undefined && body.empresaId !== null && String(body.empresaId).trim() !== "";
    const empresaId = empresaIdInformado ? Number(body.empresaId) : null;
    if (empresaIdInformado && (empresaId === null || Number.isNaN(empresaId))) {
        return { error: "empresaId inválido", data: null };
    }
    const prospectoNombre = limpiarTexto(body.prospectoNombre);
    if (!empresaId && !prospectoNombre) {
        return {
            error: "Debes indicar una empresa existente (empresaId) o el nombre/razón social del prospecto (prospectoNombre).",
            data: null,
        };
    }
    if (empresaId) {
        const empresa = await prisma_1.prisma.empresa.findUnique({ where: { id: empresaId } });
        if (!empresa) {
            return { error: "La empresa seleccionada no existe", data: null };
        }
    }
    let prospectoRut = null;
    const prospectoRutInformado = limpiarTexto(body.prospectoRut);
    if (prospectoRutInformado) {
        if (!(0, validarRut_1.validarRut)(prospectoRutInformado)) {
            return { error: "El RUT del prospecto no es válido", data: null };
        }
        prospectoRut = (0, validarRut_1.formatearRut)(prospectoRutInformado);
    }
    const contactoNombre = limpiarTexto(body.contactoNombre);
    if (!contactoNombre) {
        return { error: "El contacto principal es obligatorio", data: null };
    }
    const contactoEmail = limpiarTexto(body.contactoEmail);
    if (contactoEmail && !EMAIL_REGEX.test(contactoEmail)) {
        return { error: "El correo del contacto no es válido", data: null };
    }
    const nombreOportunidad = limpiarTexto(body.nombreOportunidad);
    if (!nombreOportunidad) {
        return { error: "El nombre de la oportunidad es obligatorio", data: null };
    }
    const resultadoTipoServicio = validarTipoServicio(body.tipoServicio, body.tipoServicioOtro);
    if (resultadoTipoServicio.error !== null) {
        return { error: resultadoTipoServicio.error, data: null };
    }
    const { tipoServicio, tipoServicioOtro } = resultadoTipoServicio;
    const cantidadTrabajadores = parseEnteroNoNegativoOpcional(body.cantidadTrabajadores);
    if (cantidadTrabajadores === "invalido") {
        return { error: "La cantidad de trabajadores no puede ser negativa", data: null };
    }
    const montoEstimado = parseMontoNoNegativoOpcional(body.montoEstimado);
    if (montoEstimado === "invalido") {
        return { error: "El monto estimado no puede ser negativo", data: null };
    }
    const ejecutivoIdInformado = body.ejecutivoId !== undefined && body.ejecutivoId !== null && String(body.ejecutivoId).trim() !== "";
    const ejecutivoId = ejecutivoIdInformado ? Number(body.ejecutivoId) : NaN;
    if (!ejecutivoIdInformado || Number.isNaN(ejecutivoId)) {
        return { error: "El ejecutivo responsable es obligatorio", data: null };
    }
    const ejecutivo = await prisma_1.prisma.usuario.findUnique({ where: { id: ejecutivoId } });
    if (!ejecutivo) {
        return { error: "El ejecutivo responsable no es un usuario válido", data: null };
    }
    const prioridad = String(body.prioridad ?? "").toUpperCase();
    if (!PRIORIDADES_VALIDAS.includes(prioridad)) {
        return { error: `La prioridad debe ser una de: ${PRIORIDADES_VALIDAS.join(", ")}`, data: null };
    }
    return {
        error: null,
        data: {
            empresaId,
            prospectoNombre,
            prospectoRut,
            contactoNombre,
            contactoCargo: limpiarTexto(body.contactoCargo),
            contactoTelefono: limpiarTexto(body.contactoTelefono),
            contactoEmail,
            nombreOportunidad,
            tipoServicio,
            tipoServicioOtro,
            descripcionNecesidad: limpiarTexto(body.descripcionNecesidad),
            cantidadTrabajadores,
            cargoPerfil: limpiarTexto(body.cargoPerfil),
            region: limpiarTexto(body.region),
            comuna: limpiarTexto(body.comuna),
            montoEstimado,
            fechaInicioEstimada: parseFecha(body.fechaInicioEstimada),
            ejecutivoId,
            prioridad: prioridad,
            proximaActividad: limpiarTexto(body.proximaActividad),
            fechaProximaActividad: parseFecha(body.fechaProximaActividad),
            observaciones: limpiarTexto(body.observaciones),
            // Placeholders requeridos por el tipo; el caller los sobreescribe siempre.
            etapa: "PROSPECTO",
            createdById: 0,
        },
    };
};
const crearOportunidadComercial = async (req, res) => {
    try {
        if (!req.usuario?.id) {
            return res.status(401).json({ ok: false, message: "Usuario no autenticado" });
        }
        const validacion = await validarPayloadOportunidadComercial(req.body);
        if (validacion.error || !validacion.data) {
            return res.status(400).json({ ok: false, message: validacion.error });
        }
        const oportunidad = await prisma_1.prisma.oportunidadComercial.create({
            data: {
                ...validacion.data,
                // No se acepta la etapa desde el frontend: toda oportunidad nueva nace en PROSPECTO.
                etapa: "PROSPECTO",
                createdById: req.usuario.id,
            },
            include: INCLUDE_OPORTUNIDAD_COMERCIAL,
        });
        await registrarHistorialComercial({
            oportunidadId: oportunidad.id,
            tipo: "CREACION",
            usuarioId: req.usuario.id,
            etapaNueva: oportunidad.etapa,
        });
        return res.status(201).json({
            ok: true,
            message: "Oportunidad comercial creada correctamente",
            oportunidad: serializarOportunidadComercial(oportunidad),
        });
    }
    catch (error) {
        console.error("ERROR CREAR OPORTUNIDAD COMERCIAL:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al crear la oportunidad comercial",
        });
    }
};
exports.crearOportunidadComercial = crearOportunidadComercial;
const construirFiltros = (query) => {
    const where = {};
    if (query.empresaId)
        where.empresaId = Number(query.empresaId);
    if (query.ejecutivoId)
        where.ejecutivoId = Number(query.ejecutivoId);
    if (query.prioridad && PRIORIDADES_VALIDAS.includes(String(query.prioridad))) {
        where.prioridad = String(query.prioridad);
    }
    if (query.etapa && ETAPAS_VALIDAS.includes(String(query.etapa))) {
        where.etapa = String(query.etapa);
    }
    const busqueda = limpiarTexto(query.busqueda);
    if (busqueda) {
        where.OR = [
            { nombreOportunidad: { contains: busqueda, mode: "insensitive" } },
            { contactoNombre: { contains: busqueda, mode: "insensitive" } },
            { prospectoNombre: { contains: busqueda, mode: "insensitive" } },
            { Empresa: { nombre: { contains: busqueda, mode: "insensitive" } } },
        ];
    }
    return where;
};
const listarOportunidadesComerciales = async (req, res) => {
    try {
        const where = construirFiltros(req.query);
        const oportunidades = await prisma_1.prisma.oportunidadComercial.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: INCLUDE_OPORTUNIDAD_COMERCIAL,
        });
        return res.json({
            ok: true,
            oportunidades: oportunidades.map(serializarOportunidadComercial),
        });
    }
    catch (error) {
        console.error("ERROR LISTAR OPORTUNIDADES COMERCIALES:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al listar oportunidades comerciales",
        });
    }
};
exports.listarOportunidadesComerciales = listarOportunidadesComerciales;
const obtenerOportunidadComercial = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ ok: false, message: "ID de oportunidad inválido" });
        }
        const oportunidad = await prisma_1.prisma.oportunidadComercial.findUnique({
            where: { id },
            include: {
                ...INCLUDE_OPORTUNIDAD_COMERCIAL,
                Historial: {
                    orderBy: { createdAt: "desc" },
                    include: { Usuario: { select: { nombre: true } } },
                },
            },
        });
        if (!oportunidad) {
            return res.status(404).json({ ok: false, message: "Oportunidad comercial no encontrada" });
        }
        return res.json({
            ok: true,
            oportunidad: {
                ...serializarOportunidadComercial(oportunidad),
                historial: oportunidad.Historial.map((h) => ({
                    id: String(h.id),
                    tipo: h.tipo,
                    etapaAnterior: h.etapaAnterior,
                    etapaNueva: h.etapaNueva,
                    detalle: h.detalle,
                    usuarioNombre: h.Usuario.nombre,
                    createdAt: h.createdAt,
                })),
            },
        });
    }
    catch (error) {
        console.error("ERROR OBTENER OPORTUNIDAD COMERCIAL:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al obtener la oportunidad comercial",
        });
    }
};
exports.obtenerOportunidadComercial = obtenerOportunidadComercial;
/**
 * Edición de datos generales (mismas reglas que la creación). No permite
 * cambiar `etapa` (se mueve con su propio flujo, todavía no implementado) ni
 * `createdById` (es histórico): ambos se descartan del resultado de la
 * validación antes de aplicar el update.
 */
const actualizarOportunidadComercial = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ ok: false, message: "ID de oportunidad inválido" });
        }
        const existente = await prisma_1.prisma.oportunidadComercial.findUnique({ where: { id } });
        if (!existente) {
            return res.status(404).json({ ok: false, message: "Oportunidad comercial no encontrada" });
        }
        const validacion = await validarPayloadOportunidadComercial(req.body);
        if (validacion.error || !validacion.data) {
            return res.status(400).json({ ok: false, message: validacion.error });
        }
        const { etapa: _etapa, createdById: _createdById, ...datosActualizables } = validacion.data;
        const oportunidad = await prisma_1.prisma.oportunidadComercial.update({
            where: { id },
            data: datosActualizables,
            include: INCLUDE_OPORTUNIDAD_COMERCIAL,
        });
        let detalle = null;
        if (existente.ejecutivoId !== oportunidad.ejecutivoId) {
            const ejecutivoAnterior = await prisma_1.prisma.usuario.findUnique({ where: { id: existente.ejecutivoId } });
            detalle = `Reasignó el ejecutivo de ${ejecutivoAnterior?.nombre ?? "—"} a ${oportunidad.Ejecutivo.nombre}`;
        }
        await registrarHistorialComercial({
            oportunidadId: oportunidad.id,
            tipo: "EDICION_GENERAL",
            usuarioId: req.usuario?.id,
            detalle,
        });
        return res.json({
            ok: true,
            message: "Oportunidad comercial actualizada correctamente",
            oportunidad: serializarOportunidadComercial(oportunidad),
        });
    }
    catch (error) {
        console.error("ERROR ACTUALIZAR OPORTUNIDAD COMERCIAL:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al actualizar la oportunidad comercial",
        });
    }
};
exports.actualizarOportunidadComercial = actualizarOportunidadComercial;
/** Persiste el movimiento entre columnas del Kanban (drag and drop) y lo deja en el historial. */
const actualizarEtapaOportunidadComercial = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ ok: false, message: "ID de oportunidad inválido" });
        }
        const etapa = String(req.body.etapa ?? "").toUpperCase();
        if (!ETAPAS_VALIDAS.includes(etapa)) {
            return res.status(400).json({ ok: false, message: `La etapa debe ser una de: ${ETAPAS_VALIDAS.join(", ")}` });
        }
        const existente = await prisma_1.prisma.oportunidadComercial.findUnique({ where: { id } });
        if (!existente) {
            return res.status(404).json({ ok: false, message: "Oportunidad comercial no encontrada" });
        }
        if (etapa === "NEGOCIACION") {
            const datosPropuesta = await prisma_1.prisma.datosEtapaPropuestaComercial.findUnique({ where: { oportunidadId: id } });
            if (!datosPropuesta || datosPropuesta.propuestaEnviada !== true) {
                return res.status(400).json({
                    ok: false,
                    message: "No puedes avanzar a Negociación sin confirmar que la propuesta fue enviada en la etapa Propuesta",
                });
            }
        }
        const oportunidad = await prisma_1.prisma.oportunidadComercial.update({
            where: { id },
            data: { etapa: etapa },
            include: INCLUDE_OPORTUNIDAD_COMERCIAL,
        });
        await registrarHistorialComercial({
            oportunidadId: oportunidad.id,
            tipo: "CAMBIO_ETAPA",
            usuarioId: req.usuario?.id,
            etapaAnterior: existente.etapa,
            etapaNueva: oportunidad.etapa,
        });
        return res.json({
            ok: true,
            message: "Etapa actualizada correctamente",
            oportunidad: serializarOportunidadComercial(oportunidad),
        });
    }
    catch (error) {
        console.error("ERROR ACTUALIZAR ETAPA OPORTUNIDAD COMERCIAL:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al actualizar la etapa de la oportunidad comercial",
        });
    }
};
exports.actualizarEtapaOportunidadComercial = actualizarEtapaOportunidadComercial;
/**
 * Marca la oportunidad como perdida sin moverla de `etapa`: a diferencia del
 * cierre Ganada, "Perdida" no es un destino del Kanban, es un flag que se
 * superpone a la etapa en la que se quedó (la tarjeta sigue viéndose ahí,
 * solo que marcada). Por eso no valida ni toca `etapa`.
 */
const marcarOportunidadPerdida = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ ok: false, message: "ID de oportunidad inválido" });
        }
        const existente = await prisma_1.prisma.oportunidadComercial.findUnique({ where: { id } });
        if (!existente) {
            return res.status(404).json({ ok: false, message: "Oportunidad comercial no encontrada" });
        }
        if (existente.etapa === "GANADA") {
            return res.status(400).json({ ok: false, message: "La oportunidad ya está cerrada como Ganada, no puede marcarse como perdida" });
        }
        const motivo = limpiarTexto(req.body.motivo);
        if (!motivo) {
            return res.status(400).json({ ok: false, message: "Debes indicar el motivo de la pérdida" });
        }
        const oportunidad = await prisma_1.prisma.oportunidadComercial.update({
            where: { id },
            data: { perdida: true, motivoPerdida: motivo },
            include: INCLUDE_OPORTUNIDAD_COMERCIAL,
        });
        await registrarHistorialComercial({
            oportunidadId: id,
            tipo: "MARCADA_PERDIDA",
            usuarioId: req.usuario?.id,
            detalle: motivo,
        });
        return res.json({
            ok: true,
            message: "Oportunidad marcada como perdida correctamente",
            oportunidad: serializarOportunidadComercial(oportunidad),
        });
    }
    catch (error) {
        console.error("ERROR MARCAR OPORTUNIDAD PERDIDA:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al marcar la oportunidad como perdida",
        });
    }
};
exports.marcarOportunidadPerdida = marcarOportunidadPerdida;
/**
 * Postergar tampoco mueve `etapa`: solo reagenda `fechaProximaActividad`
 * (mismo campo que ya muestra la tarjeta, sin duplicarlo) y deja marcada
 * `postergada` para que la UI lo destaque.
 */
const postergarOportunidadComercial = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ ok: false, message: "ID de oportunidad inválido" });
        }
        const existente = await prisma_1.prisma.oportunidadComercial.findUnique({ where: { id } });
        if (!existente) {
            return res.status(404).json({ ok: false, message: "Oportunidad comercial no encontrada" });
        }
        const nuevaFecha = parseFecha(req.body.nuevaFecha);
        if (!nuevaFecha) {
            return res.status(400).json({ ok: false, message: "La nueva fecha es obligatoria" });
        }
        const motivo = limpiarTexto(req.body.motivo);
        const oportunidad = await prisma_1.prisma.oportunidadComercial.update({
            where: { id },
            data: { postergada: true, motivoPostergacion: motivo, fechaProximaActividad: nuevaFecha },
            include: INCLUDE_OPORTUNIDAD_COMERCIAL,
        });
        await registrarHistorialComercial({
            oportunidadId: id,
            tipo: "POSTERGADA",
            usuarioId: req.usuario?.id,
            detalle: motivo,
        });
        return res.json({
            ok: true,
            message: "Oportunidad postergada correctamente",
            oportunidad: serializarOportunidadComercial(oportunidad),
        });
    }
    catch (error) {
        console.error("ERROR POSTERGAR OPORTUNIDAD COMERCIAL:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al postergar la oportunidad",
        });
    }
};
exports.postergarOportunidadComercial = postergarOportunidadComercial;
const serializarEtapaProspecto = (datos) => ({
    origenProspecto: datos?.origenProspecto ?? null,
    origenProspectoOtro: datos?.origenProspectoOtro ?? null,
    fechaIncorporacion: datos?.fechaIncorporacion ?? null,
    necesidadPreliminar: datos?.necesidadPreliminar ?? null,
    nivelInteres: datos?.nivelInteres ?? null,
    medioContactoPreferido: datos?.medioContactoPreferido ?? null,
    proximaAccion: datos?.proximaAccion ?? null,
    fechaProximaAccion: datos?.fechaProximaAccion ?? null,
    observacionesProspecto: datos?.observacionesProspecto ?? null,
    updatedAt: datos?.updatedAt ?? null,
});
const obtenerEtapaProspecto = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ ok: false, message: "ID de oportunidad inválido" });
        }
        const oportunidad = await prisma_1.prisma.oportunidadComercial.findUnique({
            where: { id },
            include: { DatosProspecto: true },
        });
        if (!oportunidad) {
            return res.status(404).json({ ok: false, message: "Oportunidad comercial no encontrada" });
        }
        return res.json({
            ok: true,
            etapaProspecto: serializarEtapaProspecto(oportunidad.DatosProspecto),
        });
    }
    catch (error) {
        console.error("ERROR OBTENER ETAPA PROSPECTO COMERCIAL:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al obtener la etapa Prospecto",
        });
    }
};
exports.obtenerEtapaProspecto = obtenerEtapaProspecto;
/** Upsert: la fila de `DatosEtapaProspectoComercial` puede no existir todavía (1:1 opcional con la oportunidad). */
const actualizarEtapaProspecto = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ ok: false, message: "ID de oportunidad inválido" });
        }
        const oportunidad = await prisma_1.prisma.oportunidadComercial.findUnique({ where: { id } });
        if (!oportunidad) {
            return res.status(404).json({ ok: false, message: "Oportunidad comercial no encontrada" });
        }
        if (oportunidad.etapa !== "PROSPECTO") {
            return res.status(400).json({ ok: false, message: "La oportunidad debe estar en Prospecto para rellenar esta etapa" });
        }
        const origenProspecto = limpiarTexto(req.body.origenProspecto)?.toUpperCase() ?? null;
        if (origenProspecto && !ORIGENES_PROSPECTO_VALIDOS.includes(origenProspecto)) {
            return res.status(400).json({
                ok: false,
                message: `El origen del prospecto debe ser uno de: ${ORIGENES_PROSPECTO_VALIDOS.join(", ")}`,
            });
        }
        let origenProspectoOtro = null;
        if (origenProspecto === ORIGEN_PROSPECTO_OTRO) {
            origenProspectoOtro = limpiarTexto(req.body.origenProspectoOtro);
            if (!origenProspectoOtro) {
                return res.status(400).json({ ok: false, message: 'Debes especificar el origen cuando eliges "Otro"' });
            }
        }
        const nivelInteres = limpiarTexto(req.body.nivelInteres)?.toUpperCase() ?? null;
        if (nivelInteres && !NIVELES_INTERES_VALIDOS.includes(nivelInteres)) {
            return res.status(400).json({
                ok: false,
                message: `El nivel de interés debe ser uno de: ${NIVELES_INTERES_VALIDOS.join(", ")}`,
            });
        }
        const medioContactoPreferido = limpiarTexto(req.body.medioContactoPreferido)?.toUpperCase() ?? null;
        if (medioContactoPreferido && !MEDIOS_CONTACTO_VALIDOS.includes(medioContactoPreferido)) {
            return res.status(400).json({
                ok: false,
                message: `El medio de contacto preferido debe ser uno de: ${MEDIOS_CONTACTO_VALIDOS.join(", ")}`,
            });
        }
        const datosComunes = {
            origenProspecto: origenProspecto,
            origenProspectoOtro,
            fechaIncorporacion: parseFecha(req.body.fechaIncorporacion),
            necesidadPreliminar: limpiarTexto(req.body.necesidadPreliminar),
            nivelInteres: nivelInteres,
            medioContactoPreferido: medioContactoPreferido,
            proximaAccion: limpiarTexto(req.body.proximaAccion),
            fechaProximaAccion: parseFecha(req.body.fechaProximaAccion),
            observacionesProspecto: limpiarTexto(req.body.observacionesProspecto),
        };
        await prisma_1.prisma.datosEtapaProspectoComercial.upsert({
            where: { oportunidadId: id },
            create: { oportunidadId: id, ...datosComunes },
            update: datosComunes,
        });
        await registrarHistorialComercial({ oportunidadId: id, tipo: "EDICION_ETAPA_PROSPECTO", usuarioId: req.usuario?.id });
        return res.json({
            ok: true,
            message: "Etapa Prospecto actualizada correctamente",
            oportunidadId: String(id),
        });
    }
    catch (error) {
        console.error("ERROR ACTUALIZAR ETAPA PROSPECTO COMERCIAL:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al actualizar la etapa Prospecto",
        });
    }
};
exports.actualizarEtapaProspecto = actualizarEtapaProspecto;
const serializarEtapaContactado = (datos) => ({
    cambioServicio: datos?.cambioServicio ?? null,
    cambioCantidadTrabajadores: datos?.cambioCantidadTrabajadores ?? null,
    cambioFechaInicio: datos?.cambioFechaInicio ?? null,
    necesidadActiva: datos?.necesidadActiva ?? null,
    updatedAt: datos?.updatedAt ?? null,
});
const obtenerEtapaContactado = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ ok: false, message: "ID de oportunidad inválido" });
        }
        const oportunidad = await prisma_1.prisma.oportunidadComercial.findUnique({
            where: { id },
            include: { DatosContactado: true },
        });
        if (!oportunidad) {
            return res.status(404).json({ ok: false, message: "Oportunidad comercial no encontrada" });
        }
        return res.json({
            ok: true,
            etapaContactado: serializarEtapaContactado(oportunidad.DatosContactado),
        });
    }
    catch (error) {
        console.error("ERROR OBTENER ETAPA CONTACTADO COMERCIAL:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al obtener la etapa Contactado",
        });
    }
};
exports.obtenerEtapaContactado = obtenerEtapaContactado;
/**
 * La etapa NO duplica servicio/cantidad/fecha: solo registra si cada uno
 * cambió (booleano) y la necesidad activa. Cuando la respuesta es "sí", el
 * valor nuevo se escribe directamente en `OportunidadComercial` (única
 * fuente de verdad) dentro de la misma transacción que el upsert de la
 * etapa, para que ambos queden consistentes o ninguno.
 */
const actualizarEtapaContactado = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ ok: false, message: "ID de oportunidad inválido" });
        }
        const oportunidad = await prisma_1.prisma.oportunidadComercial.findUnique({ where: { id } });
        if (!oportunidad) {
            return res.status(404).json({ ok: false, message: "Oportunidad comercial no encontrada" });
        }
        if (oportunidad.etapa !== "CONTACTADO") {
            return res.status(400).json({ ok: false, message: "La oportunidad debe estar en Contactado para rellenar esta etapa" });
        }
        const cambioServicio = parseBooleanRequerido(req.body.cambioServicio);
        if (cambioServicio === null) {
            return res.status(400).json({ ok: false, message: "Debes indicar si cambió el servicio solicitado (sí o no)" });
        }
        const cambioCantidadTrabajadores = parseBooleanRequerido(req.body.cambioCantidadTrabajadores);
        if (cambioCantidadTrabajadores === null) {
            return res.status(400).json({ ok: false, message: "Debes indicar si cambió la cantidad estimada de trabajadores (sí o no)" });
        }
        const cambioFechaInicio = parseBooleanRequerido(req.body.cambioFechaInicio);
        if (cambioFechaInicio === null) {
            return res.status(400).json({ ok: false, message: "Debes indicar si cambió la fecha estimada de inicio (sí o no)" });
        }
        const necesidadActiva = limpiarTexto(req.body.necesidadActiva)?.toUpperCase() ?? null;
        if (necesidadActiva && !NECESIDADES_ACTIVAS_VALIDAS.includes(necesidadActiva)) {
            return res.status(400).json({
                ok: false,
                message: `La necesidad activa debe ser una de: ${NECESIDADES_ACTIVAS_VALIDAS.join(", ")}`,
            });
        }
        const datosOportunidadActualizables = {};
        if (cambioServicio) {
            const resultadoTipoServicio = validarTipoServicio(req.body.nuevoServicio, req.body.nuevoServicioOtro);
            if (resultadoTipoServicio.error !== null) {
                return res.status(400).json({ ok: false, message: resultadoTipoServicio.error });
            }
            datosOportunidadActualizables.tipoServicio = resultadoTipoServicio.tipoServicio;
            datosOportunidadActualizables.tipoServicioOtro = resultadoTipoServicio.tipoServicioOtro;
        }
        if (cambioCantidadTrabajadores) {
            const nuevaCantidad = parseEnteroNoNegativoOpcional(req.body.nuevaCantidadTrabajadores);
            if (nuevaCantidad === null || nuevaCantidad === "invalido") {
                return res.status(400).json({
                    ok: false,
                    message: "Debes indicar la nueva cantidad estimada de trabajadores (entero mayor o igual a cero)",
                });
            }
            datosOportunidadActualizables.cantidadTrabajadores = nuevaCantidad;
        }
        if (cambioFechaInicio) {
            const nuevaFecha = parseFecha(req.body.nuevaFechaInicio);
            if (!nuevaFecha) {
                return res.status(400).json({ ok: false, message: "Debes indicar la nueva fecha estimada de inicio" });
            }
            datosOportunidadActualizables.fechaInicioEstimada = nuevaFecha;
        }
        const datosEtapaContactado = {
            cambioServicio,
            cambioCantidadTrabajadores,
            cambioFechaInicio,
            necesidadActiva: necesidadActiva,
        };
        const operaciones = [
            prisma_1.prisma.datosEtapaContactadoComercial.upsert({
                where: { oportunidadId: id },
                create: { oportunidadId: id, ...datosEtapaContactado },
                update: datosEtapaContactado,
            }),
        ];
        if (Object.keys(datosOportunidadActualizables).length > 0) {
            operaciones.push(prisma_1.prisma.oportunidadComercial.update({ where: { id }, data: datosOportunidadActualizables }));
        }
        await prisma_1.prisma.$transaction(operaciones);
        await registrarHistorialComercial({ oportunidadId: id, tipo: "EDICION_ETAPA_CONTACTADO", usuarioId: req.usuario?.id });
        const oportunidadActualizada = await prisma_1.prisma.oportunidadComercial.findUnique({
            where: { id },
            include: INCLUDE_OPORTUNIDAD_COMERCIAL,
        });
        return res.json({
            ok: true,
            message: "Etapa Contactado actualizada correctamente",
            oportunidad: oportunidadActualizada ? serializarOportunidadComercial(oportunidadActualizada) : null,
        });
    }
    catch (error) {
        console.error("ERROR ACTUALIZAR ETAPA CONTACTADO COMERCIAL:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al actualizar la etapa Contactado",
        });
    }
};
exports.actualizarEtapaContactado = actualizarEtapaContactado;
const serializarEtapaPropuesta = (datos) => ({
    fechaEnvio: datos?.fechaEnvio ?? null,
    medioEnvio: datos?.medioEnvio ?? null,
    medioEnvioOtro: datos?.medioEnvioOtro ?? null,
    propuestaEnviada: datos?.propuestaEnviada ?? null,
    valorPropuesta: datos?.valorPropuesta ?? null,
    vigenciaPropuesta: datos?.vigenciaPropuesta ?? null,
    responsableEnvioId: datos?.responsableEnvioId ? String(datos.responsableEnvioId) : null,
    responsableEnvioNombre: datos?.ResponsableEnvio?.nombre ?? null,
    observacionesPropuesta: datos?.observacionesPropuesta ?? null,
    updatedAt: datos?.updatedAt ?? null,
});
const obtenerEtapaPropuesta = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ ok: false, message: "ID de oportunidad inválido" });
        }
        const oportunidad = await prisma_1.prisma.oportunidadComercial.findUnique({
            where: { id },
            include: { DatosPropuesta: { include: { ResponsableEnvio: { select: { id: true, nombre: true } } } } },
        });
        if (!oportunidad) {
            return res.status(404).json({ ok: false, message: "Oportunidad comercial no encontrada" });
        }
        return res.json({
            ok: true,
            etapaPropuesta: serializarEtapaPropuesta(oportunidad.DatosPropuesta),
        });
    }
    catch (error) {
        console.error("ERROR OBTENER ETAPA PROPUESTA COMERCIAL:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al obtener la etapa Propuesta",
        });
    }
};
exports.obtenerEtapaPropuesta = obtenerEtapaPropuesta;
/**
 * Esta etapa solo registra lo que Grupo Colchagua envió (fecha, medio, valor,
 * vigencia, responsable y si efectivamente se envió). No incluye respuesta
 * del cliente (aceptó/rechazó/pidió cambios): eso es de la etapa Negociación.
 * El gate de avance ("no permitir avanzar a Negociación si no se envió") vive
 * en `actualizarEtapaOportunidadComercial`, no acá.
 */
const actualizarEtapaPropuesta = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ ok: false, message: "ID de oportunidad inválido" });
        }
        const oportunidad = await prisma_1.prisma.oportunidadComercial.findUnique({ where: { id } });
        if (!oportunidad) {
            return res.status(404).json({ ok: false, message: "Oportunidad comercial no encontrada" });
        }
        if (oportunidad.etapa !== "PROPUESTA") {
            return res.status(400).json({ ok: false, message: "La oportunidad debe estar en Propuesta para rellenar esta etapa" });
        }
        const fechaEnvio = parseFecha(req.body.fechaEnvio);
        const medioEnvio = limpiarTexto(req.body.medioEnvio)?.toUpperCase() ?? null;
        if (medioEnvio && !MEDIOS_ENVIO_PROPUESTA_VALIDOS.includes(medioEnvio)) {
            return res.status(400).json({
                ok: false,
                message: `El medio de envío debe ser uno de: ${MEDIOS_ENVIO_PROPUESTA_VALIDOS.join(", ")}`,
            });
        }
        let medioEnvioOtro = null;
        if (medioEnvio === MEDIO_ENVIO_PROPUESTA_OTRO) {
            medioEnvioOtro = limpiarTexto(req.body.medioEnvioOtro);
            if (!medioEnvioOtro) {
                return res.status(400).json({ ok: false, message: 'Debes especificar el medio de envío cuando eliges "Otro"' });
            }
        }
        const propuestaEnviada = parseBooleanRequerido(req.body.propuestaEnviada);
        if (propuestaEnviada === null) {
            return res.status(400).json({ ok: false, message: "Debes indicar si la propuesta fue enviada (sí o no)" });
        }
        const valorPropuesta = parseMontoNoNegativoOpcional(req.body.valorPropuesta);
        if (valorPropuesta === "invalido") {
            return res.status(400).json({ ok: false, message: "El valor de la propuesta no puede ser negativo" });
        }
        const vigenciaPropuesta = parseFecha(req.body.vigenciaPropuesta);
        const responsableEnvioIdInformado = req.body.responsableEnvioId !== undefined && req.body.responsableEnvioId !== null && String(req.body.responsableEnvioId).trim() !== "";
        let responsableEnvioId = null;
        if (responsableEnvioIdInformado) {
            responsableEnvioId = Number(req.body.responsableEnvioId);
            if (Number.isNaN(responsableEnvioId)) {
                return res.status(400).json({ ok: false, message: "El responsable del envío no es válido" });
            }
            const responsable = await prisma_1.prisma.usuario.findUnique({ where: { id: responsableEnvioId } });
            if (!responsable) {
                return res.status(400).json({ ok: false, message: "El responsable del envío no es un usuario válido" });
            }
        }
        const datosEtapaPropuesta = {
            fechaEnvio,
            medioEnvio: medioEnvio,
            medioEnvioOtro,
            propuestaEnviada,
            valorPropuesta,
            vigenciaPropuesta,
            responsableEnvioId,
            observacionesPropuesta: limpiarTexto(req.body.observacionesPropuesta),
        };
        await prisma_1.prisma.datosEtapaPropuestaComercial.upsert({
            where: { oportunidadId: id },
            create: { oportunidadId: id, ...datosEtapaPropuesta },
            update: datosEtapaPropuesta,
        });
        await registrarHistorialComercial({ oportunidadId: id, tipo: "EDICION_ETAPA_PROPUESTA", usuarioId: req.usuario?.id });
        return res.json({
            ok: true,
            message: "Etapa Propuesta actualizada correctamente",
            oportunidadId: String(id),
        });
    }
    catch (error) {
        console.error("ERROR ACTUALIZAR ETAPA PROPUESTA COMERCIAL:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al actualizar la etapa Propuesta",
        });
    }
};
exports.actualizarEtapaPropuesta = actualizarEtapaPropuesta;
const serializarEtapaNegociacion = (datos) => ({
    fechaRespuesta: datos?.fechaRespuesta ?? null,
    estadoNegociacion: datos?.estadoNegociacion ?? null,
    descripcionCambiosSolicitados: datos?.descripcionCambiosSolicitados ?? null,
    cambioValorPropuesta: datos?.cambioValorPropuesta ?? null,
    cambioServicio: datos?.cambioServicio ?? null,
    cambioCantidadTrabajadores: datos?.cambioCantidadTrabajadores ?? null,
    cambioFechaInicio: datos?.cambioFechaInicio ?? null,
    proximaGestion: datos?.proximaGestion ?? null,
    fechaProximaGestion: datos?.fechaProximaGestion ?? null,
    observacionesNegociacion: datos?.observacionesNegociacion ?? null,
    updatedAt: datos?.updatedAt ?? null,
});
const obtenerEtapaNegociacion = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ ok: false, message: "ID de oportunidad inválido" });
        }
        const oportunidad = await prisma_1.prisma.oportunidadComercial.findUnique({
            where: { id },
            include: { DatosNegociacion: true },
        });
        if (!oportunidad) {
            return res.status(404).json({ ok: false, message: "Oportunidad comercial no encontrada" });
        }
        return res.json({
            ok: true,
            etapaNegociacion: serializarEtapaNegociacion(oportunidad.DatosNegociacion),
        });
    }
    catch (error) {
        console.error("ERROR OBTENER ETAPA NEGOCIACION COMERCIAL:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al obtener la etapa Negociación",
        });
    }
};
exports.obtenerEtapaNegociacion = obtenerEtapaNegociacion;
/**
 * Igual que Contactado: la etapa NO duplica valor/servicio/cantidad/fecha,
 * solo registra si cada uno cambió. Cuando la respuesta es "sí", el valor
 * nuevo se escribe directamente en `OportunidadComercial` (única fuente de
 * verdad) dentro de la misma transacción que el upsert de la etapa.
 */
const actualizarEtapaNegociacion = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ ok: false, message: "ID de oportunidad inválido" });
        }
        const oportunidad = await prisma_1.prisma.oportunidadComercial.findUnique({ where: { id } });
        if (!oportunidad) {
            return res.status(404).json({ ok: false, message: "Oportunidad comercial no encontrada" });
        }
        if (oportunidad.etapa !== "NEGOCIACION") {
            return res.status(400).json({ ok: false, message: "La oportunidad debe estar en Negociación para rellenar esta etapa" });
        }
        const fechaRespuesta = parseFecha(req.body.fechaRespuesta);
        const estadoNegociacion = limpiarTexto(req.body.estadoNegociacion)?.toUpperCase() ?? null;
        if (!estadoNegociacion || !ESTADOS_NEGOCIACION_VALIDOS.includes(estadoNegociacion)) {
            return res.status(400).json({
                ok: false,
                message: `El estado de la negociación debe ser uno de: ${ESTADOS_NEGOCIACION_VALIDOS.join(", ")}`,
            });
        }
        let descripcionCambiosSolicitados = null;
        if (estadoNegociacion === ESTADO_NEGOCIACION_SOLICITA_CAMBIOS) {
            descripcionCambiosSolicitados = limpiarTexto(req.body.descripcionCambiosSolicitados);
            if (!descripcionCambiosSolicitados) {
                return res.status(400).json({
                    ok: false,
                    message: 'Debes describir los cambios solicitados cuando el estado es "Solicita cambios"',
                });
            }
        }
        const cambioValorPropuesta = parseBooleanRequerido(req.body.cambioValorPropuesta);
        if (cambioValorPropuesta === null) {
            return res.status(400).json({ ok: false, message: "Debes indicar si cambió el valor de la propuesta (sí o no)" });
        }
        const cambioServicio = parseBooleanRequerido(req.body.cambioServicio);
        if (cambioServicio === null) {
            return res.status(400).json({ ok: false, message: "Debes indicar si cambió el servicio solicitado (sí o no)" });
        }
        const cambioCantidadTrabajadores = parseBooleanRequerido(req.body.cambioCantidadTrabajadores);
        if (cambioCantidadTrabajadores === null) {
            return res.status(400).json({ ok: false, message: "Debes indicar si cambió la cantidad de trabajadores (sí o no)" });
        }
        const cambioFechaInicio = parseBooleanRequerido(req.body.cambioFechaInicio);
        if (cambioFechaInicio === null) {
            return res.status(400).json({ ok: false, message: "Debes indicar si cambió la fecha estimada de inicio (sí o no)" });
        }
        const datosOportunidadActualizables = {};
        if (cambioValorPropuesta) {
            const nuevoValorNegociado = parseMontoNoNegativoOpcional(req.body.nuevoValorNegociado);
            if (nuevoValorNegociado === null || nuevoValorNegociado === "invalido") {
                return res.status(400).json({ ok: false, message: "Debes indicar el nuevo valor negociado (no puede ser negativo)" });
            }
            datosOportunidadActualizables.montoEstimado = nuevoValorNegociado;
        }
        if (cambioServicio) {
            const resultadoTipoServicio = validarTipoServicio(req.body.nuevoServicio, req.body.nuevoServicioOtro);
            if (resultadoTipoServicio.error !== null) {
                return res.status(400).json({ ok: false, message: resultadoTipoServicio.error });
            }
            datosOportunidadActualizables.tipoServicio = resultadoTipoServicio.tipoServicio;
            datosOportunidadActualizables.tipoServicioOtro = resultadoTipoServicio.tipoServicioOtro;
        }
        if (cambioCantidadTrabajadores) {
            const nuevaCantidad = parseEnteroNoNegativoOpcional(req.body.nuevaCantidadTrabajadores);
            if (nuevaCantidad === null || nuevaCantidad === "invalido") {
                return res.status(400).json({
                    ok: false,
                    message: "Debes indicar la nueva cantidad de trabajadores (entero mayor o igual a cero)",
                });
            }
            datosOportunidadActualizables.cantidadTrabajadores = nuevaCantidad;
        }
        if (cambioFechaInicio) {
            const nuevaFecha = parseFecha(req.body.nuevaFechaInicio);
            if (!nuevaFecha) {
                return res.status(400).json({ ok: false, message: "Debes indicar la nueva fecha estimada de inicio" });
            }
            datosOportunidadActualizables.fechaInicioEstimada = nuevaFecha;
        }
        const datosEtapaNegociacion = {
            fechaRespuesta,
            estadoNegociacion: estadoNegociacion,
            descripcionCambiosSolicitados,
            cambioValorPropuesta,
            cambioServicio,
            cambioCantidadTrabajadores,
            cambioFechaInicio,
            proximaGestion: limpiarTexto(req.body.proximaGestion),
            fechaProximaGestion: parseFecha(req.body.fechaProximaGestion),
            observacionesNegociacion: limpiarTexto(req.body.observacionesNegociacion),
        };
        const operaciones = [
            prisma_1.prisma.datosEtapaNegociacionComercial.upsert({
                where: { oportunidadId: id },
                create: { oportunidadId: id, ...datosEtapaNegociacion },
                update: datosEtapaNegociacion,
            }),
        ];
        if (Object.keys(datosOportunidadActualizables).length > 0) {
            operaciones.push(prisma_1.prisma.oportunidadComercial.update({ where: { id }, data: datosOportunidadActualizables }));
        }
        await prisma_1.prisma.$transaction(operaciones);
        await registrarHistorialComercial({ oportunidadId: id, tipo: "EDICION_ETAPA_NEGOCIACION", usuarioId: req.usuario?.id });
        const oportunidadActualizada = await prisma_1.prisma.oportunidadComercial.findUnique({
            where: { id },
            include: INCLUDE_OPORTUNIDAD_COMERCIAL,
        });
        return res.json({
            ok: true,
            message: "Etapa Negociación actualizada correctamente",
            oportunidad: oportunidadActualizada ? serializarOportunidadComercial(oportunidadActualizada) : null,
        });
    }
    catch (error) {
        console.error("ERROR ACTUALIZAR ETAPA NEGOCIACION COMERCIAL:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al actualizar la etapa Negociación",
        });
    }
};
exports.actualizarEtapaNegociacion = actualizarEtapaNegociacion;
const INCLUDE_CIERRE_GANADA = {
    OportunidadReclutamiento: {
        include: {
            Cargo: { select: { id: true, nombre: true } },
            ReclutadorResponsable: { select: { id: true, nombre: true } },
        },
    },
};
const serializarCierreGanada = (datos) => ({
    fechaCierre: datos?.fechaCierre ?? null,
    valorFinalAcordado: datos?.valorFinalAcordado ?? null,
    servicioContratado: datos?.servicioContratado ?? null,
    servicioContratadoOtro: datos?.servicioContratadoOtro ?? null,
    cantidadFinalTrabajadores: datos?.cantidadFinalTrabajadores ?? null,
    fechaInicioEstimada: datos?.fechaInicioEstimada ?? null,
    duracionServicio: datos?.duracionServicio ?? null,
    estadoAcuerdo: datos?.estadoAcuerdo ?? null,
    observacionesFinales: datos?.observacionesFinales ?? null,
    crearOportunidadReclutamiento: datos?.crearOportunidadReclutamiento ?? false,
    oportunidadReclutamiento: datos?.OportunidadReclutamiento
        ? {
            id: String(datos.OportunidadReclutamiento.id),
            cargoNombre: datos.OportunidadReclutamiento.Cargo.nombre,
            estado: datos.OportunidadReclutamiento.estado,
            fechaInicio: datos.OportunidadReclutamiento.fechaInicio,
            reclutadorNombre: datos.OportunidadReclutamiento.ReclutadorResponsable.nombre,
        }
        : null,
    updatedAt: datos?.updatedAt ?? null,
});
const obtenerCierreGanada = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ ok: false, message: "ID de oportunidad inválido" });
        }
        const oportunidad = await prisma_1.prisma.oportunidadComercial.findUnique({
            where: { id },
            include: { DatosCierreGanada: { include: INCLUDE_CIERRE_GANADA } },
        });
        if (!oportunidad) {
            return res.status(404).json({ ok: false, message: "Oportunidad comercial no encontrada" });
        }
        return res.json({
            ok: true,
            cierreGanada: serializarCierreGanada(oportunidad.DatosCierreGanada),
        });
    }
    catch (error) {
        console.error("ERROR OBTENER CIERRE GANADA COMERCIAL:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al obtener el cierre Ganada",
        });
    }
};
exports.obtenerCierreGanada = obtenerCierreGanada;
/**
 * A diferencia de las demás etapas, el cierre de Ganada SÍ guarda su propio
 * registro completo (fecha, valor, servicio, cantidad, etc.) además de
 * sincronizar la oportunidad: es un cierre permanente que debe quedar visible
 * en el detalle, no un simple flag de "hubo un cambio". Todo ocurre en una
 * única transacción (cierre + oportunidad + reclutamiento si corresponde)
 * para no dejar datos a medias si algo falla. El guard de `etapa !== "GANADA"`
 * al inicio evita reprocesar un cierre ya confirmado (evita duplicar la
 * oportunidad de reclutamiento si se reintenta la llamada).
 */
const confirmarCierreGanada = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ ok: false, message: "ID de oportunidad inválido" });
        }
        const oportunidad = await prisma_1.prisma.oportunidadComercial.findUnique({ where: { id } });
        if (!oportunidad) {
            return res.status(404).json({ ok: false, message: "Oportunidad comercial no encontrada" });
        }
        if (oportunidad.etapa === "GANADA") {
            return res.status(400).json({ ok: false, message: "La oportunidad ya está cerrada como Ganada" });
        }
        const fechaCierre = parseFecha(req.body.fechaCierre);
        if (!fechaCierre) {
            return res.status(400).json({ ok: false, message: "La fecha de cierre es obligatoria" });
        }
        const valorFinalAcordado = parseMontoNoNegativoOpcional(req.body.valorFinalAcordado);
        if (valorFinalAcordado === null || valorFinalAcordado === "invalido") {
            return res.status(400).json({ ok: false, message: "El valor final acordado es obligatorio y no puede ser negativo" });
        }
        const resultadoServicio = validarTipoServicio(req.body.servicioContratado, req.body.servicioContratadoOtro);
        if (resultadoServicio.error !== null) {
            return res.status(400).json({ ok: false, message: resultadoServicio.error });
        }
        const cantidadFinalTrabajadores = parseEnteroNoNegativoOpcional(req.body.cantidadFinalTrabajadores);
        if (cantidadFinalTrabajadores === null || cantidadFinalTrabajadores === "invalido") {
            return res.status(400).json({ ok: false, message: "La cantidad final de trabajadores es obligatoria (entero mayor o igual a cero)" });
        }
        const fechaInicioEstimada = parseFecha(req.body.fechaInicioEstimada);
        if (!fechaInicioEstimada) {
            return res.status(400).json({ ok: false, message: "La fecha estimada de inicio es obligatoria" });
        }
        const estadoAcuerdo = limpiarTexto(req.body.estadoAcuerdo)?.toUpperCase() ?? null;
        if (!estadoAcuerdo || !ESTADOS_ACUERDO_VALIDOS.includes(estadoAcuerdo)) {
            return res.status(400).json({
                ok: false,
                message: `El estado del acuerdo debe ser uno de: ${ESTADOS_ACUERDO_VALIDOS.join(", ")}`,
            });
        }
        const crearOportunidadReclutamiento = parseBooleanRequerido(req.body.crearOportunidadReclutamiento);
        if (crearOportunidadReclutamiento === null) {
            return res.status(400).json({ ok: false, message: "Debes indicar si se crea una oportunidad en el Funnel de Reclutamiento (sí o no)" });
        }
        let datosReclutamiento = null;
        if (crearOportunidadReclutamiento) {
            if (!oportunidad.empresaId) {
                return res.status(400).json({
                    ok: false,
                    message: "Debes tener una empresa registrada (no un prospecto) para crear una oportunidad de reclutamiento",
                });
            }
            const cargoId = Number(req.body.cargoId);
            if (Number.isNaN(cargoId)) {
                return res.status(400).json({ ok: false, message: "El cargo o perfil requerido es obligatorio" });
            }
            const cargo = await prisma_1.prisma.cargo.findUnique({ where: { id: cargoId } });
            if (!cargo) {
                return res.status(400).json({ ok: false, message: "El cargo seleccionado no existe" });
            }
            const jornada = String(req.body.jornada ?? "").toUpperCase();
            if (!JORNADAS_VALIDAS.includes(jornada)) {
                return res.status(400).json({ ok: false, message: `La jornada debe ser una de: ${JORNADAS_VALIDAS.join(", ")}` });
            }
            const cantidadNecesaria = parseEnteroPositivo(req.body.cantidadNecesaria);
            if (!cantidadNecesaria) {
                return res.status(400).json({ ok: false, message: "Las personas necesarias deben ser un entero mayor a cero" });
            }
            const fechaInicioReclutamiento = parseFecha(req.body.reclutamientoFechaInicio);
            if (!fechaInicioReclutamiento) {
                return res.status(400).json({ ok: false, message: "La fecha estimada de inicio del reclutamiento es obligatoria" });
            }
            const reclutadorResponsableId = Number(req.body.reclutadorResponsableId);
            if (Number.isNaN(reclutadorResponsableId)) {
                return res.status(400).json({ ok: false, message: "El reclutador responsable es obligatorio" });
            }
            const reclutador = await prisma_1.prisma.usuario.findUnique({ where: { id: reclutadorResponsableId } });
            if (!reclutador) {
                return res.status(400).json({ ok: false, message: "El reclutador responsable seleccionado no existe" });
            }
            datosReclutamiento = {
                cargoId,
                jornada: jornada,
                cantidadNecesaria,
                fechaInicio: fechaInicioReclutamiento,
                reclutadorResponsableId,
                region: limpiarTexto(req.body.region),
                comuna: limpiarTexto(req.body.comuna),
            };
        }
        const datosCierre = {
            fechaCierre,
            valorFinalAcordado,
            servicioContratado: resultadoServicio.tipoServicio,
            servicioContratadoOtro: resultadoServicio.tipoServicioOtro,
            cantidadFinalTrabajadores,
            fechaInicioEstimada,
            duracionServicio: limpiarTexto(req.body.duracionServicio),
            estadoAcuerdo: estadoAcuerdo,
            observacionesFinales: limpiarTexto(req.body.observacionesFinales),
            crearOportunidadReclutamiento,
        };
        await prisma_1.prisma.$transaction(async (tx) => {
            let oportunidadReclutamientoId = null;
            if (datosReclutamiento && oportunidad.empresaId) {
                // OportunidadReclutamiento no tiene columnas propias de región/comuna
                // (solo vía Sucursal, que no intentamos adivinar acá) — se guardan
                // como contexto en observaciones para no perder el dato.
                const contextoUbicacion = [
                    datosReclutamiento.region ? `Región: ${datosReclutamiento.region}` : null,
                    datosReclutamiento.comuna ? `Comuna: ${datosReclutamiento.comuna}` : null,
                ]
                    .filter((valor) => valor !== null)
                    .join(" · ");
                const nuevaReclutamiento = await tx.oportunidadReclutamiento.create({
                    data: {
                        empresaId: oportunidad.empresaId,
                        cargoId: datosReclutamiento.cargoId,
                        cantidadNecesaria: datosReclutamiento.cantidadNecesaria,
                        jornada: datosReclutamiento.jornada,
                        fechaInicio: datosReclutamiento.fechaInicio,
                        reclutadorResponsableId: datosReclutamiento.reclutadorResponsableId,
                        observaciones: contextoUbicacion || null,
                    },
                });
                oportunidadReclutamientoId = nuevaReclutamiento.id;
                if (req.usuario?.id) {
                    await tx.oportunidadHistorial.create({
                        data: {
                            oportunidadId: nuevaReclutamiento.id,
                            tipo: "CREACION",
                            usuarioId: req.usuario.id,
                            estadoNuevo: nuevaReclutamiento.estado,
                            detalle: `Creada automáticamente al cerrar como Ganada la oportunidad comercial #${id}`,
                        },
                    });
                }
            }
            await tx.datosCierreGanadaComercial.upsert({
                where: { oportunidadId: id },
                create: { oportunidadId: id, ...datosCierre, oportunidadReclutamientoId },
                update: { ...datosCierre, oportunidadReclutamientoId },
            });
            await tx.oportunidadComercial.update({
                where: { id },
                data: {
                    etapa: "GANADA",
                    tipoServicio: resultadoServicio.tipoServicio,
                    tipoServicioOtro: resultadoServicio.tipoServicioOtro,
                    cantidadTrabajadores: cantidadFinalTrabajadores,
                    fechaInicioEstimada,
                    montoEstimado: valorFinalAcordado,
                },
            });
        });
        const oportunidadActualizada = await prisma_1.prisma.oportunidadComercial.findUnique({
            where: { id },
            include: INCLUDE_OPORTUNIDAD_COMERCIAL,
        });
        await registrarHistorialComercial({
            oportunidadId: id,
            tipo: "CIERRE_GANADA",
            usuarioId: req.usuario?.id,
            etapaAnterior: oportunidad.etapa,
            etapaNueva: "GANADA",
        });
        return res.json({
            ok: true,
            message: "Oportunidad cerrada como Ganada correctamente",
            oportunidad: oportunidadActualizada ? serializarOportunidadComercial(oportunidadActualizada) : null,
        });
    }
    catch (error) {
        console.error("ERROR CONFIRMAR CIERRE GANADA COMERCIAL:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al confirmar el cierre Ganada",
        });
    }
};
exports.confirmarCierreGanada = confirmarCierreGanada;
