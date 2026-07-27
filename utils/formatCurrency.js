export function formatCLP(valor) {
    if (!valor && valor !== 0) return "—";
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
    }).format(valor);
}

export function formatCLPCompacto(valor) {
    if (!valor && valor !== 0) return "—";
    if (valor >= 1_000_000_000_000) return `$${(valor / 1_000_000_000_000).toFixed(1)} BLL`;
    if (valor >= 1_000_000_000) return `$${(valor / 1_000_000_000).toFixed(1)} MRD`;
    if (valor >= 1_000_000) return `$${(valor / 1_000_000).toFixed(1)} M`;
    if (valor >= 1_000) return `$${(valor / 1_000).toFixed(0)}K`;
    return formatCLP(valor);
}