import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { tieneDetalleCompraAgil, tieneDetalleEnPayload } from "@/services/mercado-publico/mercadoPublicoMapper";
import {
    licitacionUiADb,
    licitacionDbAUi,
    ordenCompraUiADb,
    ordenCompraDbAUi,
    COLUMNAS_LISTADO_ORDEN_COMPRA,
    COLUMNAS_LISTADO_LICITACION,
    COLUMNAS_LISTADO_COMPRA_AGIL,
    compraAgilUiADb,
    compraAgilDbAUi,
} from "@/services/supabase/mercadoPublicoDbMapper";
import {
    columnasBusquedaMp,
    resolverOrdenMp,
    sanitizarBusquedaMp,
} from "@/lib/mercado-publico/consultaListadoMp";
import { ordenarFilasMp } from "@/lib/mercado-publico/ordenarFilasMp";
import { ESTADOS_FACETA, REGIONES_FACETA, fusionarFacetas } from "@/lib/mercado-publico/facetasMp";
import {
    convieneBusquedaPorSimilitud,
    consultarParecidosMp,
    MAX_HITS,
    logPipeline,
} from "@/services/mercado-publico/buscarPorSimilitudMp";
import { busquedaAiHabilitada } from "@/lib/ai/generarVectorBusqueda";
import { DIAS_RETENCION_CA } from "@/lib/mercado-publico/constantesMp";

const PAGE_SIZE_DEFAULT = 5;
const PAGE_SIZE_MAX = 50;

/** Campos UI para reordenar el set semántico cuando eligen precio/fecha. */
const CAMPOS_ORDEN_UI = {
    licitaciones: { monto: "montoEstimado", fecha: "fechaCierre" },
    "ordenes-compra": { monto: "montoTotal", fecha: "fecha" },
    "compra-agil": { monto: "monto", fecha: "fechaCierre" },
};

const TABLAS = {
    licitaciones: {
        tabla: "licitaciones",
        uiADb: licitacionUiADb,
        dbAUi: licitacionDbAUi,
        columnasListado: COLUMNAS_LISTADO_LICITACION,
        orden: { columna: "fecha_cierre", ascendente: false },
        soloVigentes: true,
    },
    "ordenes-compra": {
        tabla: "ordenes_compra",
        uiADb: ordenCompraUiADb,
        dbAUi: ordenCompraDbAUi,
        columnasListado: COLUMNAS_LISTADO_ORDEN_COMPRA,
        orden: { columna: "fecha", ascendente: false },
    },
    "compra-agil": {
        tabla: "compra_agil",
        uiADb: compraAgilUiADb,
        dbAUi: compraAgilDbAUi,
        columnasListado: COLUMNAS_LISTADO_COMPRA_AGIL,
        orden: { columna: "fecha_cierre", ascendente: false },
        diasRetencion: DIAS_RETENCION_CA,
        columnaRetencion: "fecha_creacion",
    },
};

function getConfig(modulo) {
    const config = TABLAS[modulo];
    if (!config) throw new Error(`Módulo Supabase no soportado: ${modulo}`);
    return config;
}

function limiteDesde(dias) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - dias);
    fecha.setHours(0, 0, 0, 0);
    return fecha.toISOString();
}

function ahoraIso() {
    return new Date().toISOString();
}


function deduplicarPorCodigo(filasUi = []) {
    const mapa = new Map();

    for (const fila of filasUi) {
        const codigo = String(fila?.codigo ?? "").trim();
        if (!codigo) continue;
        mapa.set(codigo, fila);
    }

    return Array.from(mapa.values());
}

function tieneProductosUi(productos) {
    return Array.isArray(productos) && productos.length > 0;
}

