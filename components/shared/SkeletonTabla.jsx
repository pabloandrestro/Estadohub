export default function SkeletonTabla({ filas = 8, columnas = 4 }) {
    return (
        <div
            style={{
                borderRadius: "0.75rem",
                border: "1px solid var(--border)",
                overflow: "hidden",
                background: "var(--surface)",
            }}
        >
            <div
                style={{
                    background: "var(--surface-2)",
                    borderBottom: "1px solid var(--border)",
                    display: "grid",
                    gridTemplateColumns: `repeat(${columnas}, 1fr)`,
                    gap: "1rem",
                    padding: "0.65rem 1rem",
                }}
            >
                {Array.from({ length: columnas }).map((_, i) => (
                    <div
                        key={i}
                        style={{
                            height: "10px",
                            borderRadius: "4px",
                            background: "var(--surface-dynamic)",
                            animation: "shimmer 1.4s ease-in-out infinite",
                            backgroundSize: "200% 100%",
                            backgroundImage:
                                "linear-gradient(90deg, var(--surface-dynamic) 25%, var(--surface-offset) 50%, var(--surface-dynamic) 75%)",
                            width: i === 0 ? "60%" : "80%",
                        }}
                    />
                ))}
            </div>

            {Array.from({ length: filas }).map((_, ri) => (
                <div
                    key={ri}
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${columnas}, 1fr)`,
                        gap: "1rem",
                        padding: "0.7rem 1rem",
                        borderTop: ri > 0 ? "1px solid var(--border)" : "none",
                        background: ri % 2 === 0 ? "transparent" : "color-mix(in srgb, var(--surface-2) 40%, transparent)",
                    }}
                >
                    {Array.from({ length: columnas }).map((_, ci) => (
                        <div
                            key={ci}
                            style={{
                                height: "12px",
                                borderRadius: "4px",
                                backgroundImage:
                                    "linear-gradient(90deg, var(--surface-dynamic) 25%, var(--surface-offset) 50%, var(--surface-dynamic) 75%)",
                                backgroundSize: "200% 100%",
                                animation: `shimmer 1.4s ease-in-out ${ri * 0.05}s infinite`,
                                width: ci === 1 ? "90%" : ci === columnas - 1 ? "50%" : "75%",
                            }}
                        />
                    ))}
                </div>
            ))}

            <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
        </div>
    );
}