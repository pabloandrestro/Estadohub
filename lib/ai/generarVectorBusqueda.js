/**
 * Embedding de búsqueda vía OpenAI (text-embedding-3-small, 1536 dims — migración 008).
 * Solo corre con AI_BUSQUEDA_ENABLE=true y OPENAI_API_KEY.
 */

const MODELO_EMBEDDING = "text-embedding-3-small";
const DIMENSION = 1536;
const MAX_INTENTOS = 3;

export function busquedaAiHabilitada() {
    return String(process.env.AI_BUSQUEDA_ENABLE || "").toLowerCase() === "true";
}

function apiKeyOpenAi() {
    return String(process.env.OPENAI_API_KEY || "").trim();
}

function esperar(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {string} texto
 * @returns {Promise<number[]>}
 */
export async function generarVectorBusqueda(texto) {
    if (!busquedaAiHabilitada()) {
        throw new Error(
            "Búsqueda AI deshabilitada. Defina AI_BUSQUEDA_ENABLE=true en el entorno."
        );
    }

    const apiKey = apiKeyOpenAi();
    if (!apiKey) {
        throw new Error("Falta OPENAI_API_KEY para generar vectores de búsqueda.");
    }

    const entrada = String(texto || "").trim();
    if (!entrada) {
        throw new Error("No hay texto para generar el vector de búsqueda.");
    }

    let ultimoError = null;

    for (let intento = 1; intento <= MAX_INTENTOS; intento += 1) {
        try {
            const respuesta = await fetch("https://api.openai.com/v1/embeddings", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: MODELO_EMBEDDING,
                    input: entrada,
                }),
            });

            if (respuesta.status === 429 || respuesta.status >= 500) {
                const cuerpo = await respuesta.text().catch(() => "");
                ultimoError = new Error(
                    `OpenAI embeddings HTTP ${respuesta.status}: ${cuerpo.slice(0, 200)}`
                );
                await esperar(800 * intento);
                continue;
            }

            if (!respuesta.ok) {
                const cuerpo = await respuesta.text().catch(() => "");
                throw new Error(
                    `OpenAI embeddings HTTP ${respuesta.status}: ${cuerpo.slice(0, 300)}`
                );
            }

            const json = await respuesta.json();
            const vector = json?.data?.[0]?.embedding;

            if (!Array.isArray(vector) || vector.length !== DIMENSION) {
                throw new Error(
                    `Vector inválido: se esperaban ${DIMENSION} dimensiones, ` +
                        `llegaron ${Array.isArray(vector) ? vector.length : 0}.`
                );
            }

            return vector;
        } catch (error) {
            ultimoError = error;
            const reintentable =
                error?.cause?.code === "ECONNRESET" ||
                error?.name === "FetchError" ||
                /fetch failed|network|ECONNRESET|ETIMEDOUT/i.test(
                    String(error?.message || "")
                );

            if (!reintentable || intento === MAX_INTENTOS) {
                throw error;
            }
            await esperar(800 * intento);
        }
    }

    throw ultimoError || new Error("No se pudo generar el vector de búsqueda.");
}