// si ya abrieron "ver mas", el listado del sync no deberia borrar ese detalle
function mergeCompraAgilConExistente(nueva, existente) {
    if (!existente) return nueva;

    const detalleGuardado = tieneDetalleCompraAgil(existente.payload ?? existente._raw);

    return {
        ...nueva,
        descripcion: nueva.descripcion ?? existente.descripcion ?? null,
        productos: tieneProductosUi(nueva.productos)
            ? nueva.productos
            : (existente.productos ?? []),
        direccionEntrega: nueva.direccionEntrega ?? existente.direccionEntrega ?? null,
        plazoEntregaDias: nueva.plazoEntregaDias ?? existente.plazoEntregaDias ?? null,
        totalOfertasRecibidas:
            nueva.totalOfertasRecibidas ?? existente.totalOfertasRecibidas ?? null,
        estadoConvocatoria: nueva.estadoConvocatoria ?? existente.estadoConvocatoria ?? null,
        fechaCierrePrimerLlamado:
            nueva.fechaCierrePrimerLlamado ?? existente.fechaCierrePrimerLlamado ?? null,
        fechaCierreSegundoLlamado:
            nueva.fechaCierreSegundoLlamado ?? existente.fechaCierreSegundoLlamado ?? null,
        _raw: detalleGuardado ? (existente.payload ?? existente._raw) : nueva._raw,
    };
}

async function obtenerFilasExistentesPorCodigo(modulo, codigos = []) {
    if (codigos.length === 0) return new Map();

    const { tabla, dbAUi } = getConfig(modulo);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .from(tabla)
        .select("*")
        .in("codigo", codigos);

    if (error) throw error;

    const mapa = new Map();
    for (const row of data ?? []) {
        mapa.set(row.codigo, dbAUi(row));
    }

    return mapa;
}

export async function upsertFilasMercadoPublico(modulo, filasUi = []) {
    const { tabla, uiADb } = getConfig(modulo);
    const unicas = deduplicarPorCodigo(filasUi);

    if (unicas.length === 0) return { insertadas: 0 };

    let filasFinales = unicas;

    if (modulo === "compra-agil") {
        const codigos = unicas.map((f) => f.codigo);
        const existentes = await obtenerFilasExistentesPorCodigo(modulo, codigos);
        filasFinales = unicas.map((fila) =>
            mergeCompraAgilConExistente(fila, existentes.get(fila.codigo))
        );
    }

    const rows = filasFinales.map(uiADb);
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
        .from(tabla)
        .upsert(rows, { onConflict: "codigo" });

    if (error) throw error;

    return { insertadas: rows.length };
}

export async function borrarRegistrosAntiguos(modulo) {
    const config = getConfig(modulo);
    const supabase = getSupabaseAdmin();

    if (config.soloVigentes) {
        const { count, error } = await supabase
            .from(config.tabla)
            .delete({ count: "exact" })
            .lt("fecha_cierre", ahoraIso());

        if (error) throw error;
        return { eliminadas: count ?? 0 };
    }

    const { diasRetencion, columnaRetencion, tabla } = config;
    if (!diasRetencion) return { eliminadas: 0 };

    const { count, error } = await supabase
        .from(tabla)
        .delete({ count: "exact" })
        .lt(columnaRetencion, limiteDesde(diasRetencion));

    if (error) throw error;
    return { eliminadas: count ?? 0 };
}

function aplicarFiltrosBase(consulta, config) {
    if (config.soloVigentes) {
        return consulta.gte("fecha_cierre", ahoraIso());
    }
    if (config.diasRetencion) {
        return consulta.gte(config.columnaRetencion, limiteDesde(config.diasRetencion));
    }
    return consulta;
}

function aplicarFiltrosUsuario(consulta, modulo, { q, estado, region }) {
    let c = consulta;
    const busqueda = sanitizarBusquedaMp(q);

    if (busqueda) {
        const cols = columnasBusquedaMp(modulo);
        const orExpr = cols.map((col) => `${col}.ilike.%${busqueda}%`).join(",");
        c = c.or(orExpr);
    }

    if (estado) {
        c = c.eq("estado", estado);
    }

    if (region && modulo === "compra-agil") {
        c = c.eq("region", region);
    }

    return c;
}

/** KPI no crítico: si el RPC falla, no debe tumbar el listado completo. */
function extraerMontoTotalOferta(res) {
    if (!res) return null;
    if (res.error) {
        console.warn("[listado MP] suma monto oferta falló:", res.error.message);
        return null;
    }
    return Number(res.data ?? 0);
}

