import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
    busquedaAiHabilitada,
    generarVectorBusqueda,
} from "@/lib/ai/generarVectorBusqueda";
import { sanitizarBusquedaMp } from "@/lib/mercado-publico/consultaListadoMp";
import {
    DIAS_RETENCION_CA,
    MAX_HITS_SIMILITUD,
} from "@/lib/mercado-publico/constantesMp";
import {
    expandirTextoEmbed,
    rerankHibridoMp,
    terminosRecuperacionLexica,
} from "@/lib/mercado-publico/rerankHibridoMp";
import { interpretarConsultaMp } from "@/lib/mercado-publico/resolverConsultaMp";

const MODULOS_SEMANTICOS = new Set(["compra-agil", "licitaciones"]);
const MIN_CHARS_CONSULTA = 3;
const MAX_HITS = MAX_HITS_SIMILITUD;
/** Cuántos candidatos trae la vía keyword (se mezclan con el RPC). */
const MAX_HITS_LEXICO = 100;
/** Score de similitud inventado para filas que solo llegaron por keyword. */
const SIMILITUD_SOLO_LEXICO = 0.28;
const SIMILITUD_MINIMA = 0.2;

const COLUMNAS_LEXICO_CA =
    "codigo, nombre, organismo, region, monto, estado, fecha_cierre, descripcion, texto_indice";
const COLUMNAS_LEXICO_LIC =
    "codigo, nombre, organismo, region_unidad, monto_estimado, estado, fecha_cierre, descripcion, texto_indice";

/** Log corto del pipeline (parseo → embed → recuperación → rerank). */
export function logPipeline(payload) {
    console.log("[MP búsqueda]", payload);
}

/** True si el módulo admite ranking por vectores y hay query usable. */
export function convieneBusquedaPorSimilitud(modulo, q) {
    if (!MODULOS_SEMANTICOS.has(modulo)) return false;
    if (!busquedaAiHabilitada()) return false;
    const texto = sanitizarBusquedaMp(q);
    return texto.length >= MIN_CHARS_CONSULTA;
}

function vectorComoParametroRpc(vectorLista) {
    return `[${vectorLista.join(",")}]`;
}

function sanearTerminoIlike(term) {
    return String(term || "")
        .replace(/[%_,.()"'\\]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 48);
}

function orIlikeCampos(terminos, columnas) {
    const partes = [];
    for (const crudo of terminos) {
        const t = sanearTerminoIlike(crudo);
        if (t.length < MIN_CHARS_CONSULTA) continue;
        for (const col of columnas) {
            partes.push(`${col}.ilike.%${t}%`);
        }
    }
    return partes.join(",");
}

function limiteRetencionIso(dias) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - dias);
    fecha.setHours(0, 0, 0, 0);
    return fecha.toISOString();
}

/** Aplica monto/vigencia en JS: PostgREST solo admite un `.or()` por query. */
function acotarCandidatosLexicos(filas, {
    montoMaximo,
    montoCampo,
    soloVigentes = false,
    limite,
}) {
    const ahora = Date.now();
    let out = filas;
    if (soloVigentes) {
        out = out.filter((r) => {
            if (r.fecha_cierre == null) return true;
            return new Date(r.fecha_cierre).getTime() >= ahora;
        });
    }
    if (montoMaximo != null) {
        out = out.filter((r) => {
            const m = r[montoCampo];
            return m == null || Number(m) <= montoMaximo;
        });
    }
    return out.slice(0, limite);
}

/** Vía keyword: ILIKE sobre nombre/descripcion/texto_indice + mismos filtros del RPC. */
async function buscarCandidatosLexicos(supabase, modulo, {
    terminos,
    montoMaximo,
    regionFiltro,
    estadoFiltro,
    limite,
}) {
    if (!terminos.length) return [];

    const colsTexto = ["nombre", "descripcion", "texto_indice"];
    const orExpr = orIlikeCampos(terminos, colsTexto);
    if (!orExpr) return [];

    const fetchLimit = Math.min(
        montoMaximo != null || modulo === "licitaciones" ? limite * 3 : limite,
        300
    );

    if (modulo === "compra-agil") {
        let q = supabase
            .from("compra_agil")
            .select(COLUMNAS_LEXICO_CA)
            .gte("fecha_creacion", limiteRetencionIso(DIAS_RETENCION_CA));

        if (regionFiltro) q = q.ilike("region", regionFiltro);
        if (estadoFiltro) q = q.eq("estado", estadoFiltro);

        const { data, error } = await q.or(orExpr).limit(fetchLimit);
        if (error) throw error;
        return acotarCandidatosLexicos(data ?? [], {
            montoMaximo,
            montoCampo: "monto",
            limite,
        });
    }

    if (modulo === "licitaciones") {
        let q = supabase.from("licitaciones").select(COLUMNAS_LEXICO_LIC);

        if (regionFiltro) q = q.ilike("region_unidad", regionFiltro);
        if (estadoFiltro) q = q.eq("estado", estadoFiltro);

        const { data, error } = await q.or(orExpr).limit(fetchLimit);
        if (error) throw error;
        return acotarCandidatosLexicos(data ?? [], {
            montoMaximo,
            montoCampo: "monto_estimado",
            soloVigentes: true,
            limite,
        });
    }

    return [];
}

