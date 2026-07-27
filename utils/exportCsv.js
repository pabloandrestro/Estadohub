export function exportarCSV(datos, nombreArchivo = "exportacion") {
    if (!datos || datos.length === 0) return;

    const encabezados = Object.keys(datos[0]);
    const csvContent = [
        encabezados.join(";"),
        ...datos.map((fila) =>
            encabezados.map((col) => `"${fila[col] ?? ""}"`).join(";")
        ),
    ].join("\n");

    // BOM para compatibilidad con Excel en español
    const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${nombreArchivo}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}