/**
 * Listado paginado + filtros en BD.
 * Mantiene total del módulo (solo filtros base) y total filtrado (base + usuario).
 * Con q + AI_BUSQUEDA_ENABLE: intenta ranking semántico (CA/licitaciones); si falla o 0 hits → ilike.
 */
export async function listarFilasMercadoPublico(
    modulo,
    {
        q = "",
        estado = "",
        region = "",
        orden = "",
        page = 1,
        pageSize = PAGE_SIZE_DEFAULT,
        incluirFacetas = false,
    } = {}
) {
    const config = getConfig(modulo);
    const { tabla, dbAUi, columnasListado } = config;
    const supabase = getSupabaseAdmin();

    const size = Math.min(
        PAGE_SIZE_MAX,
        Math.max(1, Number(pageSize) || PAGE_SIZE_DEFAULT)
    );
    const pagina = Math.max(1, Number(page) || 1);
    const from = (pagina - 1) * size;
    const to = from + size - 1;

    const ordenResuelto = resolverOrdenMp(modulo, orden, config.orden);
    const filtrosUsuario = { q, estado, region };
    const busqueda = sanitizarBusquedaMp(q);
    const hayFiltroUsuario = Boolean(busqueda || estado || (region && modulo === "compra-agil"));

    const countModuloPromise = aplicarFiltrosBase(
        supabase.from(tabla).select("codigo", { count: "exact", head: true }),
        config
    );
    const facetasPromise = incluirFacetas
        ? listarFacetasLivianas(supabase, modulo, config)
        : Promise.resolve(null);
    // Igual que facetas: caro de calcular y no cambia con la página/búsqueda,
    // así que solo se pide junto con las facetas (carga única por sesión).
    const sumaMontoPromise = incluirFacetas
        ? supabase.rpc("mp_suma_monto_oferta", { p_modulo: modulo })
        : Promise.resolve(null);

    // Ranking por parecido; si eligen precio/fecha, reordena ese set
    if (convieneBusquedaPorSimilitud(modulo, q)) {
        try {
            const { parecidos, interpretacion } = await consultarParecidosMp(modulo, {
                textoConsulta: busqueda,
                estado,
                region: modulo === "compra-agil" ? region : "",
                maxResultados: MAX_HITS,
            });

            if (parecidos.length > 0) {
                const codigosOrdenados = parecidos.map((p) => p.codigo).filter(Boolean);
                const { data: filasDb, error: errorFilas } = await supabase
                    .from(tabla)
                    .select(columnasListado)
                    .in("codigo", codigosOrdenados);

                if (errorFilas) throw errorFilas;

                const porCodigo = new Map((filasDb ?? []).map((row) => [row.codigo, row]));
                let filasUi = codigosOrdenados
                    .map((codigo) => porCodigo.get(codigo))
                    .filter(Boolean)
                    .map(dbAUi);

                const camposUi = CAMPOS_ORDEN_UI[modulo] ?? {
                    monto: "monto",
                    fecha: "fechaCierre",
                };
                if (orden && (orden.startsWith("precio") || orden.startsWith("fecha"))) {
                    filasUi = ordenarFilasMp(
                        filasUi,
                        orden,
                        camposUi.monto,
                        camposUi.fecha
                    );
                }

                const totalFiltrados = filasUi.length;
                // `to` es inclusivo (estilo .range); slice es exclusivo → from + size
                const filasPagina = filasUi.slice(from, from + size);

                const [countModuloRes, facetas, sumaMontoRes] = await Promise.all([
                    countModuloPromise,
                    facetasPromise,
                    sumaMontoPromise,
                ]);
                if (countModuloRes.error) throw countModuloRes.error;

                const estadosEnPagina = filasPagina.map((f) => f.estado).filter(Boolean);
                const regionesEnPagina = filasPagina.map((f) => f.region).filter(Boolean);
                const estadosBase = facetas?.estados ?? ESTADOS_FACETA[modulo] ?? [];
                const regionesBase =
                    modulo === "compra-agil" ? (facetas?.regiones ?? REGIONES_FACETA) : [];

                return {
                    filas: filasPagina,
                    totalRegistros: countModuloRes.count ?? totalFiltrados,
                    totalFiltrados,
                    pagina,
                    pageSize: size,
                    estados: fusionarFacetas(estadosBase, estadosEnPagina),
                    regiones:
                        modulo === "compra-agil"
                            ? fusionarFacetas(regionesBase, regionesEnPagina)
                            : [],
                    montoTotalOferta: extraerMontoTotalOferta(sumaMontoRes),
                    busquedaPorSimilitud: true,
                    interpretacionConsulta: {
                        textoSemantico: interpretacion.textoSemantico,
                        montoMaximo: interpretacion.montoMaximo,
                        montoMinimo: interpretacion.montoMinimo,
                        region: interpretacion.regionEtiqueta || null,
                        fuente: interpretacion.fuente,
                    },
                };
            }
            // Sin hits → ilike (códigos exactos u otros casos sin vecinos)
            logPipeline({
                modulo,
                q: busqueda,
                ruta: "ilike",
                motivo: "hibrida_0_hits",
            });
        } catch (error) {
            console.warn(
                `[listado MP] similitud falló (${modulo}), uso ilike:`,
                error?.message || error
            );
            logPipeline({
                modulo,
                q: busqueda,
                ruta: "ilike",
                motivo: "hibrida_error",
                error: error?.message || String(error),
            });
        }
    } else if (busqueda) {
        const motivo = !busquedaAiHabilitada()
            ? "ai_off"
            : modulo !== "compra-agil" && modulo !== "licitaciones"
              ? "modulo_sin_semantica"
              : "q_corta";
        logPipeline({
            modulo,
            q: busqueda,
            ruta: "ilike",
            motivo,
        });
    }

    // Página filtrada (ilike / filtros clásicos)
    let consulta = aplicarFiltrosBase(
        supabase.from(tabla).select(columnasListado, { count: "exact" }),
        config
    );
    consulta = aplicarFiltrosUsuario(consulta, modulo, filtrosUsuario);
    consulta = consulta
        .order(ordenResuelto.columna, {
            ascending: ordenResuelto.ascendente,
            ...(ordenResuelto.nullsFirst !== undefined
                ? { nullsFirst: ordenResuelto.nullsFirst }
                : {}),
        })
        .range(from, to);

    const [countModuloRes, dataRes, facetas, sumaMontoRes] = await Promise.all([
        countModuloPromise,
        consulta,
        facetasPromise,
        sumaMontoPromise,
    ]);

    if (countModuloRes.error) throw countModuloRes.error;
    if (dataRes.error) throw dataRes.error;

    const filas = (dataRes.data ?? []).map(dbAUi);
    const totalFiltrados = dataRes.count ?? filas.length;
    const totalRegistros = countModuloRes.count ?? (hayFiltroUsuario ? totalFiltrados : filas.length);

    const estadosEnPagina = filas.map((f) => f.estado).filter(Boolean);
    const regionesEnPagina = filas.map((f) => f.region).filter(Boolean);

    const estadosBase = facetas?.estados ?? ESTADOS_FACETA[modulo] ?? [];
    const regionesBase =
        modulo === "compra-agil" ? (facetas?.regiones ?? REGIONES_FACETA) : [];

    return {
        filas,
        totalRegistros,
        totalFiltrados,
        pagina,
        pageSize: size,
        estados: fusionarFacetas(estadosBase, estadosEnPagina),
        regiones:
            modulo === "compra-agil"
                ? fusionarFacetas(regionesBase, regionesEnPagina)
                : [],
        montoTotalOferta: extraerMontoTotalOferta(sumaMontoRes),
        busquedaPorSimilitud: false,
    };
}

