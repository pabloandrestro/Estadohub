export default function KpiGrande({ icono: Icono, titulo, valor, color, glowColor, tooltip }) {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-slate-900/60 p-5 backdrop-blur-xl border border-slate-800/80 shadow-lg transition-all duration-300 hover:border-slate-700/80 hover:-translate-y-0.5 group">
            {/* Resplandor sutil al fondo */}
            <div
                className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none group-hover:opacity-35 transition-opacity"
                style={{ backgroundColor: color }}
            />

            <div className="flex items-center gap-4">
                <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                    style={{
                        background: `color-mix(in srgb, ${color} 15%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
                        boxShadow: `0 0 15px ${glowColor || "transparent"}`,
                    }}
                >
                    <Icono size={20} style={{ color }} />
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {titulo}
                    </p>
                    <p
                        className="text-xl font-black tracking-tight text-white mt-0.5 font-mono truncate"
                        title={tooltip}
                    >
                        {valor}
                    </p>
                </div>
            </div>
        </div>
    );
}
