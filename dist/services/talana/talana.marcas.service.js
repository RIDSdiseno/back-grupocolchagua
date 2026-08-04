"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.probarConexionTalana = probarConexionTalana;
exports.listarTrabajadoresQueMarcanTalana = listarTrabajadoresQueMarcanTalana;
const talana_client_1 = require("../../config/talana/talana.client");
const talana_empresas_1 = require("../../constants/talana.empresas");
const talana_rut_1 = require("../../utils/talana/talana.rut");
function construirNombreCompleto(persona) {
    return [
        persona.nombre,
        persona.apellidoPaterno,
        persona.apellidoMaterno,
    ]
        .filter((valor) => typeof valor === "string" &&
        valor.trim().length > 0)
        .map((valor) => valor.trim())
        .join(" ");
}
async function esperarEntreSolicitudes() {
    const delayMs = Number(process.env.TALANA_REQUEST_DELAY_MS ?? 0);
    if (!Number.isFinite(delayMs) ||
        delayMs <= 0) {
        return;
    }
    await new Promise((resolve) => {
        setTimeout(resolve, delayMs);
    });
}
async function probarConexionTalana() {
    const response = await talana_client_1.talanaApi.get("/mark/", {
        params: {
            empresa: talana_empresas_1.EMPRESAS_TALANA.GRUPO_COLCHAGUA,
            page: 1,
            page_size: 1,
        },
    });
    const resultados = Array.isArray(response.data.results)
        ? response.data.results
        : [];
    return {
        conectado: true,
        empresaId: talana_empresas_1.EMPRESAS_TALANA.GRUPO_COLCHAGUA,
        totalMarcaciones: Number(response.data.count ?? 0),
        resultadosRecibidos: resultados.length,
    };
}
async function listarTrabajadoresQueMarcanTalana(desde, hasta, empresaId) {
    (0, talana_empresas_1.validarEmpresaTalana)(empresaId);
    const pageSize = Number(process.env.TALANA_MARK_PAGE_SIZE ?? 100);
    const limitePaginas = Number(process.env.TALANA_MARK_MAX_PAGES ?? 5000);
    if (!Number.isInteger(pageSize) ||
        pageSize <= 0) {
        throw new Error("TALANA_MARK_PAGE_SIZE debe ser un entero mayor que cero");
    }
    if (!Number.isInteger(limitePaginas) ||
        limitePaginas <= 0) {
        throw new Error("TALANA_MARK_MAX_PAGES debe ser un entero mayor que cero");
    }
    const trabajadores = new Map();
    let pagina = 1;
    let totalMarcaciones = 0;
    let marcacionesProcesadas = 0;
    let paginasProcesadas = 0;
    while (pagina <= limitePaginas) {
        console.log(`[Talana] Marcaciones empresa=${empresaId}, ` +
            `desde=${desde}, hasta=${hasta}, página=${pagina}`);
        const response = await talana_client_1.talanaApi.get("/mark/", {
            params: {
                empresa: empresaId,
                desde,
                hasta,
                page: pagina,
                page_size: pageSize,
            },
        });
        paginasProcesadas++;
        const marcas = Array.isArray(response.data.results)
            ? response.data.results
            : [];
        totalMarcaciones = Number(response.data.count ?? marcas.length);
        if (marcas.length === 0) {
            break;
        }
        for (const marca of marcas) {
            marcacionesProcesadas++;
            if (!marca.person ||
                !marca.person.id ||
                !marca.person.rut ||
                !marca.TS) {
                continue;
            }
            const clave = String(marca.person.id);
            const existente = trabajadores.get(clave);
            if (!existente) {
                trabajadores.set(clave, {
                    talanaPersonaId: marca.person.id,
                    rut: (0, talana_rut_1.formatearRutParaTalana)(marca.person.rut),
                    nombre: marca.person.nombre,
                    apellidoPaterno: marca.person.apellidoPaterno,
                    apellidoMaterno: marca.person.apellidoMaterno,
                    nombreCompleto: construirNombreCompleto(marca.person),
                    cantidadMarcaciones: 1,
                    primeraMarcacion: marca.TS,
                    ultimaMarcacion: marca.TS,
                    oficinas: typeof marca.office === "number"
                        ? [marca.office]
                        : [],
                    metodosMarcacion: typeof marca.markingMethod ===
                        "string" &&
                        marca.markingMethod.trim().length > 0
                        ? [marca.markingMethod.trim()]
                        : [],
                });
                continue;
            }
            existente.cantidadMarcaciones++;
            const timestampMarca = new Date(marca.TS).getTime();
            const timestampPrimera = new Date(existente.primeraMarcacion).getTime();
            const timestampUltima = new Date(existente.ultimaMarcacion).getTime();
            if (Number.isFinite(timestampMarca) &&
                timestampMarca < timestampPrimera) {
                existente.primeraMarcacion = marca.TS;
            }
            if (Number.isFinite(timestampMarca) &&
                timestampMarca > timestampUltima) {
                existente.ultimaMarcacion = marca.TS;
            }
            if (typeof marca.office === "number" &&
                !existente.oficinas.includes(marca.office)) {
                existente.oficinas.push(marca.office);
            }
            const metodo = typeof marca.markingMethod === "string"
                ? marca.markingMethod.trim()
                : "";
            if (metodo &&
                !existente.metodosMarcacion.includes(metodo)) {
                existente.metodosMarcacion.push(metodo);
            }
        }
        console.log(`[Talana] Página ${pagina}: ` +
            `${marcas.length} marcas, ` +
            `${trabajadores.size} trabajadores únicos`);
        if (marcacionesProcesadas >= totalMarcaciones ||
            marcas.length < pageSize) {
            break;
        }
        pagina++;
        await esperarEntreSolicitudes();
    }
    if (pagina > limitePaginas) {
        throw new Error(`Se superó el límite de ${limitePaginas} páginas de marcaciones`);
    }
    const lista = Array.from(trabajadores.values()).sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, "es", {
        sensitivity: "base",
    }));
    return {
        empresaId,
        desde,
        hasta,
        totalMarcaciones,
        marcacionesProcesadas,
        paginasProcesadas,
        trabajadoresUnicos: lista.length,
        trabajadores: lista,
    };
}
