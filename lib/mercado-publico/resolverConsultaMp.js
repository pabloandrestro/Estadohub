/**
 * Orquesta reglas + LLM opcional para interpretar la búsqueda del usuario.
 * Continuidad: sin LLM / error LLM → solo reglas; sin reglas útiles → frase original.
 */

import {
    convieneRefuerzoLlm,
    fusionarFiltrosConsulta,
    interpretarConsultaConReglas,
} from "@/lib/mercado-publico/interpretarConsultaMp";
import { detectarRegionEnFrase } from "@/lib/mercado-publico/regionesChileMp";
import {
    interpretarConsultaConLlm,
    parseoLlmHabilitado,
} from "@/lib/ai/interpretarConsultaConLlm";

/**
 * @param {string} fraseUsuario
 * @param {{ estadoUi?: string, regionUi?: string }} ui
 */
export async function interpretarConsultaMp(fraseUsuario, ui = {}) {
    const porReglas = interpretarConsultaConReglas(fraseUsuario);
    let interpretado = { ...porReglas };

    if (parseoLlmHabilitado() && convieneRefuerzoLlm(fraseUsuario, porReglas)) {
        const llm = await interpretarConsultaConLlm(fraseUsuario);
        if (llm) {
            interpretado = mezclarReglasYLlm(porReglas, llm);
        }
    }

    return fusionarFiltrosConsulta({
        interpretado,
        estadoUi: ui.estadoUi ?? "",
        regionUi: ui.regionUi ?? "",
    });
}

function mezclarReglasYLlm(reglas, llm) {
    const regionDesdeLlm = llm.regionEtiqueta
        ? detectarRegionEnFrase(llm.regionEtiqueta) ||
          detectarRegionEnFrase(`región ${llm.regionEtiqueta}`)
        : null;

    const textoSemantico =
        (llm.textoSemantico && llm.textoSemantico.length >= 3
            ? llm.textoSemantico
            : reglas.textoSemantico) || reglas.textoSemantico;

    return {
        textoSemantico,
        montoMaximo: reglas.montoMaximo ?? llm.montoMaximo ?? null,
        montoMinimo: reglas.montoMinimo ?? llm.montoMinimo ?? null,
        regionPatron: reglas.regionPatron ?? regionDesdeLlm?.patron ?? null,
        regionEtiqueta:
            reglas.regionEtiqueta ??
            regionDesdeLlm?.etiqueta ??
            llm.regionEtiqueta ??
            null,
        estado: reglas.estado ?? llm.estado ?? null,
        fuente: "reglas+llm",
    };
}
