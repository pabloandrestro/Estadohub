/**
 * Constantes compartidas del listado y la búsqueda semántica MP.
 * Evita divergir el “últimos N días” de CA entre repo y RPC.
 */

/** Compra Ágil: solo filas creadas en esta ventana (listado + búsqueda). */
export const DIAS_RETENCION_CA = 7;

/** Tope de vecinos del RPC de similitud (migración 009). */
export const MAX_HITS_SIMILITUD = 200;