/** Junta RPC + keyword; si está en las dos, se queda el score del vector. */
function fusionarCandidatos(vectorHits, lexicoHits) {
    const mapa = new Map();

    for (const row of vectorHits) {
        const codigo = String(row?.codigo ?? "").trim();
        if (!codigo) continue;
        mapa.set(codigo, { ...row, fuenteRecuperacion: "vector" });
    }

    for (const row of lexicoHits) {
        const codigo = String(row?.codigo ?? "").trim();
        if (!codigo) continue;
        const prev = mapa.get(codigo);
        if (prev) {
            mapa.set(codigo, {
                ...prev,
                texto_indice: prev.texto_indice || row.texto_indice || null,
                descripcion: prev.descripcion || row.descripcion || null,
                fuenteRecuperacion: "ambos",
            });
            continue;
        }
        mapa.set(codigo, {
            ...row,
            similitud:
                row.similitud != null ? Number(row.similitud) : SIMILITUD_SOLO_LEXICO,
            fuenteRecuperacion: "lexico",
        });
    }

    return [...mapa.values()];
}

async function rpcParecidos(supabase, modulo, {
    vector,
    limite,
    montoMaximo,
    regionFiltro,
    estadoFiltro,
}) {
    if (modulo === "compra-agil") {
        const { data, error } = await supabase.rpc("buscar_compras_agiles_parecidas", {
            vector_consulta: vectorComoParametroRpc(vector),
            max_resultados: limite,
            similitud_minima: SIMILITUD_MINIMA,
            monto_maximo: montoMaximo,
            region_filtro: regionFiltro,
            estado_filtro: estadoFiltro,
            solo_ultimos_dias: DIAS_RETENCION_CA,
        });
        if (error) throw error;
        return data ?? [];
    }

    if (modulo === "licitaciones") {
        const { data, error } = await supabase.rpc("buscar_licitaciones_parecidas", {
            vector_consulta: vectorComoParametroRpc(vector),
            max_resultados: limite,
            similitud_minima: SIMILITUD_MINIMA,
            monto_maximo: montoMaximo,
            region_filtro: regionFiltro,
            estado_filtro: estadoFiltro,
            solo_vigentes: true,
        });
        if (error) throw error;
        return data ?? [];
    }

    return [];
}

/**
 * Parsea la frase, busca por vector + keyword en paralelo y reordena.
 * @returns {Promise<{ parecidos: Array, interpretacion: object }>}
 */
export async function consultarParecidosMp(modulo, {
    textoConsulta,
    estado = "",
    region = "",
    maxResultados = MAX_HITS,
} = {}) {
    const interpretacion = await interpretarConsultaMp(textoConsulta, {
        estadoUi: estado,
        regionUi: modulo === "compra-agil" ? region : "",
    });

    const textoSemantico =
        sanitizarBusquedaMp(interpretacion.textoSemantico) ||
        sanitizarBusquedaMp(textoConsulta);

    if (textoSemantico.length < MIN_CHARS_CONSULTA) {
        logPipeline({
            modulo,
            q: textoConsulta,
            ruta: "hibrida_abortada",
            motivo: "texto_semantico_corto",
            parseo: interpretacion.fuente,
        });
        return { parecidos: [], interpretacion };
    }

    const textoParaEmbed = expandirTextoEmbed(textoSemantico);
    const vector = await generarVectorBusqueda(textoParaEmbed);
    const supabase = getSupabaseAdmin();
    const limite = Math.max(1, Math.min(Number(maxResultados) || MAX_HITS, MAX_HITS));

    const regionFiltro = interpretacion.region || null;
    const estadoFiltro = interpretacion.estado || null;
    const montoMaximo =
        interpretacion.montoMaximo != null ? interpretacion.montoMaximo : null;
    const terminosLex = terminosRecuperacionLexica(textoSemantico);

    const filtrosComunes = {
        montoMaximo,
        regionFiltro,
        estadoFiltro,
    };

    let lexicoError = null;
    const [vectorHits, lexicoHits] = await Promise.all([
        rpcParecidos(supabase, modulo, {
            vector,
            limite,
            ...filtrosComunes,
        }),
        buscarCandidatosLexicos(supabase, modulo, {
            terminos: terminosLex,
            limite: Math.min(MAX_HITS_LEXICO, limite),
            ...filtrosComunes,
        }).catch((err) => {
            lexicoError = err?.message || String(err);
            return [];
        }),
    ]);

    let parecidos = fusionarCandidatos(vectorHits, lexicoHits);

    // El RPC solo filtra máximo; el mínimo (si vino del parseo) se aplica acá.
    if (interpretacion.montoMinimo != null) {
        const min = interpretacion.montoMinimo;
        parecidos = parecidos.filter((row) => {
            const monto = row.monto ?? row.monto_estimado;
            return monto == null || Number(monto) >= min;
        });
    }

    const rerank = rerankHibridoMp(parecidos, textoSemantico);

    logPipeline({
        modulo,
        q: textoConsulta,
        ruta: "hibrida",
        parseo: interpretacion.fuente,
        parseoDetalle: interpretacion.parseoDetalle,
        filtrosPreEmbed: {
            textoSemantico,
            montoMaximo: interpretacion.montoMaximo,
            montoMinimo: interpretacion.montoMinimo,
            region: interpretacion.regionEtiqueta || regionFiltro,
            estado: estadoFiltro,
        },
        embed: {
            expandio: textoParaEmbed !== textoSemantico,
            texto: textoParaEmbed.slice(0, 100),
        },
        recuperacion: {
            rpcVector: vectorHits.length,
            lexicoIlike: lexicoHits.length,
            terminosIlike: terminosLex,
            lexicoError,
            merge: parecidos.length,
        },
        rerank: {
            modo: rerank.filtro,
            n: rerank.filas.length,
            nHitsLexicos: rerank.filas.filter((r) => r.matchLexico).length,
        },
    });

    return { parecidos: rerank.filas, interpretacion };
}

export { MAX_HITS };
