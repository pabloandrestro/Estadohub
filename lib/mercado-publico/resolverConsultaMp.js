/**
 * Reglas + LLM opcional para interpretar la búsqueda.
 * Reglas sacan monto/región; el LLM limpia el núcleo y rellena huecos.
 * Sin LLM o si falla → solo reglas; sin núcleo útil → frase original en el caller.
 */

import {
    convieneRefuerzoLlm,
    fusionarFiltrosConsulta,
    interpretarConsultaConReglas,
    limpiarRuidoResidualTextoSemantico,
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
    let llmIntentado = false;
    let llmUsado = false;
    let motivoLlm = null;

    if (parseoLlmHabilitado() && convieneRefuerzoLlm(fraseUsuario, porReglas)) {
        llmIntentado = true;
        motivoLlm = "limpieza_y_parseo";
        const llm = await interpretarConsultaConLlm(fraseUsuario);
        if (llm) {
            interpretado = mezclarReglasYLlm(porReglas, llm);
            llmUsado = true;
        }
    }

    // Por si el LLM no corrió o dejó restos
    interpretado = {
        ...interpretado,
        textoSemantico: limpiarRuidoResidualTextoSemantico(
            interpretado.textoSemantico || ""
        ),
    };

    const fusion = fusionarFiltrosConsulta({
        interpretado,
        estadoUi: ui.estadoUi ?? "",
        regionUi: ui.regionUi ?? "",
    });

    return {
        ...fusion,
        parseoDetalle: {
            reglas: true,
            llmHabilitado: parseoLlmHabilitado(),
            llmIntentado,
            llmUsado,
            motivoLlm,
        },
    };
}

function mezclarReglasYLlm(reglas, llm) {
    const regionDesdeLlm = llm.regionEtiqueta
        ? detectarRegionEnFrase(llm.regionEtiqueta) ||
          detectarRegionEnFrase(`región ${llm.regionEtiqueta}`)
        : null;

    const textoLlm = limpiarRuidoResidualTextoSemantico(llm.textoSemantico || "");
    const textoReglas = limpiarRuidoResidualTextoSemantico(reglas.textoSemantico || "");

    // Preferir núcleo del LLM si aporta algo usable; si no, reglas
    const textoSemantico =
        textoLlm.length >= 3 ? textoLlm : textoReglas.length >= 3 ? textoReglas : "";

    return {
        textoSemantico,
        // Filtros: reglas primero; LLM solo completa huecos
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
