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
import KpiGrande from "@/components/shared/KpiGrande";
import MercadoPublicoTable from "@/components/apis/mercado-publico/MercadoPublicoTable";
import GraficoConcentracion from "@/components/apis/tgr/GraficoConcentracion";
import { formatCLP, formatCLPCompacto } from "@/utils/formatCurrency";

const POR_PAGINA = 5;

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
        <div className="flex min-w-0 flex-col gap-6">
            {/* KPIs con Glassmorphism y Glow */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiGrande 
                    icono={Building2} 
                    titulo="Propiedades Únicas" 
                    valor={datos.length.toLocaleString("es-CL")} 
                    color="#38bdf8" 
                    glowColor="rgba(56, 189, 248, 0.25)" 
                />
                <KpiGrande 
                    icono={Wallet} 
                    titulo="Volumen Real" 
                    valor={formatCLPCompacto(totalMinimo)} 
                    color="#10b981" 
                    glowColor="rgba(16, 185, 129, 0.25)" 
                />
                <KpiGrande 
                    icono={TrendingUp} 
                    titulo="Promedio" 
                    valor={formatCLPCompacto(promedioMinimo)} 
                    color="#f59e0b" 
                    glowColor="rgba(245, 158, 11, 0.25)" 
                />
                <KpiGrande 
                    icono={BarChart2} 
                    titulo="Valor Máximo" 
                    valor={formatCLPCompacto(maxMinimo)} 
                    color="#ec4899" 
                    glowColor="rgba(236, 72, 153, 0.25)" 
                />
            </div>

            {/* Barra de Filtros Estilizada */}
            <div className="flex min-w-0 flex-wrap items-center gap-3 rounded-2xl bg-slate-900/60 p-3.5 backdrop-blur-xl border border-slate-800/80 shadow-md">
                <div className="relative min-w-0 flex-[2_1_14rem]">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400" />
                    <input
                        type="text"
                        placeholder="Buscar por Deudor, Dirección o Rol..."
                        value={busqueda}
                        onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
                        className="w-full rounded-xl bg-slate-950/60 pl-10 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 border border-slate-800/90 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                    />
                </div>

                <div className="relative min-w-0 flex-1 basis-[10rem]">
                    <Filter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                        value={comunaFiltro}
                        onChange={(e) => { setComunaFiltro(e.target.value); setPagina(1); }}
                        className="w-full rounded-xl bg-slate-950/60 pl-10 pr-4 py-2 text-sm text-slate-200 border border-slate-800/90 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all appearance-none cursor-pointer"
                    >
                        {comunas.map((c) => (
                            <option key={c} value={c} className="bg-slate-900 text-slate-200">{c}</option>
                        ))}
                    </select>
                </div>

                <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <BotonesExportar datos={datosFiltrados} nombre="remates_tgr" />

                    <button
                        onClick={forzarRecarga}
                        disabled={recargando}
                        className="flex items-center gap-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white px-3.5 py-2 text-xs font-mono font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw size={13} className={recargando ? "animate-spin text-cyan-400" : "text-slate-400"} />
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

            <p className="text-left sm:text-right text-[11px] font-mono text-slate-500">
                {"// fuente: TGR Chile — revalidación automática cada 60 min"}
            </p>
        </div>
    );
}