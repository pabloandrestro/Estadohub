export default function KpiGrande({ icono: Icono, titulo, valor, color, tooltip }) {
    return (
        <div className="kpi-tgr">
            <div
                className="kpi-tgr-icon"
                style={{
                    background: `color-mix(in srgb, ${color} 12%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
                }}
            >
                <Icono size={18} style={{ color }} />
            </div>
            <div className="min-w-0">
                <p className="kpi-tgr-label">{titulo}</p>
                <p className="kpi-tgr-value" style={{ color }} title={tooltip}>
                    {valor}
                </p>
            </div>
        </div>
    );
}
