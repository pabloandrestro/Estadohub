"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Escala de azul (blue-100 → blue-900) para el coroplético.
const AZUL_CLARO = [219, 234, 254];
const AZUL_OSCURO = [30, 58, 138];

function colorAzul(t) {
    const rgb = AZUL_CLARO.map((c, i) => Math.round(c + (AZUL_OSCURO[i] - c) * t));
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

// Raíz cuadrada: evita que los países con poco uso queden invisibles frente
// al de mayor tráfico (típicamente Chile).
function intensidad(valor, max) {
    if (!valor || max <= 0) return 0;
    return Math.min(1, Math.sqrt(valor) / Math.sqrt(max));
}

function isoDe(feature) {
    const p = feature.properties || {};
    const iso = p.ISO_A2_EH && p.ISO_A2_EH !== "-99" ? p.ISO_A2_EH : p.ISO_A2;
    return iso ? String(iso).toUpperCase() : null;
}

const ALTURA_MAPA = "clamp(480px, 72vh, 780px)";

export default function MapaMundialUso({ porPais = [], altura = ALTURA_MAPA }) {
    const [geo, setGeo] = useState(null);
    const [errorGeo, setErrorGeo] = useState(false);

    useEffect(() => {
        let vivo = true;
        fetch("/geo/paises-mundo.geojson")
            .then((r) => {
                if (!r.ok) throw new Error(String(r.status));
                return r.json();
            })
            .then((d) => vivo && setGeo(d))
            .catch(() => vivo && setErrorGeo(true));
        return () => {
            vivo = false;
        };
    }, []);

    const { valores, max } = useMemo(() => {
        const m = new Map();
        let mx = 0;
        for (const fila of porPais) {
            const iso = String(fila.iso || "").toUpperCase();
            if (!iso || iso === "XX") continue;
            const v = Number(fila.eventos) || 0;
            m.set(iso, v);
            if (v > mx) mx = v;
        }
        return { valores: m, max: mx };
    }, [porPais]);

    const estilo = (feature) => {
        const v = valores.get(isoDe(feature)) || 0;
        const t = intensidad(v, max);
        return {
            fillColor: v > 0 ? colorAzul(t) : "#cbd5e1",
            fillOpacity: v > 0 ? 0.9 : 0.14,
            color: "#64748b",
            weight: 0.5,
        };
    };

    const onEachFeature = (feature, layer) => {
        const p = feature.properties || {};
        const nombre = p.NAME_ES || p.NAME || isoDe(feature) || "—";
        const v = valores.get(isoDe(feature)) || 0;
        layer.bindTooltip(
            `${nombre}: ${v.toLocaleString("es-CL")} eventos`,
            { sticky: true }
        );
    };

    if (errorGeo) {
        return (
            <div
                style={{
                    height: altura,
                    borderRadius: "0.6rem",
                    border: "1px solid var(--border)",
                    background: "var(--surface-2)",
                    display: "grid",
                    placeItems: "center",
                    color: "var(--text-muted)",
                    fontSize: "0.8rem",
                }}
            >
                No se pudo cargar el mapa base.
            </div>
        );
    }

    return (
        <div>
            <div
                className="w-full overflow-hidden"
                style={{
                    height: altura,
                    borderRadius: "0.6rem",
                    border: "1px solid var(--border)",
                }}
            >
                <MapContainer
                    center={[15, 0]}
                    zoom={2}
                    minZoom={1}
                    maxZoom={6}
                    worldCopyJump
                    scrollWheelZoom
                    attributionControl={false}
                    style={{ height: "100%", width: "100%", background: "var(--surface-2)" }}
                >
                    {geo && (
                        <GeoJSON
                            key={`${max}-${valores.size}`}
                            data={geo}
                            style={estilo}
                            onEachFeature={onEachFeature}
                        />
                    )}
                </MapContainer>
            </div>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginTop: "0.6rem",
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                }}
            >
                <span>menos uso</span>
                <span
                    style={{
                        flex: 1,
                        maxWidth: "160px",
                        height: "8px",
                        borderRadius: "999px",
                        background: `linear-gradient(90deg, ${colorAzul(0)}, ${colorAzul(0.5)}, ${colorAzul(1)})`,
                    }}
                />
                <span>más uso</span>
            </div>
        </div>
    );
}
