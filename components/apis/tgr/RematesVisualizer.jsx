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
import MercadoPublicoTable from "@/components/apis/mercado-publico/MercadoPublicoTable";
import GraficoConcentracion from "@/components/apis/tgr/GraficoConcentracion";
import { formatCLP, formatCLPCompacto } from "@/utils/formatCurrency";

const POR_PAGINA = 5;

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
            key: "rol",
            label: "Rol",
            card: "id",
            render: (row) => row.rol ?? "—",
        },
        {
            key: "nombreDuegno",
            label: "Deudor",
            card: "title",
            render: (row) => (
                <span title={row.nombreDuegno || undefined}>{row.nombreDuegno || "—"}</span>
            ),
        },
        {
            key: "direccionRol",
            label: "Ubicación",
            render: (row) => (
                <span title={row.direccionRol || undefined}>{row.direccionRol ?? "—"}</span>
            ),
        },
        {
            key: "montoMinimo",
            label: "Tasación",
            card: "highlight",
            render: (row) => {
                const monto = row.montoMinimo || row.montoAvaluo;
                return monto ? formatCLP(monto) : "—";
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
                    <MercadoPublicoTable
                        columns={COLUMNAS}
                        rows={datosPagina}
                        onVerDetalle={(fila) => {
                            const rolFormato = fila._raw?.rolFormato;
                            if (rolFormato) router.push(`/dashboard/tgr/${encodeURIComponent(rolFormato)}`);
                        }}
                        emptyMessage="Sin resultados."
                        labelPlural="remates"
                        paginaTamano={POR_PAGINA}
                        pagina={pagina}
                        totalFilas={datosFiltrados.length}
                        onPaginaChange={setPagina}
                    />
                </TableLoadingOverlay>

                <GraficoConcentracion datos={datosFiltrados} />
            </div>

            <p className="text-left sm:text-right" style={{ color: "var(--text-muted)", fontSize: "0.7rem", fontFamily: "monospace" }}>
                // fuente: TGR Chile — revalidación automática cada 60 min
            </p>
        </div>
    );
}
