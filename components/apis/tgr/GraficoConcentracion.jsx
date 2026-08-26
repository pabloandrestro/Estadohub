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
        <div className="relative min-w-0 rounded-2xl bg-slate-900/60 p-5 backdrop-blur-xl border border-slate-800/80 shadow-md h-full flex flex-col justify-between">
            <div>
                {/* Título de la sección */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-cyan-400" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                            Concentración Geográfica
                        </h3>
                    </div>
                    <span className="rounded-md bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-400 border border-amber-500/20">
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
                                    className="w-20 shrink-0 truncate text-right font-mono text-[11px] font-medium text-slate-400 group-hover:text-slate-200 transition-colors"
                                    title={comuna}
                                >
                                    {comuna}
                                </p>

                                {/* Contenedor de la Barra */}
                                <div className="relative flex-1 h-3 rounded-full bg-slate-950/70 p-0.5 border border-slate-800/60">
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
                                        esPrimero ? "text-amber-400" : "text-cyan-400"
                                    }`}
                                >
                                    {total}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/50 text-right">
                <span className="text-[10px] font-mono text-slate-500">
                    Distribución por comuna de juzgado
                </span>
            </div>
        </div>
    );
}