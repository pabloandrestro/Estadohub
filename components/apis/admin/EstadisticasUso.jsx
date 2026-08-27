"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

const ALTURA_MAPA = "clamp(480px, 72vh, 780px)";

const MapaMundialUso = dynamic(() => import("./MapaMundialUso"), {
    ssr: false,
    loading: () => (
        <div
            style={{
                height: ALTURA_MAPA,
                borderRadius: "0.6rem",
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                display: "grid",
                placeItems: "center",
                color: "var(--text-muted)",
                fontSize: "0.8rem",
            }}
        >
            Cargando mapa…
        </div>
    ),
});

const COLOR_EVENTOS = "#2563eb"; // azul
const COLOR_USUARIOS = "#0d9488"; // verde azulado
const GRID = "rgba(148, 163, 184, 0.22)";
const TICK = "#94a3b8";

const nf = new Intl.NumberFormat("es-CL");

const REGION = typeof Intl.DisplayNames === "function"
    ? new Intl.DisplayNames(["es"], { type: "region" })
    : null;

function nombrePais(iso) {
    if (!iso || iso === "XX") return "Desconocido";
    try {
        return REGION?.of(iso) || iso;
    } catch {
        return iso;
    }
}

function fechaCorta(iso) {
    // iso: "2026-08-26"
    const [y, m, d] = String(iso).split("-").map(Number);
    if (!y) return iso;
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
}

// Hora fija en zona de Chile y en 24h para que servidor (UTC) y cliente
// generen exactamente el mismo texto y no haya mismatch de hidratación.
function horaSantiago(iso) {
    try {
        return new Intl.DateTimeFormat("es-CL", {
            timeZone: "America/Santiago",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        })
            .format(new Date(iso))
            .replace(/\s+/g, " ")
            .trim();
    } catch {
        return "—";
    }
}

function TarjetaKpi({ etiqueta, valor, sufijo }) {
    return (
        <div
            style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "0.75rem",
                padding: "1rem 1.1rem",
            }}
        >
            <p
                style={{
                    margin: 0,
                    fontSize: "0.68rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--text-muted)",
                }}
            >
                {etiqueta}
            </p>
            <p
                style={{
                    margin: "0.35rem 0 0",
                    fontSize: "1.6rem",
                    fontWeight: 800,
                    fontFamily: "monospace",
                    color: "var(--text-secondary)",
                    lineHeight: 1.1,
                }}
            >
                {valor}
                {sufijo ? (
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)" }}>
                        {" "}
                        {sufijo}
                    </span>
                ) : null}
            </p>
        </div>
    );
}

function TooltipChart({ active, payload, label, formatoLabel }) {
    if (!active || !payload?.length) return null;
    return (
        <div
            style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "0.55rem",
                padding: "0.55rem 0.7rem",
                fontSize: "0.78rem",
                boxShadow: "0 10px 30px -12px rgba(0,0,0,0.5)",
            }}
        >
            <p style={{ margin: "0 0 0.3rem", color: "var(--text-muted)" }}>
                {formatoLabel ? formatoLabel(label) : label}
            </p>
            {payload.map((p) => (
                <p
                    key={p.dataKey}
                    style={{
                        margin: "0.1rem 0",
                        color: "var(--text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                    }}
                >
                    <span
                        style={{
                            width: 9,
                            height: 9,
                            borderRadius: 2,
                            background: p.color,
                            display: "inline-block",
                            flexShrink: 0,
                        }}
                    />
                    {p.name}: <strong>{nf.format(p.value)}</strong>
                </p>
            ))}
        </div>
    );
}

const marco = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "0.75rem",
    padding: "1.1rem 1.1rem 0.9rem",
};

const tituloBloque = {
    margin: "0 0 0.15rem",
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "var(--text-secondary)",
};

const subtituloBloque = {
    margin: "0 0 0.9rem",
    fontSize: "0.72rem",
    color: "var(--text-muted)",
};