/** Facetas sin arrastrar payload: catálogo + sample liviano en CA/licitaciones. */
async function listarFacetasLivianas(supabase, modulo, config) {
    const catalogoEstados = ESTADOS_FACETA[modulo] ?? [];

    // OC: no escanear 140k filas
    if (modulo === "ordenes-compra") {
        return { estados: catalogoEstados, regiones: [] };
    }

    const cols = modulo === "compra-agil" ? "estado, region" : "estado";
    let q = aplicarFiltrosBase(
        supabase.from(config.tabla).select(cols),
        config
    );
    q = q.limit(8000);

    const { data, error } = await q;
    if (error) {
        return {
            estados: catalogoEstados,
            regiones: modulo === "compra-agil" ? REGIONES_FACETA : [],
        };
    }

    const estados = fusionarFacetas(
        catalogoEstados,
        (data ?? []).map((r) => r.estado)
    );
    const regiones =
        modulo === "compra-agil"
            ? fusionarFacetas(
                  REGIONES_FACETA,
                  (data ?? []).map((r) => r.region)
              )
            : [];

    return { estados, regiones };
}

export async function obtenerFilaPorCodigo(modulo, codigo) {
    const config = getConfig(modulo);
    const { tabla, dbAUi } = config;
    const supabase = getSupabaseAdmin();

    let consulta = supabase
        .from(tabla)
        .select("*")
        .eq("codigo", codigo);

    if (config.soloVigentes) {
        consulta = consulta.gte("fecha_cierre", ahoraIso());
    }

    const { data, error } = await consulta.maybeSingle();
    if (error) throw error;
    return data ? dbAUi(data) : null;
}

