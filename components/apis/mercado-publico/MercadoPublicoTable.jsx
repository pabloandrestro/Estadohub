"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ArrowUpRight, MapPin } from "lucide-react";

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

    return (
        <div className="min-w-0">
            {/* Cabecera de conteo */}
            <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-xs font-mono text-slate-400">
                    <span className="text-cyan-400 font-semibold">{totalParaPaginas}</span> {labelPlural} · Página {pagina} de {totalPaginas}
                </p>
            </div>

            {visibles.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-sm text-slate-400 backdrop-blur-xl">
                    {emptyMessage}
                </div>
            ) : (
                /* Grilla de Tarjetas */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {visibles.map((row, index) => (
                        <div
                            key={`${row.id ?? row.codigo ?? "fila"}-${index}`}
                            className="group relative flex flex-col justify-between rounded-2xl bg-slate-900/60 p-5 backdrop-blur-xl border border-slate-800/80 shadow-md transition-all duration-300 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.12)] hover:-translate-y-1"
                        >
                            {/* Parte Superior: ID y Título / Deudor */}
                            <div>
                                <div className="flex items-start justify-between gap-2 mb-2.5">
                                    {colId && (
                                        <span className="inline-block rounded-md bg-slate-800/80 px-2.5 py-0.5 font-mono text-[11px] font-medium text-slate-400 border border-slate-700/60 group-hover:border-cyan-500/30 group-hover:text-cyan-300 transition-colors">
                                            {valorDe(colId, row)}
                                        </span>
                                    )}
                                    {colBadge && <div className="shrink-0">{valorDe(colBadge, row)}</div>}
                                </div>

                                {colTitle && (
                                    <h4 className="text-sm font-bold text-slate-100 line-clamp-2 tracking-tight mb-3 leading-snug group-hover:text-white transition-colors">
                                        {valorDe(colTitle, row)}
                                    </h4>
                                )}

                                {/* Metadatos (Ubicación, Juzgado, etc.) */}
                                {colsMeta.length > 0 && (
                                    <div className="space-y-1.5 mb-4">
                                        {colsMeta.map((col) => (
                                            <div key={col.key} className="text-xs flex items-start gap-1.5 text-slate-400">
                                                <MapPin size={13} className="shrink-0 text-slate-500 mt-0.5" />
                                                <div className="line-clamp-1 min-w-0">
                                                    <span className="font-medium text-slate-500 mr-1 uppercase text-[10px] tracking-wider">
                                                        {col.label}:
                                                    </span>
                                                    <span className="text-slate-300">{valorDe(col, row)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Parte Inferior: Tasación y Botón Ver Detalle */}
                            <div className="mt-auto pt-3.5 border-t border-slate-800/70">
                                {colHighlight && (
                                    <div className="flex items-baseline justify-between mb-3">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                            {colHighlight.label}
                                        </span>
                                        <span className="text-base font-black text-emerald-400 font-mono tracking-tight drop-shadow-[0_0_10px_rgba(52,211,153,0.25)]">
                                            {valorDe(colHighlight, row)}
                                        </span>
                                    </div>
                                )}

                                {onVerDetalle ? (
                                    <button
                                        type="button"
                                        onClick={() => onVerDetalle(row)}
                                        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-cyan-950/30 hover:bg-cyan-500 border border-cyan-500/30 hover:border-cyan-400 py-2 px-3 text-xs font-semibold text-cyan-400 hover:text-slate-950 shadow-sm transition-all duration-200 group/btn"
                                    >
                                        <span>Ver detalle</span>
                                        <ArrowUpRight size={14} className="transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                                    </button>
                                ) : (
                                    <span className="text-xs text-slate-500 block text-center">—</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Paginación */}
            {totalPaginas > 1 && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 px-1 py-2">
                    <span className="text-xs text-slate-400 font-mono">
                        Página <strong className="text-slate-200">{pagina}</strong> de <strong className="text-slate-200">{totalPaginas}</strong>
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => irAPagina((p) => Math.max(1, p - 1))}
                            disabled={pagina === 1}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => irAPagina((p) => Math.min(totalPaginas, p + 1))}
                            disabled={pagina === totalPaginas}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}