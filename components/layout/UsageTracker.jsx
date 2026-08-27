"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Envía un "ping" de navegación a /api/track en cada cambio de ruta.
// Nunca debe romper la navegación: todo va envuelto en try/catch y es best-effort.
export default function UsageTracker() {
    const pathname = usePathname();
    const ultimaRuta = useRef(null);

    useEffect(() => {
        if (!pathname || pathname === ultimaRuta.current) return;
        ultimaRuta.current = pathname;

        const payload = JSON.stringify({ ruta: pathname });

        try {
            if (typeof navigator !== "undefined" && navigator.sendBeacon) {
                const blob = new Blob([payload], { type: "application/json" });
                navigator.sendBeacon("/api/track", blob);
            } else {
                fetch("/api/track", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: payload,
                    keepalive: true,
                }).catch(() => {});
            }
        } catch {
            // ignorado a propósito
        }
    }, [pathname]);

    return null;
}
