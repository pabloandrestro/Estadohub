import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
    busquedaAiHabilitada,
    generarVectorBusqueda,
} from "@/lib/ai/generarVectorBusqueda";
import { sanitizarBusquedaMp } from "@/lib/mercado-publico/consultaListadoMp";
import { interpretarConsultaMp } from "@/lib/mercado-publico/resolverConsultaMp";

const MODULOS_SEMANTICOS = new Set(["compra-agil", "licitaciones"]);
const MIN_CHARS_CONSULTA = 3;
const MAX_HITS = 50;
/** Alineado a DIAS_RETENCION del repo de listado. */
const DIAS_RETENCION_CA = 7;

/** ¿Conviene intentar ranking por vectores? */
export function convieneBusquedaPorSimilitud(modulo, q) {
    if (!MODULOS_SEMANTICOS.has(modulo)) return false;
    if (!busquedaAiHabilitada()) return false;
    const texto = sanitizarBusquedaMp(q);
    return texto.length >= MIN_CHARS_CONSULTA;
}

function vectorComoParametroRpc(vectorLista) {
    return `[${vectorLista.join(",")}]`;
}

/**
 * Interpreta la frase (reglas ± LLM) y busca por similitud con filtros.
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

    const textoParaEmbed =
        sanitizarBusquedaMp(interpretacion.textoSemantico) ||
        sanitizarBusquedaMp(textoConsulta);

    if (textoParaEmbed.length < MIN_CHARS_CONSULTA) {
        return { parecidos: [], interpretacion };
    }

    const vector = await generarVectorBusqueda(textoParaEmbed);
    const supabase = getSupabaseAdmin();
    const limite = Math.max(1, Math.min(Number(maxResultados) || MAX_HITS, MAX_HITS));

    const regionFiltro = interpretacion.region || null;
    const estadoFiltro = interpretacion.estado || null;
    const montoMaximo =
        interpretacion.montoMaximo != null ? interpretacion.montoMaximo : null;

    let parecidos = [];

    if (modulo === "compra-agil") {
        const { data, error } = await supabase.rpc("buscar_compras_agiles_parecidas", {
            vector_consulta: vectorComoParametroRpc(vector),
            max_resultados: limite,
            similitud_minima: 0.22,
            monto_maximo: montoMaximo,
            region_filtro: regionFiltro,
            estado_filtro: estadoFiltro,
            solo_ultimos_dias: DIAS_RETENCION_CA,
        });
        if (error) throw error;
        parecidos = data ?? [];
    } else if (modulo === "licitaciones") {
        const { data, error } = await supabase.rpc("buscar_licitaciones_parecidas", {
            vector_consulta: vectorComoParametroRpc(vector),
            max_resultados: limite,
            similitud_minima: 0.22,
            monto_maximo: montoMaximo,
            region_filtro: regionFiltro,
            estado_filtro: estadoFiltro,
            solo_vigentes: true,
        });
        if (error) throw error;
        parecidos = data ?? [];
    }

    // RPC solo tiene monto_maximo; el mínimo se aplica aquí si vino del parseo.
    if (interpretacion.montoMinimo != null) {
        const min = interpretacion.montoMinimo;
        parecidos = parecidos.filter((row) => {
            const monto = row.monto ?? row.monto_estimado;
            return monto == null || Number(monto) >= min;
        });
    }

    return { parecidos, interpretacion };
}

export { MAX_HITS, MODULOS_SEMANTICOS };
