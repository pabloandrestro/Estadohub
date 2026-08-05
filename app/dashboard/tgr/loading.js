import SkeletonTabla from "@/components/shared/SkeletonTabla";
import TableLoadingOverlay from "@/components/shared/TableLoadingOverlay";

export default function TgrLoading() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div
                style={{
                    height: 28,
                    width: 180,
                    borderRadius: 8,
                    background: "var(--surface-2)",
                }}
            />
            <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
            >
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        style={{
                            height: 72,
                            borderRadius: 12,
                            border: "1px solid var(--border)",
                            background: "var(--surface)",
                        }}
                    />
                ))}
            </div>
            <TableLoadingOverlay active label="Cargando remates TGR…">
                <SkeletonTabla filas={6} columnas={5} />
            </TableLoadingOverlay>
        </div>
    );
}
