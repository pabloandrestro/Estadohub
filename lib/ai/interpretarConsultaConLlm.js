/**
 * LLM opcional para limpiar el núcleo de la búsqueda y ayudar con filtros ambiguos.
 * Si falla o está off, gana el parseo por reglas.
 * Flag: AI_PARSEO_LLM_ENABLE=true (+ OPENAI_API_KEY)
 */

const MODELO_PARSEO = "gpt-4.1-mini";

export function parseoLlmHabilitado() {
    return String(process.env.AI_PARSEO_LLM_ENABLE || "").toLowerCase() === "true";
}

function apiKeyOpenAi() {
    return String(process.env.OPENAI_API_KEY || "").trim();
}

/**
 * @param {string} fraseUsuario
 * @returns {Promise<{
 *   textoSemantico: string|null,
 *   montoMaximo: number|null,
 *   montoMinimo: number|null,
 *   regionEtiqueta: string|null,
 *   estado: string|null,
 * } | null>}
 */
export async function interpretarConsultaConLlm(fraseUsuario) {
    if (!parseoLlmHabilitado()) return null;

    const apiKey = apiKeyOpenAi();
    if (!apiKey) return null;

    const frase = String(fraseUsuario || "").trim();
    if (frase.length < 3) return null;

    const system = [
        "Eres un parser de búsquedas de compras públicas en Chile (Mercado Público).",
        "Devuelve SOLO un JSON válido con estas claves:",
        "textoSemantico (string): SOLO el producto, servicio o rubro que buscan.",
        "  - 2 a 8 palabras. Sin montos, sin regiones, sin 'tope/hasta/presupuesto/región'.",
        "  - Sin conectores vacíos ('en del', 'de la'). Corrige typos obvios del núcleo.",
        "  - Ej: 'rubro informatico en region del maule hasta 3 millones' → 'rubro informatico'.",
        "  - Ej: 'camaras de seguridad' → 'camaras de seguridad'.",
        "montoMaximo (number CLP o null),",
        "montoMinimo (number CLP o null),",
        "regionEtiqueta (string corta tipo Metropolitana/Valparaíso/Maule o null),",
        "estado (string o null).",
        "No inventes filtros que el usuario no pidió.",
        "Millones → multiplica por 1000000 (ej. 3 millones = 3000000).",
    ].join(" ");

    try {
        const respuesta = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: MODELO_PARSEO,
                temperature: 0,
                response_format: { type: "json_object" },
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: frase },
                ],
            }),
        });

        if (!respuesta.ok) {
            const cuerpo = await respuesta.text().catch(() => "");
            console.warn(
                `[parseo LLM] HTTP ${respuesta.status}: ${cuerpo.slice(0, 200)}`
            );
            return null;
        }

        const json = await respuesta.json();
        const raw = json?.choices?.[0]?.message?.content;
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        return {
            textoSemantico:
                typeof parsed.textoSemantico === "string"
                    ? parsed.textoSemantico.trim()
                    : null,
            montoMaximo: aNumeroONull(parsed.montoMaximo),
            montoMinimo: aNumeroONull(parsed.montoMinimo),
            regionEtiqueta:
                typeof parsed.regionEtiqueta === "string"
                    ? parsed.regionEtiqueta.trim()
                    : null,
            estado: typeof parsed.estado === "string" ? parsed.estado.trim() : null,
        };
    } catch (error) {
        console.warn("[parseo LLM] fallo:", error?.message || error);
        return null;
    }
}

function aNumeroONull(v) {
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}
