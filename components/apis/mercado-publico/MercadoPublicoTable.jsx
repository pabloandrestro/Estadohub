"use client";

import { useState } from "react";

/**
 * Con totalFilas + onPaginaChange: paginación en servidor (`rows` ya es la página).
 * Sin ellos: pagina en cliente sobre `rows` (legacy).
 *
 * Cada columna puede declarar un rol de tarjeta vía `card`:
 *   "id"        — identificador corto, arriba a la izquierda (monoespaciado, tenue).
 *   "title"     — encabezado de la tarjeta.
 *   "badge"     — se ubica arriba a la derecha, junto al título (p. ej. EstadoBadge).
 *   "highlight" — valor destacado al pie (p. ej. un monto).
 *   (sin rol)   — campo secundario, se muestra en la grilla de metadatos.
 */
export default function MercadoPublicoTable({
    columns = [],
    rows = [],
    emptyMessage = "No hay datos disponibles.",
    paginaTamano = 5,
    labelPlural = "registros",
    onVerDetalle,
    pagina: paginaControlada,
    totalFilas,
    onPaginaChange,
}) {
    const serverSide =
        typeof totalFilas === "number" && typeof onPaginaChange === "function";

    const [paginaInterna, setPaginaInterna] = useState(1);
    const pagina = serverSide ? Math.max(1, paginaControlada || 1) : paginaInterna;

    function irAPagina(updater) {
        const actual = pagina;
        const next = typeof updater === "function" ? updater(actual) : updater;
        if (serverSide) onPaginaChange(next);
        else setPaginaInterna(next);
    }

    const totalParaPaginas = serverSide ? totalFilas : rows.length;
    const totalPaginas = Math.max(1, Math.ceil(totalParaPaginas / paginaTamano));
    const visibles = serverSide
        ? rows
        : rows.slice((pagina - 1) * paginaTamano, pagina * paginaTamano);

    const colId = columns.find((c) => c.card === "id");
    const colTitle = columns.find((c) => c.card === "title");
    const colBadge = columns.find((c) => c.card === "badge");
    const colHighlight = columns.find((c) => c.card === "highlight");
    const colsMeta = columns.filter((c) => !c.card);

    function valorDe(col, row) {
        return col.render ? col.render(row) : (row[col.key] ?? "—");
    }

    const estiloVer = {
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        padding: "0.4rem 0.9rem",
        borderRadius: "0.5rem",
        border: "1px solid var(--accent)",
        color: "var(--accent)",
        fontSize: "0.78rem",
        fontWeight: 600,
        background: "transparent",
        cursor: "pointer",
        textDecoration: "none",
        whiteSpace: "nowrap",
    };

    return (
        <div className="min-w-0">
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.65rem" }}>
                {totalParaPaginas} {labelPlural} · Página {pagina} de {totalPaginas}
            </p>

            {visibles.length === 0 ? (
                <div className="registro-empty">{emptyMessage}</div>
            ) : (
                <div className="registro-grid">
                    {visibles.map((row, index) => (
                        <div key={`${row.id ?? row.codigo ?? "fila"}-${index}`} className="registro-card">
                            <div className="registro-card-head">
                                <div className="min-w-0">
                                    {colId && (
                                        <p className="registro-card-id">{valorDe(colId, row)}</p>
                                    )}
                                    {colTitle && (
                                        <p className="registro-card-title">{valorDe(colTitle, row)}</p>
                                    )}
                                </div>
                                {colBadge && <div className="shrink-0">{valorDe(colBadge, row)}</div>}
                            </div>

                            {colsMeta.length > 0 && (
                                <div className="registro-card-meta">
                                    {colsMeta.map((col) => (
                                        <div key={col.key} className="registro-card-field">
                                            <p className="registro-card-field-label">{col.label}</p>
                                            <p className="registro-card-field-value">{valorDe(col, row)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {colHighlight && (
                                <div className="registro-card-highlight">
                                    <span className="registro-card-highlight-label">
                                        {colHighlight.label}
                                    </span>
                                    <span className="registro-card-highlight-value">
                                        {valorDe(colHighlight, row)}
                                    </span>
                                </div>
                            )}

                            <div className="registro-card-footer">
                                {onVerDetalle ? (
                                    <button
                                        type="button"
                                        onClick={() => onVerDetalle(row)}
                                        style={estiloVer}
                                    >
                                        Ver detalle ›
                                    </button>
                                ) : (
                                    <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                                        —
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {totalPaginas > 1 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 py-2">
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        Página {pagina} de {totalPaginas}
                    </span>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                            type="button"
                            onClick={() => irAPagina((p) => Math.max(1, p - 1))}
                            disabled={pagina === 1}
                            style={{
                                padding: "0.3rem 0.75rem",
                                borderRadius: "0.4rem",
                                border: "1px solid var(--border)",
                                background: "var(--surface-2)",
                                color: pagina === 1 ? "var(--text-muted)" : "var(--text-secondary)",
                                cursor: pagina === 1 ? "not-allowed" : "pointer",
                                fontSize: "0.8rem",
                            }}
                        >
                            ‹
                        </button>
                        <button
                            type="button"
                            onClick={() => irAPagina((p) => Math.min(totalPaginas, p + 1))}
                            disabled={pagina === totalPaginas}
                            style={{
                                padding: "0.3rem 0.75rem",
                                borderRadius: "0.4rem",
                                border: "1px solid var(--border)",
                                background: "var(--surface-2)",
                                color:
                                    pagina === totalPaginas
                                        ? "var(--text-muted)"
                                        : "var(--text-secondary)",
                                cursor: pagina === totalPaginas ? "not-allowed" : "pointer",
                                fontSize: "0.8rem",
                            }}
                        >
                            ›
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
