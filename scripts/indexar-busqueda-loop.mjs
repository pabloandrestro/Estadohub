/**
 * Loop local: indexa búsqueda semántica (embeddings) sobre filas con detalle.
 *
 * No cambia la UI ni el listado del cliente. Solo llena:
 *   vector_busqueda, texto_indice, indexado_en
 *
 * Uso:
 *   npm run indexar:busqueda
 *
 * Requiere en .env.local:
 *   AI_BUSQUEDA_ENABLE=true
 *   OPENAI_API_KEY=sk-...
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Opcionales:
 *   INDEXAR_INTERVAL_MS=1500
 *   INDEXAR_LIMITE=1
 *   INDEXAR_PAUSA_MS=400
 *   INDEXAR_MODULOS=compra-agil,licitaciones
 *     (agregar ordenes-compra solo cuando quieran costo/volumen a escala)
 *
 * Detener: Ctrl+C
 */

import { loadEnvLocal } from "./load-env.mjs";

loadEnvLocal();

const INTERVAL_MS = Math.max(800, Number(process.env.INDEXAR_INTERVAL_MS) || 1500);
const LIMITE = Math.max(1, Number(process.env.INDEXAR_LIMITE) || 1);
const PAUSA_MS = Math.max(0, Number(process.env.INDEXAR_PAUSA_MS) || 400);

const modulosEnv = String(process.env.INDEXAR_MODULOS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const { indexarBusquedaMercadoPublico, MODULOS_DEFAULT } = await import(
    "../services/mercado-publico/indexarBusquedaMercadoPublico.js"
);

const MODULOS = modulosEnv.length > 0 ? modulosEnv : MODULOS_DEFAULT;

function esperar(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function stamp() {
    return new Date().toLocaleString("es-CL", { hour12: false });
}

const totales = {
    ciclos: 0,
    ok: 0,
    error: 0,
    indexado: 0,
    omitido_sin_texto: 0,
    sin_pendientes: 0,
};

let indiceModulo = 0;
let continuar = true;

function detener(senal) {
    console.log(`\n[${stamp()}] Señal ${senal}: deteniendo tras el ciclo actual…`);
    continuar = false;
}

process.on("SIGINT", () => detener("SIGINT"));
process.on("SIGTERM", () => detener("SIGTERM"));

if (String(process.env.AI_BUSQUEDA_ENABLE || "").toLowerCase() !== "true") {
    console.error(
        `[${stamp()}] Abortado: AI_BUSQUEDA_ENABLE debe ser "true" para indexar.`
    );
    process.exit(1);
}

if (!String(process.env.OPENAI_API_KEY || "").trim()) {
    console.error(`[${stamp()}] Abortado: falta OPENAI_API_KEY.`);
    process.exit(1);
}

console.log(`[${stamp()}] Inicio indexar-busqueda-loop`);
console.log(
    `  intervalo=${INTERVAL_MS}ms  limite=${LIMITE}  pausa=${PAUSA_MS}ms  módulos=${MODULOS.join(", ")}`
);
console.log("  Ctrl+C para detener.\n");

while (continuar) {
    const modulo = MODULOS[indiceModulo % MODULOS.length];
    indiceModulo += 1;
    totales.ciclos += 1;

    try {
        const resultado = await indexarBusquedaMercadoPublico({
            limite: LIMITE,
            pausaMs: PAUSA_MS,
            modulos: [modulo],
        });

        if (!resultado.procesados.length) {
            totales.sin_pendientes += 1;
            console.log(`[${stamp()}] [${modulo}] sin pendientes`);
        } else {
            for (const item of resultado.procesados) {
                if (item.ok) {
                    totales.ok += 1;
                    if (item.detalle in totales) totales[item.detalle] += 1;
                    console.log(
                        `[${stamp()}] OK [${item.modulo}] ${item.codigo} -> ${item.detalle}`
                    );
                } else {
                    totales.error += 1;
                    console.log(
                        `[${stamp()}] ERR [${item.modulo}] ${item.codigo} -> ${item.error || "error"}`
                    );
                }
            }
        }
    } catch (error) {
        totales.error += 1;
        console.error(`[${stamp()}] ERR [${modulo}] fallo del ciclo: ${error.message}`);
    }

    if (totales.ciclos % 30 === 0) {
        console.log(
            `[${stamp()}] — resumen: ciclos=${totales.ciclos} indexado=${totales.indexado} ` +
                `omitidos=${totales.omitido_sin_texto} errores=${totales.error} ` +
                `sin_pendientes=${totales.sin_pendientes}`
        );
    }

    if (!continuar) break;
    await esperar(INTERVAL_MS);
}

console.log(`\n[${stamp()}] Fin.`);
console.log(
    `  ciclos=${totales.ciclos} indexado=${totales.indexado} ` +
        `omitido_sin_texto=${totales.omitido_sin_texto} errores=${totales.error} ` +
        `sin_pendientes=${totales.sin_pendientes}`
);
