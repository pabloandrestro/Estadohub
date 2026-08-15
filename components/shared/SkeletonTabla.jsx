function Barra({ width, height = "10px", radius = "9999px" }) {
    return (
        <div
            className="skeleton-shimmer"
            style={{ width, height, borderRadius: radius }}
        />
    );
}

export default function SkeletonTabla({ filas = 8 }) {
    return (
        <div className="registro-grid">
            {Array.from({ length: filas }).map((_, i) => (
                <div key={i} className="registro-card" style={{ opacity: 0.85 }}>
                    <div className="registro-card-head">
                        <div className="min-w-0" style={{ display: "flex", flexDirection: "column", gap: "0.45rem", width: "100%" }}>
                            <Barra width="35%" height="8px" />
                            <Barra width="70%" height="13px" radius="4px" />
                        </div>
                        <Barra width="3.5rem" height="18px" />
                    </div>

                    <div className="registro-card-meta">
                        {Array.from({ length: 2 }).map((_, j) => (
                            <div key={j} style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                                <Barra width="50%" height="7px" />
                                <Barra width="85%" height="10px" radius="4px" />
                            </div>
                        ))}
                    </div>

                    <div style={{ paddingTop: "0.65rem", borderTop: "1px dashed var(--border)" }}>
                        <Barra width="45%" height="14px" radius="4px" />
                    </div>
                </div>
            ))}

            <style>{`
                .skeleton-shimmer {
                    background-image: linear-gradient(
                        90deg,
                        var(--surface-2) 25%,
                        color-mix(in srgb, var(--border) 60%, var(--surface-2)) 50%,
                        var(--surface-2) 75%
                    );
                    background-size: 200% 100%;
                    animation: skeleton-shimmer-move 1.4s ease-in-out infinite;
                }
                @keyframes skeleton-shimmer-move {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}</style>
        </div>
    );
}
