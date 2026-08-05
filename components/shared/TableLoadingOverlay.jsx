"use client";

import Image from "next/image";

/**
 * Difumina el contenido (tabla) y muestra logo + ondas mientras carga.
 */
export default function TableLoadingOverlay({
    active = false,
    children,
    label = "Cargando datos…",
    minHeight = 220,
}) {
    return (
        <div
            className={`table-load-root${active ? " is-loading" : ""}`}
            style={{ minHeight: active ? minHeight : undefined }}
            aria-busy={active}
        >
            <div className="table-load-content">{children}</div>

            {active && (
                <div className="table-load-overlay" role="status" aria-live="polite">
                    <div className="table-load-waves" aria-hidden="true">
                        <span className="table-load-wave table-load-wave--1" />
                        <span className="table-load-wave table-load-wave--2" />
                        <span className="table-load-wave table-load-wave--3" />
                    </div>

                    <div className="table-load-center">
                        <div className="table-load-logo-wrap">
                            <Image
                                src="/logo-hublab.jpg"
                                alt=""
                                width={72}
                                height={72}
                                className="table-load-logo"
                                priority
                            />
                        </div>
                        <p className="table-load-label">{label}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
