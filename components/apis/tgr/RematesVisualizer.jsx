"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    Building2,
    Wallet,
    TrendingUp,
    BarChart2,
    Filter,
    RefreshCw,
} from "lucide-react";
import BotonesExportar from "@/components/shared/BotonesExportar";
import TableLoadingOverlay from "@/components/shared/TableLoadingOverlay";
import TablaSwipeHint from "@/components/shared/TablaSwipeHint";
import GraficoConcentracion from "@/components/apis/tgr/GraficoConcentracion";
import { formatCLP, formatCLPCompacto } from "@/utils/formatCurrency";

const POR_PAGINA = 5;

const stickyAcciones = {
    position: "sticky",
    right: 0,
    zIndex: 1,
    boxShadow: "-8px 0 12px -12px rgba(0,0,0,0.45)",
};

function KpiGrande({ icono: Icono, titulo, valor, color }) {
    return (
        <div className="kpi-tgr">
            <div
                className="kpi-tgr-icon"
                style={{
                    background: `color-mix(in srgb, ${color} 12%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
                }}
            >
                <Icono size={18} style={{ color }} />
            </div>
            <div className="min-w-0">
                <p className="kpi-tgr-label">{titulo}</p>
                <p className="kpi-tgr-value" style={{ color }}>
                    {valor}
                </p>
            </div>
        </div>
    );
}

export default function RematesVisualizer({ datos = [] }) {
    const router = useRouter();
    const [busqueda, setBusqueda] = useState("");
    const [comunaFiltro, setComunaFiltro] = useState("TODAS");
    const [pagina, setPagina] = useState(1);
    const [recargando, setRecargando] = useState(false);

    const comunas = useMemo(() => {
        const set = new Set(datos.map((d) => d.comunaJuzgado).filter(Boolean));
        return ["TODAS", ...Array.from(set).sort()];
    }, [datos]);

    const datosFiltrados = useMemo(() => {
        let res = datos;
        if (comunaFiltro !== "TODAS") {
            res = res.filter((d) => d.comunaJuzgado === comunaFiltro);
        }
        if (busqueda.trim()) {
            const b = busqueda.toLowerCase();
            res = res.filter(
                (d) =>
                    (d.direccionRol ?? "").toLowerCase().includes(b) ||
                    (d.nombreDuegno ?? "").toLowerCase().includes(b) ||
                    (d.rol ?? "").toLowerCase().includes(b)
            );
        }
        return res;
    }, [datos, busqueda, comunaFiltro]);

    const totalMinimo = useMemo(
        () => datos.reduce((s, d) => s + (d.montoMinimo || d.montoAvaluo || 0), 0),
        [datos]
    );

    const promedioMinimo = useMemo(() => {
        const conMonto = datos.filter((d) => d.montoMinimo || d.montoAvaluo);
        if (!conMonto.length) return 0;
        return (
            conMonto.reduce((s, d) => s + (d.montoMinimo || d.montoAvaluo || 0), 0) /
            conMonto.length
        );
    }, [datos]);

    const maxMinimo = useMemo(
        () => Math.max(0, ...datos.map((d) => d.montoMinimo || d.montoAvaluo || 0)),
        [datos]
    );

    const totalPaginas = Math.ceil(datosFiltrados.length / POR_PAGINA);
    const datosPagina = datosFiltrados.slice(
        (pagina - 1) * POR_PAGINA,
        pagina * POR_PAGINA
    );

    async function forzarRecarga() {
        setRecargando(true);
        try {
            await fetch("/api/remates?recargar=1");
            window.location.reload();
        } catch {
            setRecargando(false);
        }
    }

    const COLUMNAS = [
        {
            key: "nombreDuegno",
            label: "Deudor",
            minWidth: "160px",
            render: (v) => (
                <span title={v || undefined} className="tgr-celda-truncada">
                    {v || "—"}
                </span>
            ),
        },
        {
            key: "direccionRol",
            label: "Ubicación",
            minWidth: "200px",
            render: (v) => (
                <span title={v || undefined} className="tgr-celda-truncada">
                    {v ?? "—"}
                </span>
            ),
        },
        {
            key: "montoMinimo",
            label: "Tasación",
            minWidth: "120px",
            render: (v, fila) => {
                const monto = v || fila.montoAvaluo;
                return (
                    <span
                        style={{
                            color: monto ? "var(--success)" : "var(--text-muted)",
                            fontFamily: "monospace",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {monto ? formatCLP(monto) : "—"}
                    </span>
                );
            },
        },
    ];

    return (
        <div className="flex min-w-0 flex-col gap-5 sm:gap-6">

            {/* KPIs */}
            <div className="kpi-grid kpi-grid--4">
                <KpiGrande icono={Building2} titulo="Propiedades Únicas" valor={datos.length.toLocaleString("es-CL")} color="var(--accent)" />
                <KpiGrande icono={Wallet} titulo="Volumen Real" valor={formatCLPCompacto(totalMinimo)} color="var(--success)" />
                <KpiGrande icono={TrendingUp} titulo="Promedio" valor={formatCLPCompacto(promedioMinimo)} color="var(--warning)" />
                <KpiGrande icono={BarChart2} titulo="Valor Máximo" valor={formatCLPCompacto(maxMinimo)} color="var(--danger)" />
            </div>

            {/* Filtros */}
            <div
                className="flex min-w-0 flex-wrap items-center gap-2.5 rounded-xl p-3.5 sm:gap-3 sm:p-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
                <div className="relative min-w-0 flex-[2_1_12rem]">
                    <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--accent)" }} />
                    <input
                        type="text"
                        placeholder="Deudor o Dirección..."
                        value={busqueda}
                        onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
                        style={{
                            width: "100%",
                            paddingLeft: "34px", paddingRight: "12px",
                            paddingTop: "8px", paddingBottom: "8px",
                            background: "var(--surface-2)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            color: "var(--text-secondary)",
                            fontSize: "0.85rem",
                            outline: "none",
                        }}
                    />
                </div>

                <div className="relative min-w-0 flex-1 basis-[9rem]">
                    <Filter size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--warning)" }} />
                    <select
                        value={comunaFiltro}
                        onChange={(e) => { setComunaFiltro(e.target.value); setPagina(1); }}
                        style={{
                            width: "100%",
                            paddingLeft: "32px", paddingRight: "12px",
                            paddingTop: "8px", paddingBottom: "8px",
                            background: "var(--surface-2)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            color: "var(--text-secondary)",
                            fontSize: "0.85rem",
                            outline: "none",
                            appearance: "none",
                        }}
                    >
                        {comunas.map((c) => (
                            <option key={c} value={c} style={{ background: "var(--surface)" }}>{c}</option>
                        ))}
                    </select>
                </div>

                <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <BotonesExportar datos={datosFiltrados} nombre="remates_tgr" />

                    <button
                        onClick={forzarRecarga}
                        disabled={recargando}
                        style={{
                            display: "flex", alignItems: "center", gap: "6px",
                            background: "var(--surface-2)",
                            border: "1px solid var(--border)",
                            color: recargando ? "var(--text-muted)" : "var(--text-secondary)",
                            padding: "0.5rem 1rem",
                            borderRadius: "8px",
                            fontSize: "0.8rem",
                            fontFamily: "monospace",
                            cursor: recargando ? "not-allowed" : "pointer",
                        }}
                    >
                        <RefreshCw size={13} style={{ animation: recargando ? "spin 1s linear infinite" : "none" }} />
                        {recargando ? "Recargando..." : "Recargar"}
                    </button>
                </div>
            </div>

            {/* Tabla + Gráfico */}
            <div className="tgr-main-grid">
                <TableLoadingOverlay active={recargando} label="Actualizando remates…">
                    <div className="min-w-0">
                        <TablaSwipeHint />
                        <div
                            className="overflow-hidden rounded-xl"
                            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                        >
                            <div className="overflow-x-auto">
                                <table
                                    className="tgr-tabla"
                                    style={{
                                        width: "100%",
                                        minWidth: "640px",
                                        borderCollapse: "collapse",
                                        fontSize: "0.85rem",
                                    }}
                                >
                                    <thead>
                                        <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                                            {COLUMNAS.map((col) => (
                                                <th
                                                    key={col.key}
                                                    style={{
                                                        minWidth: col.minWidth,
                                                        textAlign: "left",
                                                        padding: "0.75rem 1rem",
                                                        color: "var(--text-muted)",
                                                        fontSize: "0.7rem",
                                                        fontFamily: "monospace",
                                                        fontWeight: 700,
                                                        letterSpacing: "0.06em",
                                                        textTransform: "uppercase",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {col.label}
                                                </th>
                                            ))}
                                            <th
                                                style={{
                                                    minWidth: "100px",
                                                    textAlign: "right",
                                                    padding: "0.75rem 1rem",
                                                    color: "var(--text-muted)",
                                                    fontSize: "0.7rem",
                                                    fontFamily: "monospace",
                                                    fontWeight: 700,
                                                    letterSpacing: "0.06em",
                                                    textTransform: "uppercase",
                                                    whiteSpace: "nowrap",
                                                    background: "var(--surface-2)",
                                                    ...stickyAcciones,
                                                }}
                                            >
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {datosPagina.length === 0 ? (
                                            <tr>
                                                <td colSpan={COLUMNAS.length + 1} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", fontFamily: "monospace" }}>
                                                    // Sin resultados
                                                </td>
                                            </tr>
                                        ) : (
                                            datosPagina.map((fila, i) => {
                                                const rowBg =
                                                    i % 2 === 0
                                                        ? "var(--surface)"
                                                        : "color-mix(in srgb, var(--surface-2) 40%, var(--surface))";
                                                return (
                                                    <tr key={i} style={{ borderBottom: "1px solid var(--border)", background: rowBg }}>
                                                        {COLUMNAS.map((col) => (
                                                            <td
                                                                key={col.key}
                                                                style={{
                                                                    padding: "0.75rem 1rem",
                                                                    overflow: "hidden",
                                                                    verticalAlign: "middle",
                                                                    whiteSpace: "nowrap",
                                                                    maxWidth: col.minWidth,
                                                                }}
                                                            >
                                                                {col.render ? col.render(fila[col.key], fila) : fila[col.key] ?? "—"}
                                                            </td>
                                                        ))}
                                                        <td
                                                            style={{
                                                                padding: "0.75rem 1rem",
                                                                textAlign: "right",
                                                                verticalAlign: "middle",
                                                                background: rowBg,
                                                                ...stickyAcciones,
                                                            }}
                                                        >
                                                            <button
                                                                onClick={() => {
                                                                    const rolFormato = fila._raw?.rolFormato;
                                                                    if (rolFormato) router.push(`/dashboard/tgr/${encodeURIComponent(rolFormato)}`);
                                                                }}
                                                                style={{
                                                                    background: "var(--surface-2)",
                                                                    border: "1px solid var(--accent)",
                                                                    color: "var(--accent)",
                                                                    padding: "4px 14px",
                                                                    borderRadius: "6px",
                                                                    fontSize: "0.75rem",
                                                                    fontFamily: "monospace",
                                                                    cursor: "pointer",
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    gap: "4px",
                                                                    whiteSpace: "nowrap",
                                                                }}
                                                            >
                                                                Ver →
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2" style={{
                                padding: "0.75rem 1rem", borderTop: "1px solid var(--border)",
                                background: "var(--surface-2)",
                            }}>
                                <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontFamily: "monospace" }}>
                                    Página {pagina} de {totalPaginas || 1}
                                </p>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina === 1} style={{ background: "var(--surface)", border: "1px solid var(--border)", color: pagina === 1 ? "var(--text-muted)" : "var(--text-secondary)", padding: "4px 12px", borderRadius: "6px", fontSize: "0.8rem", cursor: pagina === 1 ? "not-allowed" : "pointer" }}>‹</button>
                                    <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas || totalPaginas === 0} style={{ background: "var(--surface)", border: "1px solid var(--border)", color: (pagina === totalPaginas || totalPaginas === 0) ? "var(--text-muted)" : "var(--text-secondary)", padding: "4px 12px", borderRadius: "6px", fontSize: "0.8rem", cursor: (pagina === totalPaginas || totalPaginas === 0) ? "not-allowed" : "pointer" }}>›</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </TableLoadingOverlay>

                <GraficoConcentracion datos={datosFiltrados} />
            </div>

            <p className="text-left sm:text-right" style={{ color: "var(--text-muted)", fontSize: "0.7rem", fontFamily: "monospace" }}>
                // fuente: TGR Chile — revalidación automática cada 60 min
            </p>
        </div>
    );
}
