"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerDashboardComercial = exports.obtenerDashboardReclutamiento = void 0;
const prisma_1 = require("../lib/prisma");
const ESTADOS_FUNNEL = [
    "NUEVOS",
    "PRESELECCION",
    "ENTREVISTA",
    "SELECCIONADOS",
    "DOCUMENTACION",
    "CONTRATADOS",
];
// Mismas 6 etapas activas que ETAPAS_OPORTUNIDAD_COMERCIAL del funnel — "PERDIDA"
// no es una etapa real (es el flag `perdida`, ver comentario en `obtenerDashboardComercial`),
// por eso se agrega aparte, siempre al final, como bucket virtual del dashboard.
const ETAPAS_FUNNEL_COMERCIAL = [
    "PROSPECTO",
    "CONTACTADO",
    "PROPUESTA",
    "NEGOCIACION",
    "GANADA",
];
const TIPO_SERVICIO_OTRO_DASHBOARD = "Otro";
const TIPOS_SERVICIO_OFICIALES_DASHBOARD = [
    "Outsourcing",
    "Servicios Transitorios",
    "Formación y Capacitación",
    "Reclutamiento y Selección",
    "Reposición Multimarca",
];
const ESTADOS_NEGOCIACION_DASHBOARD = [
    "EN_NEGOCIACION",
    "SOLICITA_CAMBIOS",
    "SOLICITA_REBAJA",
    "EN_EVALUACION",
    "ACEPTA_CONDICIONES",
    "RECHAZA_PROPUESTA",
];
const parseFecha = (valor) => {
    if (!valor)
        return null;
    const fecha = new Date(String(valor));
    return Number.isNaN(fecha.getTime()) ? null : fecha;
};
const redondear1 = (valor) => Math.round(valor * 10) / 10;
const promedio = (valores) => valores.length ? redondear1(valores.reduce((acc, v) => acc + v, 0) / valores.length) : null;
const diasEntre = (inicio, fin) => Math.round((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
const construirFiltros = (query) => {
    const where = {};
    if (query.empresaId)
        where.empresaId = Number(query.empresaId);
    if (query.reclutadorId)
        where.reclutadorResponsableId = Number(query.reclutadorId);
    if (query.cargoId)
        where.cargoId = Number(query.cargoId);
    if (query.oportunidadId)
        where.id = Number(query.oportunidadId);
    if (query.estado) {
        where.estado = String(query.estado);
    }
    if (query.ciudad || query.comuna) {
        where.Sucursal = {
            ...(query.ciudad ? { ciudad: { equals: String(query.ciudad), mode: "insensitive" } } : {}),
            ...(query.comuna ? { comuna: { equals: String(query.comuna), mode: "insensitive" } } : {}),
        };
    }
    const fechaDesde = parseFecha(query.fechaDesde);
    const fechaHasta = parseFecha(query.fechaHasta);
    if (fechaDesde || fechaHasta) {
        where.fechaInicio = {
            ...(fechaDesde ? { gte: fechaDesde } : {}),
            ...(fechaHasta ? { lte: fechaHasta } : {}),
        };
    }
    return where;
};
const calcularTotalPostulantes = (o) => {
    const web = o.Empleo?._count.postulaciones ?? 0;
    const otros = o.FuentesExternas.reduce((acc, f) => acc + f.cantidad, 0);
    return web + otros;
};
const principalDeConteo = (conteo) => {
    let principal = null;
    for (const [motivo, cantidad] of conteo) {
        if (!principal || cantidad > principal.cantidad)
            principal = { motivo, cantidad };
    }
    return principal;
};
const todosDeConteo = (conteo) => Array.from(conteo.entries())
    .map(([motivo, cantidad]) => ({ motivo, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad);
const obtenerDashboardReclutamiento = async (req, res) => {
    try {
        const where = construirFiltros(req.query);
        const oportunidades = await prisma_1.prisma.oportunidadReclutamiento.findMany({
            where,
            relationLoadStrategy: "join",
            include: {
                Empresa: { select: { id: true, nombre: true } },
                ReclutadorResponsable: { select: { id: true, nombre: true } },
                Empleo: { select: { _count: { select: { postulaciones: true } } } },
                FuentesExternas: { select: { cantidad: true } },
                Entrevista: {
                    select: {
                        aptos: true,
                        noAptos: true,
                        MotivosNoAptitud: { select: { motivos: true, motivoPersonalizado: true, cantidad: true } },
                    },
                },
                Documentacion: { select: { documentacionCompleta: true } },
                Contratados: {
                    select: {
                        personasContratadas: true,
                        personasNoIngresaron: true,
                        fechaCierreProceso: true,
                        MotivosNoIngreso: { select: { motivo: true, motivoOtro: true, cantidad: true } },
                    },
                },
            },
        });
        const totalOportunidades = oportunidades.length;
        const oportunidadesActivas = oportunidades.filter((o) => o.estado !== "CONTRATADOS").length;
        const personasSolicitadas = oportunidades.reduce((acc, o) => acc + o.cantidadNecesaria, 0);
        const totalPostulantes = oportunidades.reduce((acc, o) => acc + calcularTotalPostulantes(o), 0);
        const personasContratadas = oportunidades.reduce((acc, o) => acc + (o.Contratados?.personasContratadas ?? 0), 0);
        const vacantesPendientes = oportunidades.reduce((acc, o) => acc + Math.max(o.cantidadNecesaria - (o.Contratados?.personasContratadas ?? 0), 0), 0);
        const tiemposContratacion = oportunidades
            .filter((o) => o.Contratados?.fechaCierreProceso)
            .map((o) => diasEntre(o.fechaInicio, o.Contratados.fechaCierreProceso));
        const kpis = {
            oportunidadesActivas,
            personasSolicitadas,
            totalPostulantes,
            personasContratadas,
            vacantesPendientes,
            tiempoPromedioContratacion: promedio(tiemposContratacion),
        };
        const funnelGeneral = ESTADOS_FUNNEL.map((estado) => ({
            estado,
            cantidad: oportunidades.filter((o) => o.estado === estado).length,
        }));
        const porReclutador = new Map();
        const porEmpresa = new Map();
        for (const o of oportunidades) {
            const contratadas = o.Contratados?.personasContratadas ?? 0;
            const vacantes = Math.max(o.cantidadNecesaria - contratadas, 0);
            const tiempo = o.Contratados?.fechaCierreProceso ? diasEntre(o.fechaInicio, o.Contratados.fechaCierreProceso) : null;
            if (!porReclutador.has(o.reclutadorResponsableId)) {
                porReclutador.set(o.reclutadorResponsableId, {
                    nombre: o.ReclutadorResponsable.nombre,
                    empresas: new Set(),
                    oportunidades: 0,
                    oportunidadesActivas: 0,
                    personasSolicitadas: 0,
                    personasContratadas: 0,
                    vacantesPendientes: 0,
                    tiempos: [],
                });
            }
            const grupoReclutador = porReclutador.get(o.reclutadorResponsableId);
            grupoReclutador.empresas.add(o.empresaId);
            grupoReclutador.oportunidades += 1;
            if (o.estado !== "CONTRATADOS")
                grupoReclutador.oportunidadesActivas += 1;
            grupoReclutador.personasSolicitadas += o.cantidadNecesaria;
            grupoReclutador.personasContratadas += contratadas;
            grupoReclutador.vacantesPendientes += vacantes;
            if (tiempo !== null)
                grupoReclutador.tiempos.push(tiempo);
            if (!porEmpresa.has(o.empresaId)) {
                porEmpresa.set(o.empresaId, {
                    nombre: o.Empresa.nombre,
                    empresas: new Set(),
                    oportunidades: 0,
                    oportunidadesActivas: 0,
                    personasSolicitadas: 0,
                    personasContratadas: 0,
                    vacantesPendientes: 0,
                    tiempos: [],
                });
            }
            const grupoEmpresa = porEmpresa.get(o.empresaId);
            grupoEmpresa.oportunidades += 1;
            grupoEmpresa.personasSolicitadas += o.cantidadNecesaria;
            grupoEmpresa.personasContratadas += contratadas;
            grupoEmpresa.vacantesPendientes += vacantes;
        }
        const rendimientoPorReclutador = Array.from(porReclutador.entries())
            .map(([id, g]) => ({
            reclutadorId: String(id),
            reclutador: g.nombre,
            empresasAtendidas: g.empresas.size,
            oportunidadesActivas: g.oportunidadesActivas,
            personasSolicitadas: g.personasSolicitadas,
            personasContratadas: g.personasContratadas,
            vacantesPendientes: g.vacantesPendientes,
            tiempoPromedioContratacion: promedio(g.tiempos),
            porcentajeExito: g.personasSolicitadas > 0 ? redondear1((g.personasContratadas / g.personasSolicitadas) * 100) : 0,
        }))
            .sort((a, b) => b.personasContratadas - a.personasContratadas);
        const resultadoPorEmpresa = Array.from(porEmpresa.entries())
            .map(([id, g]) => ({
            empresaId: String(id),
            empresa: g.nombre,
            oportunidades: g.oportunidades,
            personasSolicitadas: g.personasSolicitadas,
            personasContratadas: g.personasContratadas,
            vacantesPendientes: g.vacantesPendientes,
            porcentajeCobertura: g.personasSolicitadas > 0 ? redondear1((g.personasContratadas / g.personasSolicitadas) * 100) : 0,
        }))
            .sort((a, b) => b.personasContratadas - a.personasContratadas);
        const oportunidadesCubiertasCompletamente = oportunidades.filter((o) => (o.Contratados?.personasContratadas ?? 0) >= o.cantidadNecesaria).length;
        const oportunidadesParcialmenteCubiertas = oportunidades.filter((o) => {
            const contratadas = o.Contratados?.personasContratadas ?? 0;
            return contratadas > 0 && contratadas < o.cantidadNecesaria;
        }).length;
        const oportunidadesNoCubiertas = totalOportunidades - oportunidadesCubiertasCompletamente - oportunidadesParcialmenteCubiertas;
        const oportunidadesPendientes = oportunidadesParcialmenteCubiertas + oportunidadesNoCubiertas;
        const conteoMotivoDescarte = new Map();
        for (const o of oportunidades) {
            if (!o.motivoDescarte || o.postulantesDescartados <= 0)
                continue;
            const clave = o.motivoDescarte === "Otro" && o.motivoDescarteOtro ? o.motivoDescarteOtro : o.motivoDescarte;
            conteoMotivoDescarte.set(clave, (conteoMotivoDescarte.get(clave) ?? 0) + o.postulantesDescartados);
        }
        const conteoMotivoEntrevista = new Map();
        for (const o of oportunidades) {
            for (const fila of o.Entrevista?.MotivosNoAptitud ?? []) {
                for (const motivo of fila.motivos) {
                    const clave = motivo === "Otro" && fila.motivoPersonalizado ? fila.motivoPersonalizado : motivo;
                    conteoMotivoEntrevista.set(clave, (conteoMotivoEntrevista.get(clave) ?? 0) + fila.cantidad);
                }
            }
        }
        const conteoMotivoNoIngreso = new Map();
        for (const o of oportunidades) {
            for (const fila of o.Contratados?.MotivosNoIngreso ?? []) {
                const clave = fila.motivo === "Otro" && fila.motivoOtro ? fila.motivoOtro : fila.motivo;
                conteoMotivoNoIngreso.set(clave, (conteoMotivoNoIngreso.get(clave) ?? 0) + fila.cantidad);
            }
        }
        const indicadoresAdicionales = {
            oportunidadesCubiertasCompletamente,
            oportunidadesParcialmenteCubiertas,
            oportunidadesNoCubiertas,
            oportunidadesPendientes,
            principalMotivoDescarte: principalDeConteo(conteoMotivoDescarte),
            principalMotivoNoAprobacionEntrevista: principalDeConteo(conteoMotivoEntrevista),
            principalMotivoNoIngreso: principalDeConteo(conteoMotivoNoIngreso),
            motivosDescarte: todosDeConteo(conteoMotivoDescarte),
            motivosNoAprobacionEntrevista: todosDeConteo(conteoMotivoEntrevista),
            motivosNoIngreso: todosDeConteo(conteoMotivoNoIngreso),
        };
        return res.json({
            ok: true,
            dashboard: {
                totalOportunidades,
                kpis,
                funnelGeneral,
                rendimientoPorReclutador,
                resultadoPorEmpresa,
                indicadoresAdicionales,
            },
        });
    }
    catch (error) {
        console.error("ERROR OBTENER DASHBOARD RECLUTAMIENTO:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al obtener el dashboard de reclutamiento",
        });
    }
};
exports.obtenerDashboardReclutamiento = obtenerDashboardReclutamiento;
const construirFiltrosComercial = (query) => {
    const where = {};
    if (query.empresaId)
        where.empresaId = Number(query.empresaId);
    if (query.ejecutivoId)
        where.ejecutivoId = Number(query.ejecutivoId);
    if (query.servicio)
        where.tipoServicio = String(query.servicio);
    if (query.oportunidadId)
        where.id = Number(query.oportunidadId);
    // "PERDIDA" no es una etapa real (es el flag `perdida`, no un valor de
    // `etapa` — ver comentario en `obtenerDashboardComercial`). Para cualquier
    // otra etapa se exige además `perdida: false`, así una negociación perdida
    // nunca cuenta dentro del bucket activo "Negociación".
    if (query.estado) {
        const estado = String(query.estado).toUpperCase();
        if (estado === "PERDIDA") {
            where.perdida = true;
        }
        else {
            where.etapa = estado;
            where.perdida = false;
        }
    }
    const fechaDesde = parseFecha(query.fechaDesde);
    const fechaHasta = parseFecha(query.fechaHasta);
    if (fechaDesde || fechaHasta) {
        where.createdAt = {
            ...(fechaDesde ? { gte: fechaDesde } : {}),
            ...(fechaHasta ? { lte: fechaHasta } : {}),
        };
    }
    return where;
};
/**
 * Dashboard analítico del Funnel Comercial: solo lectura sobre
 * `OportunidadComercial`, sin tablas ni endpoints nuevos más allá de este.
 * Mismo criterio que `obtenerDashboardReclutamiento`: un solo `findMany` +
 * agregación en JS con `Map`, nada de `groupBy` ni SQL crudo.
 */
const obtenerDashboardComercial = async (req, res) => {
    try {
        const where = construirFiltrosComercial(req.query);
        const oportunidades = await prisma_1.prisma.oportunidadComercial.findMany({
            where,
            relationLoadStrategy: "join",
            include: {
                Empresa: { select: { id: true, nombre: true } },
                Ejecutivo: { select: { id: true, nombre: true } },
                DatosCierreGanada: { select: { fechaCierre: true } },
                DatosNegociacion: { select: { estadoNegociacion: true } },
            },
        });
        const totalOportunidades = oportunidades.length;
        const oportunidadesActivas = oportunidades.filter((o) => o.etapa !== "GANADA" && !o.perdida);
        const oportunidadesGanadasArr = oportunidades.filter((o) => o.etapa === "GANADA");
        const oportunidadesPerdidasArr = oportunidades.filter((o) => o.perdida);
        const montoTotalPipeline = oportunidadesActivas.reduce((acc, o) => acc + (o.montoEstimado ?? 0), 0);
        const empresasProspectadas = new Set(oportunidades.filter((o) => o.empresaId !== null).map((o) => o.empresaId)).size;
        const tiemposCierre = oportunidadesGanadasArr
            .filter((o) => o.DatosCierreGanada?.fechaCierre)
            .map((o) => diasEntre(o.createdAt, o.DatosCierreGanada.fechaCierre));
        const kpis = {
            oportunidadesActivas: oportunidadesActivas.length,
            montoTotalPipeline,
            empresasProspectadas,
            oportunidadesGanadas: oportunidadesGanadasArr.length,
            oportunidadesPerdidas: oportunidadesPerdidasArr.length,
            tiempoPromedioCierre: promedio(tiemposCierre),
        };
        const funnelComercial = [
            ...ETAPAS_FUNNEL_COMERCIAL.map((etapa) => ({
                etapa,
                cantidad: etapa === "GANADA"
                    ? oportunidadesGanadasArr.length
                    : oportunidades.filter((o) => o.etapa === etapa && !o.perdida).length,
            })),
            { etapa: "PERDIDA", cantidad: oportunidadesPerdidasArr.length },
        ];
        const porEjecutivo = new Map();
        for (const o of oportunidades) {
            if (!porEjecutivo.has(o.ejecutivoId)) {
                porEjecutivo.set(o.ejecutivoId, {
                    nombre: o.Ejecutivo.nombre,
                    empresas: new Set(),
                    oportunidadesActivas: 0,
                    ganadas: 0,
                    perdidas: 0,
                    tiempos: [],
                });
            }
            const grupo = porEjecutivo.get(o.ejecutivoId);
            if (o.empresaId !== null)
                grupo.empresas.add(o.empresaId);
            if (o.etapa !== "GANADA" && !o.perdida)
                grupo.oportunidadesActivas += 1;
            if (o.etapa === "GANADA")
                grupo.ganadas += 1;
            if (o.perdida)
                grupo.perdidas += 1;
            if (o.etapa === "GANADA" && o.DatosCierreGanada?.fechaCierre) {
                grupo.tiempos.push(diasEntre(o.createdAt, o.DatosCierreGanada.fechaCierre));
            }
        }
        const rendimientoPorEjecutivo = Array.from(porEjecutivo.entries())
            .map(([id, g]) => {
            const decididas = g.ganadas + g.perdidas;
            return {
                ejecutivoId: String(id),
                ejecutivo: g.nombre,
                empresasAtendidas: g.empresas.size,
                oportunidadesActivas: g.oportunidadesActivas,
                ganadas: g.ganadas,
                perdidas: g.perdidas,
                tiempoPromedioCierre: promedio(g.tiempos),
                porcentajeExito: decididas > 0 ? redondear1((g.ganadas / decididas) * 100) : 0,
            };
        })
            .sort((a, b) => b.ganadas - a.ganadas);
        const porServicio = new Map();
        for (const servicio of TIPOS_SERVICIO_OFICIALES_DASHBOARD) {
            porServicio.set(servicio, { oportunidades: 0, ganadas: 0, perdidas: 0, montoTotal: 0 });
        }
        for (const o of oportunidades) {
            const clave = o.tipoServicio === TIPO_SERVICIO_OTRO_DASHBOARD && o.tipoServicioOtro ? o.tipoServicioOtro : o.tipoServicio;
            if (!porServicio.has(clave))
                porServicio.set(clave, { oportunidades: 0, ganadas: 0, perdidas: 0, montoTotal: 0 });
            const grupo = porServicio.get(clave);
            grupo.oportunidades += 1;
            if (o.etapa === "GANADA")
                grupo.ganadas += 1;
            if (o.perdida)
                grupo.perdidas += 1;
            grupo.montoTotal += o.montoEstimado ?? 0;
        }
        const resultadoPorServicio = Array.from(porServicio.entries()).map(([servicio, g]) => {
            const decididas = g.ganadas + g.perdidas;
            return {
                servicio,
                oportunidades: g.oportunidades,
                ganadas: g.ganadas,
                perdidas: g.perdidas,
                montoTotal: g.montoTotal,
                porcentajeExito: decididas > 0 ? redondear1((g.ganadas / decididas) * 100) : 0,
            };
        });
        // `motivoPerdida` es texto libre (sin categorías fijas): se agrupa tal
        // cual quedó guardado, sin normalización inteligente de mayúsculas/tildes.
        const conteoMotivoPerdida = new Map();
        for (const o of oportunidadesPerdidasArr) {
            const motivo = o.motivoPerdida?.trim();
            if (!motivo)
                continue;
            conteoMotivoPerdida.set(motivo, (conteoMotivoPerdida.get(motivo) ?? 0) + 1);
        }
        const motivosPerdida = todosDeConteo(conteoMotivoPerdida);
        const conteoEstadoNegociacion = new Map();
        for (const estado of ESTADOS_NEGOCIACION_DASHBOARD)
            conteoEstadoNegociacion.set(estado, 0);
        for (const o of oportunidades) {
            const estado = o.DatosNegociacion?.estadoNegociacion;
            if (!estado)
                continue;
            conteoEstadoNegociacion.set(estado, (conteoEstadoNegociacion.get(estado) ?? 0) + 1);
        }
        const estadoNegociacion = Array.from(conteoEstadoNegociacion.entries()).map(([estado, cantidad]) => ({
            estado,
            cantidad,
        }));
        return res.json({
            ok: true,
            dashboard: {
                totalOportunidades,
                kpis,
                funnelComercial,
                rendimientoPorEjecutivo,
                resultadoPorServicio,
                motivosPerdida,
                estadoNegociacion,
            },
        });
    }
    catch (error) {
        console.error("ERROR OBTENER DASHBOARD COMERCIAL:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al obtener el dashboard comercial",
        });
    }
};
exports.obtenerDashboardComercial = obtenerDashboardComercial;
