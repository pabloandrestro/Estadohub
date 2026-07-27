/**
 * Extrae el array de items desde la respuesta de la API de Mercado Público.
 * La API puede devolver distintas claves según el módulo y versión.
 * @param {object} json - Respuesta cruda de la API
 * @param {string[]} clavesExtra - Claves adicionales a buscar antes del fallback genérico
 * @returns {Array}
 */
export function extraerListado(json, clavesExtra = []) {
    if (!json) return [];

    // Claves específicas que llegan como parámetro
    for (const clave of clavesExtra) {
        if (Array.isArray(json[clave])) return json[clave];
    }

    // Claves genéricas comunes en la API legacy
    if (Array.isArray(json.Listado)) return json.Listado;
    if (Array.isArray(json.ListadoLicitaciones)) return json.ListadoLicitaciones;
    if (Array.isArray(json.data)) return json.data;
    if (Array.isArray(json)) return json;

    return [];
}