export function formatDate(fecha) {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}