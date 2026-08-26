"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Filter, Layers, MapPin, Wallet } from "lucide-react";
import MpSubnav from "./MpSubnav";
import KpiGrande from "@/components/shared/KpiGrande";
import MercadoPublicoTable from "./MercadoPublicoTable";
import SkeletonTabla from "@/components/shared/SkeletonTabla";
import TableLoadingOverlay from "@/components/shared/TableLoadingOverlay";
import { useMercadoPublico } from "./useMercadoPublico";
import CampoBusquedaMp from "./CampoBusquedaMp";
import AvisoDesdeDb from "./AvisoDesdeDb";
import MercadoPublicoDetalleModal from "./MercadoPublicoDetalleModal";
import EstadoBadge from "./EstadoBadge";
import { formatFechaMp, formatMoneyMp } from "@/lib/mercado-publico/formatMp";
import { formatCLPCompacto } from "@/utils/formatCurrency";

const PAGE_SIZE = 5;

export default function CompraAgilVisualizer() {
    const [textoBusqueda, setTextoBusqueda] = useState("");
    const [consulta, setConsulta] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState("");
    const [regionFiltro, setRegionFiltro] = useState("");
    const [orden, setOrden] = useState("");
    const [pagina, setPagina] = useState(1);
    const [detalleAbierto, setDetalleAbierto] = useState(null);
    const [parches, setParches] = useState({});

    useEffect(() => {
        setPagina(1);
    }, [consulta, estadoFiltro, regionFiltro, orden]);

    const { data, loading, refreshing, error, total, totalFiltrados, estados, regiones, montoTotalOferta } =
        useMercadoPublico("compra-agil", {
            q: consulta,
            estado: estadoFiltro,
            region: regionFiltro,
            orden,
            page: pagina,
            pageSize: PAGE_SIZE,
        });

    function aplicarBusqueda() {
        setConsulta(textoBusqueda.trim());
        setPagina(1);
    }

    const dataActualizada = useMemo(
        () => data.map((r) => (parches[r.codigo] ? { ...r, ...parches[r.codigo] } : r)),
        [data, parches]
    );

    function onDetalleCargado(fila) {
        setParches((prev) => ({ ...prev, [fila.codigo]: fila }));
    }

    const hayFiltros = Boolean(consulta || estadoFiltro || regionFiltro);
    const mostrandoCarga = loading && data.length === 0;

    const columns = [
        {
            key: "codigo",
            label: "Código",
            card: "id",
            render: (row) => row.codigo ?? "—",
        },
        {
            key: "nombre",
            label: "Nombre",
            card: "title",
            render: (row) => <span title={row.nombre || undefined}>{row.nombre ?? "—"}</span>,
        },
        {
            key: "estado",
            label: "Estado",
            card: "badge",
            render: (row) => <EstadoBadge estado={row.estado} />,
        },
        {
            key: "organismo",
            label: "Organismo",
            render: (row) => <span title={row.organismo || undefined}>{row.organismo ?? "—"}</span>,
        },
        {
            key: "region",
            label: "Región",
            render: (row) => <span title={row.region || undefined}>{row.region ?? "—"}</span>,
        },
        {
            key: "fechaCierre",
            label: "Cierre",
            render: (row) => formatFechaMp(row.fechaCierre),
        },
        {
            key: "monto",
            label: "Monto",
            card: "highlight",
            render: (row) => formatMoneyMp(row.monto),
        },
    ];

    return (
        <section className="flex flex-col gap-5 sm:gap-6">
            <MpSubnav />

            <div
                style={{
                    borderRadius: "1rem",
                    border: "1px solid color-mix(in srgb, var(--accent) 20%, var(--border))",
                    background: "color-mix(in srgb, var(--accent) 4%, var(--surface))",
                    padding: "1.35rem",
                }}
            >
                <p
                    style={{
                        margin: 0,
                        marginBottom: "0.35rem",
                        fontSize: "0.7rem",
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: "var(--accent)",
                        fontWeight: 700,
                    }}
                >
                    Mercado Público
                </p>
                <h1
                    className="text-2xl font-extrabold sm:text-[1.8rem]"
                    style={{
                        margin: 0,
                        color: "var(--text-secondary)",
                    }}
                >
                    Compra Ágil
                </h1>
                <p
                    style={{
                        margin: 0,
                        marginTop: "0.45rem",
                        color: "var(--text-muted)",
                        fontSize: "0.92rem",
                        maxWidth: "60ch",
                    }}
                >
                    Compras ágiles sincronizadas desde Mercado Público
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <KpiGrande
                    icono={Building2}
                    titulo="Registros"
                    valor={total ?? 0}
                    color="var(--accent)"
                    glowColor="color-mix(in srgb, var(--accent) 25%, transparent)"
                />
                <KpiGrande
                    icono={Filter}
                    titulo="Filtrados"
                    valor={totalFiltrados ?? 0}
                    color="var(--warning)"
                    glowColor="color-mix(in srgb, var(--warning) 25%, transparent)"
                />
                <KpiGrande
                    icono={Layers}
                    titulo="Estados"
                    valor={estados.length}
                    color="var(--danger)"
                    glowColor="color-mix(in srgb, var(--danger) 25%, transparent)"
                />
                <KpiGrande
                    icono={MapPin}
                    titulo="Regiones"
                    valor={regiones.length}
                    color="var(--accent)"
                    glowColor="color-mix(in srgb, var(--accent) 25%, transparent)"
                />
                <KpiGrande
                    icono={Wallet}
                    titulo="Monto total oferta"
                    valor={montoTotalOferta != null ? formatCLPCompacto(montoTotalOferta) : "—"}
                    tooltip={montoTotalOferta != null ? formatMoneyMp(montoTotalOferta) : undefined}
                    color="var(--success)"
                    glowColor="color-mix(in srgb, var(--success) 25%, transparent)"
                />
            </div>
            <AvisoDesdeDb
                visible
                loading={loading || refreshing}
                hayFilas={total > 0 || data.length > 0}
                error={error}
            />

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                    borderRadius: "1rem",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    padding: "1.1rem",
                }}
            >
                <div className="flex min-w-0 flex-wrap gap-3">
                    <CampoBusquedaMp
                        valor={textoBusqueda}
                        onCambiar={setTextoBusqueda}
                        onBuscar={aplicarBusqueda}
                        placeholder="Buscar por nombre, código u organismo..."
                    />

                    <select
                        value={orden}
                        onChange={(e) => setOrden(e.target.value)}
                        className="min-w-0 flex-1 basis-[10rem]"
                        style={{
                            padding: "0.7rem 0.9rem",
                            borderRadius: "0.75rem",
                            border: "1px solid var(--border)",
                            background: "var(--surface-2)",
                            color: "var(--text-secondary)",
                            fontSize: "0.84rem",
                            outline: "none",
                        }}
                    >
                        <option value="">Orden predeterminado</option>
                        <option value="precio-desc">Precio (Mayor a menor)</option>
                        <option value="precio-asc">Precio (Menor a mayor)</option>
                        <option value="fecha-desc">Fecha (Mayor a menor)</option>
                        <option value="fecha-asc">Fecha (Menor a mayor)</option>
                    </select>
                </div>

                <div className="flex min-w-0 flex-wrap gap-3">
                    <select
                        value={estadoFiltro}
                        onChange={(e) => setEstadoFiltro(e.target.value)}
                        className="min-w-0 flex-1 basis-[9rem]"
                        style={{
                            padding: "0.7rem 0.9rem",
                            borderRadius: "0.75rem",
                            border: "1px solid var(--border)",
                            background: "var(--surface-2)",
                            color: "var(--text-secondary)",
                            fontSize: "0.84rem",
                            outline: "none",
                        }}
                    >
                        <option value="">Todos los estados</option>
                        {estados.map((e) => (
                            <option key={e} value={e}>
                                {e}
                            </option>
                        ))}
                    </select>

                    <select
                        value={regionFiltro}
                        onChange={(e) => setRegionFiltro(e.target.value)}
                        className="min-w-0 flex-1 basis-[9rem]"
                        style={{
                            padding: "0.7rem 0.9rem",
                            borderRadius: "0.75rem",
                            border: "1px solid var(--border)",
                            background: "var(--surface-2)",
                            color: "var(--text-secondary)",
                            fontSize: "0.84rem",
                            outline: "none",
                        }}
                    >
                        <option value="">Todas las regiones</option>
                        {regiones.map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>

                    {hayFiltros && (
                        <button
                            type="button"
                            onClick={() => {
                                setTextoBusqueda("");
                                setConsulta("");
                                setEstadoFiltro("");
                                setRegionFiltro("");
                            }}
                            className="shrink-0"
                            style={{
                                padding: "0.7rem 0.9rem",
                                borderRadius: "0.75rem",
                                border: "1px solid var(--danger)",
                                background: "transparent",
                                color: "var(--danger)",
                                fontSize: "0.84rem",
                                cursor: "pointer",
                            }}
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            </div>

            <TableLoadingOverlay
                active={loading || refreshing}
                label={refreshing ? "Actualizando tabla…" : "Cargando compras ágiles…"}
            >
                {mostrandoCarga ? (
                    <SkeletonTabla filas={8} />
                ) : !loading && totalFiltrados === 0 ? (
                    <div
                        style={{
                            padding: "3rem 1rem",
                            textAlign: "center",
                            color: "var(--text-muted)",
                            border: "1px solid var(--border)",
                            borderRadius: "0.75rem",
                            background: "var(--surface)",
                        }}
                    >
                        <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-secondary)", margin: 0, marginBottom: "0.45rem" }}>
                            Sin resultados
                        </p>
                        <p style={{ margin: 0, fontSize: "0.84rem" }}>
                            {hayFiltros
                                ? "No hay registros que coincidan con los filtros aplicados."
                                : "No hay compras ágiles en Supabase todavía."}
                        </p>
                    </div>
                ) : (
                    <MercadoPublicoTable
                        columns={columns}
                        rows={dataActualizada}
                        onVerDetalle={setDetalleAbierto}
                        emptyMessage="Sin registros disponibles."
                        labelPlural="compras ágiles"
                        paginaTamano={PAGE_SIZE}
                        pagina={pagina}
                        totalFilas={totalFiltrados}
                        onPaginaChange={setPagina}
                    />
                )}
            </TableLoadingOverlay>

            {detalleAbierto && (
                <MercadoPublicoDetalleModal
                    row={parches[detalleAbierto.codigo] ?? detalleAbierto}
                    modulo="compra-agil"
                    onClose={() => setDetalleAbierto(null)}
                    onDetalleCargado={onDetalleCargado}
                />
            )}
        </section>
    );
}
