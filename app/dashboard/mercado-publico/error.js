"use client";

import ErrorBanner from "@/components/shared/ErrorBanner";

export default function Error({ error, reset }) {
    return (
        <div className="space-y-4">
            <ErrorBanner
                title="Error en Mercado Público"
                message={error?.message || "Ocurrió un problema cargando el módulo."}
            />

            <button
                onClick={() => reset()}
                className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
            >
                Reintentar
            </button>
        </div>
    );
}