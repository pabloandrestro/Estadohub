"use client";

import { Search } from "lucide-react";

/**
 * Búsqueda solo al Enter o al botón lupa (no por cada tecla → evita spam a OpenAI).
 */
export default function CampoBusquedaMp({
    valor,
    onCambiar,
    onBuscar,
    placeholder = "Buscar…",
}) {
    function manejarTecla(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            onBuscar?.();
        }
    }

    return (
        <div
            className="min-w-0 flex-[2_1_12rem]"
            style={{
                display: "flex",
                alignItems: "stretch",
                gap: "0.4rem",
            }}
        >
            <input
                type="search"
                placeholder={placeholder}
                value={valor}
                onChange={(e) => onCambiar?.(e.target.value)}
                onKeyDown={manejarTecla}
                enterKeyHint="search"
                aria-label={placeholder}
                className="min-w-0 flex-1"
                style={{
                    padding: "0.7rem 0.9rem",
                    borderRadius: "0.75rem",
                    border: "1px solid var(--border)",
                    background: "var(--surface-2)",
                    color: "var(--text-secondary)",
                    fontSize: "0.84rem",
                    outline: "none",
                }}
            />
            <button
                type="button"
                onClick={() => onBuscar?.()}
                aria-label="Buscar"
                title="Buscar (Enter)"
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    width: "2.75rem",
                    borderRadius: "0.75rem",
                    border: "1px solid var(--border)",
                    background: "var(--surface-2)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                }}
            >
                <Search size={18} strokeWidth={2} aria-hidden />
            </button>
        </div>
    );
}
