/**
 * Arma el texto que se envía al modelo de embeddings.
 * Solo contenido de “qué es” la compra/licitación — no montos ni regiones
 * (eso va como filtro SQL en etapas posteriores).
 */

const MAX_CHARS = 8000;
const MIN_CHARS_UTILES = 40;

function limpio(valor) {
    if (valor == null) return "";
    return String(valor).replace(/\s+/g, " ").trim();
}

function unirLineas(partes) {
    return partes.map(limpio).filter(Boolean).join("\n");
}

function textoDeProductosCompraAgil(productos) {
    if (!Array.isArray(productos) || productos.length === 0) return "";
    return productos
        .map((p) => unirLineas([p?.nombre, p?.descripcion]))
        .filter(Boolean)
        .join("\n");
}

function textoDeItemsLicitacion(items) {
    if (!Array.isArray(items) || items.length === 0) return "";
    return items
        .map((it) => unirLineas([it?.nombreProducto, it?.descripcion]))
        .filter(Boolean)
        .join("\n");
}

function textoDeItemsOrden(items) {
    if (!Array.isArray(items) || items.length === 0) return "";
    return items
        .map((it) => unirLineas([it?.producto, it?.especificacionComprador]))
        .filter(Boolean)
        .join("\n");
}

/**
 * @param {"licitaciones"|"compra-agil"|"ordenes-compra"} modulo
 * @param {Record<string, unknown>} filaDb fila cruda de Supabase (snake_case)
 * @returns {string}
 */
export function armarTextoIndiceMp(modulo, filaDb = {}) {
    let cuerpo = "";

    if (modulo === "compra-agil") {
        cuerpo = unirLineas([
            filaDb.nombre,
            filaDb.organismo,
            filaDb.descripcion,
            textoDeProductosCompraAgil(filaDb.productos),
        ]);
    } else if (modulo === "licitaciones") {
        cuerpo = unirLineas([
            filaDb.nombre,
            filaDb.organismo,
            filaDb.nombre_unidad,
            filaDb.descripcion,
            textoDeItemsLicitacion(filaDb.items),
        ]);
    } else if (modulo === "ordenes-compra") {
        cuerpo = unirLineas([
            filaDb.nombre,
            filaDb.comprador,
            filaDb.proveedor,
            filaDb.actividad_comprador,
            filaDb.actividad_proveedor,
            filaDb.descripcion,
            textoDeItemsOrden(filaDb.items),
        ]);
    } else {
        cuerpo = unirLineas([filaDb.nombre, filaDb.descripcion]);
    }

    if (cuerpo.length > MAX_CHARS) {
        return cuerpo.slice(0, MAX_CHARS);
    }
    return cuerpo;
}

export function textoIndiceEsUtil(texto) {
    return limpio(texto).length >= MIN_CHARS_UTILES;
}
