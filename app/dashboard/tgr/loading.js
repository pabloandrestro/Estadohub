import SkeletonTabla from "@/components/shared/SkeletonTabla";
import TableLoadingOverlay from "@/components/shared/TableLoadingOverlay";

export default function TgrLoading() {
    return (
        <div className="flex min-w-0 flex-col gap-4">
            <div
                style={{
                    height: 28,
                    width: 180,
                    maxWidth: "100%",
                    borderRadius: 8,
                    background: "var(--surface-2)",
                }}
            />
            <div className="kpi-grid kpi-grid--4">
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
