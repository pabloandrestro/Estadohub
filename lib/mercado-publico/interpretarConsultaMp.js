/**
 * Interpreta la frase del usuario → texto semántico + filtros (monto/región).
 * Siempre aplica reglas locales. LLM opcional (AI_PARSEO_LLM_ENABLE) no bloquea si falla.
 */

import { detectarRegionEnFrase } from "@/lib/mercado-publico/regionesChileMp";

const MILLON = 1_000_000;

function limpio(texto) {
    return String(texto ?? "")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * "5", "5.5", "2,5", "1.200" → número
 */
function parseNumeroEs(crudo) {
    let s = String(crudo ?? "").trim().replace(/\s/g, "");
    if (!s) return null;
    if (s.includes(",") && s.includes(".")) {
        // 1.200,5 → miles con punto
        s = s.replace(/\./g, "").replace(",", ".");
    } else if (s.includes(",")) {
        s = s.replace(",", ".");
    } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
        s = s.replace(/\./g, "");
    }
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
}

function aMontoClp(cantidad, unidad) {
    const n = parseNumeroEs(cantidad);
    if (n == null) return null;
    const u = sinTildes(unidad || "");
    if (u.startsWith("millon")) return Math.round(n * MILLON);
    if (u.startsWith("mil") && !u.startsWith("millon")) return Math.round(n * 1000);
    return Math.round(n);
}

function sinTildes(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLowerCase();
}

/**
 * Extrae montos tipo "menor a 5 millones", "hasta 2M", "entre 1 y 3 millones".
 * @returns {{ montoMinimo: number|null, montoMaximo: number|null, fragmentos: string[] }}
 */
function extraerMontos(frase) {
    let resto = frase;
    const fragmentos = [];
    let montoMinimo = null;
    let montoMaximo = null;

    const reEntre =
        /\bentre\s+(\d+(?:[.,]\d+)?)\s*(?:y|a|-)\s*(\d+(?:[.,]\d+)?)\s*(millones?|millon|mil|m\.?)\b/gi;
    resto = resto.replace(reEntre, (_, a, b, unidad) => {
        const min = aMontoClp(a, unidad);
        const max = aMontoClp(b, unidad);
        if (min != null) montoMinimo = min;
        if (max != null) montoMaximo = max;
        fragmentos.push(_.trim());
        return " ";
    });

    const reMax =
        /\b(?:con\s+)?(?:monto\s+)?(?:menor(?:es)?\s+a|hasta|bajo|inferior\s+a|maximo|máximo|max\.?|menos\s+de)\s+(\d+(?:[.,]\d+)?)\s*(millones?|millon|mil|m\.?)?\b/gi;
    resto = resto.replace(reMax, (match, cantidad, unidad) => {
        const max = aMontoClp(cantidad, unidad || "millones");
        if (max != null) montoMaximo = max;
        fragmentos.push(match.trim());
        return " ";
    });

    const reMin =
        /\b(?:mayor(?:es)?\s+a|desde|sobre|superior\s+a|minimo|mínimo|min\.?|mas\s+de|más\s+de)\s+(\d+(?:[.,]\d+)?)\s*(millones?|millon|mil|m\.?)?\b/gi;
    resto = resto.replace(reMin, (match, cantidad, unidad) => {
        const min = aMontoClp(cantidad, unidad || "millones");
        if (min != null) montoMinimo = min;
        fragmentos.push(match.trim());
        return " ";
    });

    // "menores a 2 millones" ya cubierto; "2 millones" suelto al final no lo tomamos como filtro.

    return { montoMinimo, montoMaximo, fragmentos, resto };
}

function quitarRuidoRegion(frase, matchedAlias) {
    if (!matchedAlias) return frase;
    const alias = matchedAlias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const reCtx = new RegExp(
        `\\b(?:en\\s+(?:la\\s+)?)?(?:region(?:es)?|región(?:es)?)?\\s*(?:de\\s+)?${alias}\\b`,
        "gi"
    );
    let out = frase.replace(reCtx, " ");
    const reSolo = new RegExp(`\\b${alias}\\b`, "gi");
    out = out.replace(reSolo, " ");
    out = out.replace(/\b(?:en\s+la\s+)?regi[oó]n(?:es)?\b/gi, " ");
    return out;
}

function limpiarTextoSemantico(texto) {
    return limpio(
        texto
            .replace(/\bmonto\b/gi, " ")
            .replace(/[^\p{L}\p{N}\s]/gu, " ")
            .replace(/\s+/g, " ")
    );
}

/**
 * Parseo solo con reglas (síncrono, sin red).
 * @param {string} fraseUsuario
 */
export function interpretarConsultaConReglas(fraseUsuario) {
    const original = limpio(fraseUsuario);
    if (!original) {
        return {
            textoSemantico: "",
            montoMinimo: null,
            montoMaximo: null,
            regionPatron: null,
            regionEtiqueta: null,
            estado: null,
            fuente: "vacio",
        };
    }

    const regionHit = detectarRegionEnFrase(original);
    let trabajo = original;
    if (regionHit) {
        trabajo = quitarRuidoRegion(trabajo, regionHit.matchedAlias);
    }

    const montos = extraerMontos(trabajo);
    trabajo = montos.resto;

    let textoSemantico = limpiarTextoSemantico(trabajo);
    if (textoSemantico.length < 3) {
        // Frase era solo filtros → no inventar semántica vacía; el caller usará q original
        textoSemantico = "";
    }

    return {
        textoSemantico,
        montoMinimo: montos.montoMinimo,
        montoMaximo: montos.montoMaximo,
        regionPatron: regionHit?.patron ?? null,
        regionEtiqueta: regionHit?.etiqueta ?? null,
        estado: null,
        fuente: "reglas",
    };
}

/** ¿La frase parece pedir filtros pero las reglas no sacaron nada útil? */
export function convieneRefuerzoLlm(frase, interpretado) {
    const base = sinTildes(frase);
    const pideMonto = /\b(millon|millones|menor|mayores|hasta|entre|monto|presupuesto)\b/.test(base);
    const pideRegion = /\b(region|región|metropolitana|\brm\b|valparaiso|valparaíso)\b/.test(base);
    const sinMonto = interpretado.montoMaximo == null && interpretado.montoMinimo == null;
    const sinRegion = !interpretado.regionPatron;
    return (pideMonto && sinMonto) || (pideRegion && sinRegion);
}

/**
 * Fusiona UI (selects) con interpretado. Los selects del usuario ganan.
 */
export function fusionarFiltrosConsulta({
    interpretado,
    estadoUi = "",
    regionUi = "",
}) {
    const estado = limpio(estadoUi) || interpretado.estado || "";
    // UI pasa nombre exacto de región; interpretado pasa patrón %...%
    const regionParaRpc = limpio(regionUi)
        ? limpio(regionUi)
        : interpretado.regionPatron || "";

    return {
        textoSemantico: interpretado.textoSemantico || "",
        montoMaximo: interpretado.montoMaximo,
        montoMinimo: interpretado.montoMinimo,
        region: regionParaRpc,
        estado,
        regionEtiqueta: limpio(regionUi) ? limpio(regionUi) : interpretado.regionEtiqueta,
        fuente: interpretado.fuente,
    };
}