/**
 * OC: sin fecha = pendiente de detalle.
 * Tras un intento fallido se marca payload._detalleNoDisponible para no rebloquear la cola.
 */
export async function marcarOrdenCompraDetalleNoDisponible(codigo) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from("ordenes_compra")
        .select("payload")
        .eq("codigo", codigo)
        .maybeSingle();

    if (error) throw error;
    if (!data) return;

    const payloadActual =
        data.payload && typeof data.payload === "object" ? data.payload : {};

    const { error: errorUpdate } = await supabase
        .from("ordenes_compra")
        .update({
            payload: {
                ...payloadActual,
                _detalleNoDisponible: true,
            },
        })
        .eq("codigo", codigo);

    if (errorUpdate) throw errorUpdate;
}

// filas que aun no tienen payload de detalle (para el cron / script local)
export async function listarPendientesDetalle(modulo, limite = 10) {
    const config = getConfig(modulo);
    const { tabla, orden } = config;
    const supabase = getSupabaseAdmin();

    // Órdenes de compra: la fecha solo se setea con detalle → pendientes = fecha IS NULL
    if (modulo === "ordenes-compra") {
        const { data, error } = await supabase
            .from(tabla)
            .select("codigo, payload, fecha")
            .is("fecha", null)
            .order("sincronizado_en", { ascending: false })
            .limit(Math.max(limite * 20, 50));

        if (error) throw error;

        return (data ?? [])
            .filter((row) => row.payload?._detalleNoDisponible !== true)
            .slice(0, limite)
            .map((row) => ({ modulo, codigo: row.codigo }));
    }

    // Licitaciones: detalle = payload.Comprador (filtrar en DB, no solo top 150)
    if (modulo === "licitaciones") {
        const { data, error } = await supabase
            .from(tabla)
            .select("codigo, payload")
            .gte("fecha_cierre", ahoraIso())
            .is("payload->Comprador", null)
            .order("fecha_cierre", { ascending: true })
            .limit(limite);

        if (error) throw error;

        return (data ?? []).map((row) => ({ modulo, codigo: row.codigo }));
    }

    // Compra ágil / otros: recorrer páginas hasta juntar pendientes reales
    const pageSize = 100;
    const maxScan = 2000;
    const pendientes = [];

    for (let from = 0; from < maxScan && pendientes.length < limite; from += pageSize) {
        let consulta = supabase
            .from(tabla)
            .select("codigo, payload")
            .order(orden.columna, { ascending: orden.ascendente })
            .range(from, from + pageSize - 1);

        if (config.soloVigentes) {
            consulta = consulta.gte("fecha_cierre", ahoraIso());
        } else if (config.diasRetencion) {
            consulta = consulta.gte(config.columnaRetencion, limiteDesde(config.diasRetencion));
        }

        const { data, error } = await consulta;
        if (error) throw error;
        if (!data?.length) break;

        for (const row of data) {
            if (!tieneDetalleEnPayload(modulo, row.payload)) {
                pendientes.push({ modulo, codigo: row.codigo });
                if (pendientes.length >= limite) break;
            }
        }

        if (data.length < pageSize) break;
    }

    return pendientes;
}

