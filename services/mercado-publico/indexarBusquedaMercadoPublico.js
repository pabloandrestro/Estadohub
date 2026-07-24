import {
    armarTextoIndiceMp,
    textoIndiceEsUtil,
} from "@/lib/mercado-publico/textoIndiceMp";
import {
    busquedaAiHabilitada,
    generarVectorBusqueda,
} from "@/lib/ai/generarVectorBusqueda";
import {
    guardarIndiceBusqueda,
    listarPendientesIndice,
} from "@/services/supabase/mercadoPublicoRepo";

/** Por defecto no tocamos OC (~140k): primero CA y licitaciones. */
const MODULOS_DEFAULT = ["compra-agil", "licitaciones"];
const MODULOS_PERMITIDOS = ["compra-agil", "licitaciones", "ordenes-compra"];

function esperar(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Indexa un lote de filas con detalle → vector_busqueda / texto_indice / indexado_en.
 * No altera listados ni la API pública de búsqueda.
 */
export async function indexarBusquedaMercadoPublico({
    limite = 3,
    pausaMs = 400,
    modulos = MODULOS_DEFAULT,
} = {}) {
    if (!busquedaAiHabilitada()) {
        throw new Error(
            "Búsqueda AI deshabilitada. Defina AI_BUSQUEDA_ENABLE=true para indexar."
        );
    }

    const listaModulos = (Array.isArray(modulos) && modulos.length > 0
        ? modulos
        : MODULOS_DEFAULT
    ).filter((m) => MODULOS_PERMITIDOS.includes(m));

    if (listaModulos.length === 0) {
        throw new Error(`Módulos inválidos. Use: ${MODULOS_PERMITIDOS.join(", ")}`);
    }

    const procesados = [];
    const cupoPorModulo = Math.max(1, Math.ceil(limite / listaModulos.length));

    for (const modulo of listaModulos) {
        if (procesados.length >= limite) break;

        const faltan = limite - procesados.length;
        const candidatos = await listarPendientesIndice(
            modulo,
            Math.min(faltan, cupoPorModulo)
        );

        for (const fila of candidatos) {
            if (procesados.length >= limite) break;

            if (procesados.length > 0 && pausaMs > 0) {
                await esperar(pausaMs);
            }

            const codigo = fila.codigo;

            try {
                const texto = armarTextoIndiceMp(modulo, fila);

                if (!textoIndiceEsUtil(texto)) {
                    // Marca revisada sin vector: no reintenta en bucle infinito.
                    await guardarIndiceBusqueda(modulo, codigo, {
                        textoIndice: null,
                        vectorLista: null,
                    });
                    procesados.push({
                        modulo,
                        codigo,
                        detalle: "omitido_sin_texto",
                        ok: true,
                    });
                    continue;
                }

                const vector = await generarVectorBusqueda(texto);
                await guardarIndiceBusqueda(modulo, codigo, {
                    textoIndice: texto,
                    vectorLista: vector,
                });

                procesados.push({
                    modulo,
                    codigo,
                    detalle: "indexado",
                    ok: true,
                });
            } catch (error) {
                procesados.push({
                    modulo,
                    codigo,
                    detalle: "error",
                    ok: false,
                    error: error?.message || String(error),
                });
            }
        }
    }

    return {
        limite,
        modulos: listaModulos,
        procesados,
        indexados: procesados.filter((p) => p.detalle === "indexado").length,
        omitidos: procesados.filter((p) => p.detalle === "omitido_sin_texto").length,
        errores: procesados.filter((p) => !p.ok).length,
    };
}

export { MODULOS_DEFAULT, MODULOS_PERMITIDOS };