export default function EstadisticasUso({
    dias = 30,
    resumen,
    porDia = [],
    porPais = [],
    porRuta = [],
    actualizado = null,
    ttlSegundos = 300,
    enProduccion = false,
}) {
    const tono = enProduccion ? "--success" : "--danger";
    const minutos = Math.round(ttlSegundos / 60);
    const serieDia = useMemo(
        () =>
            (porDia || []).map((f) => ({
                dia: f.dia,
                eventos: Number(f.eventos) || 0,
                usuarios: Number(f.usuarios_unicos) || 0,
            })),
        [porDia]
    );

    const serieRuta = useMemo(
        () =>
            (porRuta || [])
                .map((f) => ({ ruta: f.ruta, eventos: Number(f.eventos) || 0 }))
                .sort((a, b) => a.eventos - b.eventos),
        [porRuta]
    );

    const seriePais = useMemo(
        () =>
            (porPais || [])
                .map((f) => ({
                    iso: f.pais,
                    pais: nombrePais(f.pais),
                    eventos: Number(f.eventos) || 0,
                    usuarios: Number(f.usuarios_unicos) || 0,
                }))
                .sort((a, b) => b.eventos - a.eventos),
        [porPais]
    );

    const sinDatos = serieDia.length === 0 && seriePais.length === 0;

    return (
        <section style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <header>
                <p
                    style={{
                        margin: 0,
                        fontSize: "0.68rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.16em",
                        color: "var(--accent)",
                    }}
                >
                    Administración
                </p>
                <h1 style={{ margin: "0.3rem 0 0", fontSize: "1.7rem", fontWeight: 800, color: "var(--text-secondary)" }}>
                    Estadística de Uso
                </h1>
                <p style={{ margin: "0.35rem 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    Tráfico y alcance de la aplicación · últimos {dias} días.
                </p>
                {actualizado && (
                    <p
                        style={{ margin: "0.2rem 0 0", fontSize: "0.72rem", color: "var(--text-muted)" }}
                        suppressHydrationWarning
                    >
                        Datos al {horaSantiago(actualizado)} hrs · se actualizan cada {minutos} min.
                    </p>
                )}
            </header>

            {/* Aviso de entorno: verde en producción (geolocalización real),
                rojo en local (el mapa y el detalle por país no reflejan nada). */}
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.6rem",
                    padding: "0.75rem 0.9rem",
                    borderRadius: "0.7rem",
                    border: `1px solid color-mix(in srgb, var(${tono}) 45%, var(--border))`,
                    background: `color-mix(in srgb, var(${tono}) 10%, var(--surface))`,
                }}
            >
                {enProduccion ? (
                    <CheckCircle2 size={17} style={{ color: "var(--success)", flexShrink: 0, marginTop: "1px" }} />
                ) : (
                    <TriangleAlert size={17} style={{ color: "var(--danger)", flexShrink: 0, marginTop: "1px" }} />
                )}
                <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, color: `var(${tono})` }}>
                        {enProduccion
                            ? "Estadísticas activas en producción"
                            : "Entorno local - datos incompletos"}
                    </p>
                    <p style={{ margin: "0.15rem 0 0", fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                        {enProduccion
                            ? `El tráfico se registra con geolocalización real (país y ciudad). Los indicadores y el mapa reflejan el uso de la app y se refrescan cada ${minutos} min.`
                            : "El tráfico se registra, pero sin país ni ciudad: el mapa mundial y el detalle por país no reflejarán tu actividad. Para verlos, revisa esta página en el despliegue de Vercel."}
                    </p>
                </div>
            </div>

            {sinDatos && (
                <div
                    style={{
                        ...marco,
                        padding: "1.1rem",
                        fontSize: "0.82rem",
                        color: "var(--text-muted)",
                    }}
                >
                    Todavía no hay eventos registrados. Los datos empiezan a acumularse a medida
                    que se navega el dashboard con el seguimiento ya desplegado.
                </div>
            )}

            {/* KPIs */}
            <div
                style={{
                    display: "grid",
                    gap: "0.85rem",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                }}
            >
                <TarjetaKpi etiqueta="Eventos" valor={nf.format(resumen?.total_eventos ?? 0)} />
                <TarjetaKpi etiqueta="Usuarios activos" valor={nf.format(resumen?.usuarios_activos ?? 0)} />
                <TarjetaKpi etiqueta="Países" valor={nf.format(resumen?.paises ?? 0)} />
                <TarjetaKpi etiqueta="Eventos hoy" valor={nf.format(resumen?.eventos_hoy ?? 0)} />
            </div>

            {/* Tráfico por día */}
            <div style={marco}>
                <h2 style={tituloBloque}>Tráfico por día</h2>
                <p style={subtituloBloque}>Eventos de navegación y usuarios únicos por jornada.</p>
                <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                        <AreaChart data={serieDia} margin={{ top: 5, right: 12, bottom: 0, left: -8 }}>
                            <defs>
                                <linearGradient id="gradEventos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={COLOR_EVENTOS} stopOpacity={0.35} />
                                    <stop offset="100%" stopColor={COLOR_EVENTOS} stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke={GRID} vertical={false} />
                            <XAxis
                                dataKey="dia"
                                tickFormatter={fechaCorta}
                                tick={{ fill: TICK, fontSize: 11 }}
                                stroke={GRID}
                                minTickGap={24}
                            />
                            <YAxis
                                tick={{ fill: TICK, fontSize: 11 }}
                                stroke={GRID}
                                width={44}
                                allowDecimals={false}
                            />
                            <Tooltip content={<TooltipChart formatoLabel={fechaCorta} />} />
                            <Legend
                                wrapperStyle={{ fontSize: "0.75rem", paddingTop: "0.4rem" }}
                                iconType="plainline"
                            />
                            <Area
                                type="monotone"
                                dataKey="eventos"
                                name="Eventos"
                                stroke={COLOR_EVENTOS}
                                strokeWidth={2}
                                fill="url(#gradEventos)"
                                dot={false}
                                activeDot={{ r: 4 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="usuarios"
                                name="Usuarios únicos"
                                stroke={COLOR_USUARIOS}
                                strokeWidth={2}
                                fill="none"
                                dot={false}
                                activeDot={{ r: 4 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Mapa mundial */}
            <div style={{ ...marco, padding: "1.1rem 0.7rem 0.9rem" }}>
                <h2 style={{ ...tituloBloque, padding: "0 0.4rem" }}>Alcance geográfico</h2>
                <p style={{ ...subtituloBloque, padding: "0 0.4rem" }}>
                    Cada país se tiñe de azul según su volumen de eventos (escala relativa al país con más uso).
                </p>
                <MapaMundialUso porPais={seriePais} altura={ALTURA_MAPA} />
            </div>

            {/* Rutas más visitadas */}
            <div style={marco}>
                <h2 style={tituloBloque}>Rutas más visitadas</h2>
                <p style={subtituloBloque}>Secciones del dashboard con más navegación en el período.</p>
                <div style={{ width: "100%", height: Math.max(180, serieRuta.length * 34) }}>
                    <ResponsiveContainer>
                        <BarChart
                            data={serieRuta}
                            layout="vertical"
                            margin={{ top: 4, right: 16, bottom: 4, left: 12 }}
                        >
                            <CartesianGrid stroke={GRID} horizontal={false} />
                            <XAxis
                                type="number"
                                tick={{ fill: TICK, fontSize: 11 }}
                                stroke={GRID}
                                allowDecimals={false}
                            />
                            <YAxis
                                type="category"
                                dataKey="ruta"
                                tick={{ fill: TICK, fontSize: 11 }}
                                stroke={GRID}
                                width={180}
                            />
                            <Tooltip cursor={{ fill: "rgba(148,163,184,0.12)" }} content={<TooltipChart />} />
                            <Bar dataKey="eventos" name="Eventos" fill={COLOR_EVENTOS} radius={[0, 4, 4, 0]} barSize={16} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Tabla por país (vista accesible de respaldo) */}
            {seriePais.length > 0 && (
                <div style={marco}>
                    <h2 style={tituloBloque}>Detalle por país</h2>
                    <p style={subtituloBloque}>Mismos datos del mapa, en tabla.</p>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                            <thead>
                                <tr style={{ textAlign: "left", color: "var(--text-muted)" }}>
                                    <th style={{ padding: "0.45rem 0.6rem", borderBottom: "1px solid var(--border)" }}>País</th>
                                    <th style={{ padding: "0.45rem 0.6rem", borderBottom: "1px solid var(--border)", textAlign: "right" }}>
                                        Eventos
                                    </th>
                                    <th style={{ padding: "0.45rem 0.6rem", borderBottom: "1px solid var(--border)", textAlign: "right" }}>
                                        Usuarios
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {seriePais.map((f) => (
                                    <tr key={f.iso} style={{ color: "var(--text-secondary)" }}>
                                        <td style={{ padding: "0.45rem 0.6rem", borderBottom: "1px solid var(--border)" }}>
                                            {f.pais}
                                            <span style={{ color: "var(--text-muted)" }}> · {f.iso}</span>
                                        </td>
                                        <td style={{ padding: "0.45rem 0.6rem", borderBottom: "1px solid var(--border)", textAlign: "right", fontFamily: "monospace" }}>
                                            {nf.format(f.eventos)}
                                        </td>
                                        <td style={{ padding: "0.45rem 0.6rem", borderBottom: "1px solid var(--border)", textAlign: "right", fontFamily: "monospace" }}>
                                            {nf.format(f.usuarios)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </section>
    );
}