/** Columnas mínimas para armar texto_indice (sin payload pesado innecesario). */
const COLUMNAS_PARA_INDICE = {
    licitaciones:
        "codigo, nombre, organismo, nombre_unidad, descripcion, items, payload, indexado_en",
    "compra-agil":
        "codigo, nombre, organismo, descripcion, productos, payload, indexado_en, " +
        "direccion_entrega, fecha_cierre_primer_llamado",
    "ordenes-compra":
        "codigo, nombre, comprador, proveedor, actividad_comprador, actividad_proveedor, " +
        "descripcion, items, fecha, payload, indexado_en",
};

function filaTieneDetalleParaIndice(modulo, row) {
    if (modulo === "ordenes-compra") {
        return Boolean(row?.fecha);
    }
    if (modulo === "compra-agil") {
        const productos = row?.productos;
        const tieneProductos = Array.isArray(productos) && productos.length > 0;
        return Boolean(
            row?.direccion_entrega ||
                row?.fecha_cierre_primer_llamado ||
                tieneProductos ||
                tieneDetalleEnPayload(modulo, row?.payload)
        );
    }
    return tieneDetalleEnPayload(modulo, row?.payload);
}

/** Filtra en DB para no gastar el scan en filas sin detalle. */
function aplicarFiltroDetalleIndice(consulta, modulo) {
    if (modulo === "licitaciones") {
        return consulta.not("payload->Comprador", "is", null);
    }
    if (modulo === "ordenes-compra") {
        return consulta.not("fecha", "is", null);
    }
    if (modulo === "compra-agil") {
        // Columnas de detalle (más fiable que solo payload anidado)
        return consulta.or(
            [
                "direccion_entrega.not.is.null",
                "fecha_cierre_primer_llamado.not.is.null",
                "productos.neq.[]",
            ].join(",")
        );
    }
    return consulta;
}

/**
 * Filas con detalle útil, dentro de la ventana del módulo, aún sin indexar.
 * Solo lectura — no modifica datos del cliente.
 */
export async function listarPendientesIndice(modulo, limite = 5) {
    const config = getConfig(modulo);
    const { tabla, orden } = config;
    const supabase = getSupabaseAdmin();
    const columnas = COLUMNAS_PARA_INDICE[modulo] || "codigo, nombre, descripcion, indexado_en";
    const cupo = Math.max(1, Math.min(limite, 20));
    const pageSize = 80;
    const maxScan = 1600;
    const pendientes = [];

    for (let from = 0; from < maxScan && pendientes.length < cupo; from += pageSize) {
        let consulta = supabase
            .from(tabla)
            .select(columnas)
            .is("indexado_en", null)
            .order(orden.columna, { ascending: orden.ascendente })
            .range(from, from + pageSize - 1);

        consulta = aplicarFiltrosBase(consulta, config);
        consulta = aplicarFiltroDetalleIndice(consulta, modulo);

        const { data, error } = await consulta;
        if (error) throw error;
        if (!data?.length) break;

        for (const row of data) {
            if (!filaTieneDetalleParaIndice(modulo, row)) continue;
            pendientes.push(row);
            if (pendientes.length >= cupo) break;
        }

        if (data.length < pageSize) break;
    }

    return pendientes;
}

/**
 * Guarda vector + texto. Solo toca las 3 columnas de índice (no pisa detalle ni payload).
 * @param {number[]|null} vectorLista array de 1536 floats, o null si se omite sin texto
 */
export async function guardarIndiceBusqueda(modulo, codigo, {
    textoIndice = null,
    vectorLista = null,
} = {}) {
    const { tabla } = getConfig(modulo);
    const supabase = getSupabaseAdmin();

    const patch = {
        texto_indice: textoIndice,
        indexado_en: ahoraIso(),
        vector_busqueda: Array.isArray(vectorLista) ? JSON.stringify(vectorLista) : null,
    };

    const { error } = await supabase
        .from(tabla)
        .update(patch)
        .eq("codigo", codigo);

    if (error) throw error;
    return { codigo, indexado: Boolean(vectorLista) };
}