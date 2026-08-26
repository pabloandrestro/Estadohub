"use client";

import { useMemo } from "react";
import { MapPin } from "lucide-react";

export default function GraficoConcentracion({ datos }) {
    const top10 = useMemo(() => {
        const conteo = {};
        datos.forEach((d) => {
            const c = d.comunaJuzgado || "DESCONOCIDA";
            conteo[c] = (conteo[c] || 0) + 1;
        });
        return Object.entries(conteo)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([comuna, total]) => ({ comuna, total }));
    }, [datos]);

    const max = top10[0]?.total || 1;

    return (
        <div className="glass-panel relative min-w-0 rounded-2xl p-5 backdrop-blur-xl border shadow-md h-full flex flex-col justify-between">
            <div>
                {/* Título de la sección */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-[var(--glass-accent)]" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--glass-text)]">
                            Concentración Geográfica
                        </h3>
                    </div>
                    <span className="badge-top rounded-md px-2 py-0.5 font-mono text-[10px] font-bold border">
                        Top 10
                    </span>
                </div>

                {/* Lista de barras */}
                <div className="space-y-3">
                    {top10.map(({ comuna, total }, i) => {
                        const porcentaje = Math.max((total / max) * 100, 3);
                        const esPrimero = i === 0;

                        return (
                            <div key={comuna} className="group flex items-center gap-3">
                                {/* Nombre de la Comuna */}
                                <p
                                    className="w-20 shrink-0 truncate text-right font-mono text-[11px] font-medium text-[var(--glass-text-muted)] group-hover:text-[var(--glass-text)] transition-colors"
                                    title={comuna}
                                >
                                    {comuna}
                                </p>

                                {/* Contenedor de la Barra */}
                                <div className="glass-track relative flex-1 h-3 rounded-full p-0.5 border">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${
                                            esPrimero
                                                ? "bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_12px_rgba(245,158,11,0.35)]"
                                                : "bg-gradient-to-r from-cyan-500 to-blue-500/80 shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                                        }`}
                                        style={{ width: `${porcentaje}%` }}
                                    />
                                </div>

                                {/* Valor Numérico */}
                                <span
                                    className={`w-7 shrink-0 text-left font-mono text-[11px] font-bold ${
                                        esPrimero ? "text-[var(--glass-warning)]" : "text-[var(--glass-accent)]"
                                    }`}
                                >
                                    {total}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--glass-border)] text-right">
                <span className="text-[10px] font-mono text-[var(--glass-text-muted)]">
                    Distribución por comuna de juzgado
                </span>
            </div>
        </div>
    );
}