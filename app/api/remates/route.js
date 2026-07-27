import { NextResponse } from "next/server";
import {
    getRematesActivos,
    invalidarCache,
    estadoCache,
} from "@/services/tgr/rematesService";

// ── GET /api/remates ──────────────────────────────────────────────────────────
//
// Query params:
//   ?recargar=1     → fuerza nuevo fetch ignorando caché
//   ?debug=1        → devuelve metadata de caché + primer registro raw
//   ?comuna=CURICO  → filtra por comuna (opcional)
//   ?busqueda=texto → filtra por deudor o dirección (opcional)
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        const forzar = searchParams.get("recargar") === "1";
        const debug = searchParams.get("debug") === "1";
        const comuna = searchParams.get("comuna") ?? null;
        const busqueda = searchParams.get("busqueda") ?? null;

        // Invalidar caché si se pide recarga
        if (forzar) {
            invalidarCache();
            console.log("[GET /api/remates] 🔄 Recarga forzada por query param");
        }

        // Obtener datos (desde caché o fetch fresco)
        const datos = await getRematesActivos({ forzarRecarga: forzar });

        // ── Modo debug ────────────────────────────────────────────────────────
        if (debug) {
            const cache = estadoCache();
            return NextResponse.json({
                debug: true,
                cache: cache,
                total: datos.length,
                clavesMapper: datos[0] ? Object.keys(datos[0]).filter((k) => k !== "_raw") : [],
                clavesRaw: datos[0]?._raw ? Object.keys(datos[0]._raw) : [],
                primerRegistro: datos[0] ?? null,
            });
        }

        // ── Filtros opcionales ────────────────────────────────────────────────
        let resultado = datos;

        if (comuna && comuna !== "TODAS") {
            resultado = resultado.filter(
                (d) => (d.comunaJuzgado ?? "").toUpperCase() === comuna.toUpperCase()
            );
        }

        if (busqueda && busqueda.trim() !== "") {
            const b = busqueda.toLowerCase().trim();
            resultado = resultado.filter(
                (d) =>
                    (d.direccionRol ?? "").toLowerCase().includes(b) ||
                    (d.nombreDuegno ?? "").toLowerCase().includes(b) ||
                    (d.rol ?? "").toLowerCase().includes(b)
            );
        }

        // ── Respuesta ─────────────────────────────────────────────────────────
        return NextResponse.json(
            {
                success: true,
                count: resultado.length,
                total: datos.length,
                cache: estadoCache(),
                data: resultado,
            },
            {
                status: 200,
                headers: {
                    "Cache-Control": "no-store",
                },
            }
        );

    } catch (error) {
        console.error("[GET /api/remates] ❌", error.message);

        return NextResponse.json(
            {
                success: false,
                error: "Error al obtener remates TGR",
                detalle: process.env.NODE_ENV === "development" ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}