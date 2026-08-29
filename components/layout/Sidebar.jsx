"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, X, Database, ShoppingCart, Activity } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import BetaFeedbackCard from "@/components/layout/BetaFeedbackCard";

const nav = [
    {
        grupo: "FUENTES DE DATOS",
        items: [
            {
                href: "/dashboard/tgr",
                label: "TGR",
                desc: "Remates judiciales",
                badge: true,
                icon: (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <rect x="3" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="3" width="7" height="7" rx="1.5" />
                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                        <rect x="14" y="14" width="7" height="7" rx="1.5" />
                    </svg>
                ),
            },
            {
                href: "/dashboard/mercado-publico/compra-agil",
                label: "Mercado Público",
                desc: "Compras del Estado (3 módulos)",
                icon: (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                ),
            },
        ],
    },
];

const mpItems = [
    { href: "/dashboard/mercado-publico/compra-agil", label: "Compra Ágil" },
    { href: "/dashboard/mercado-publico/licitaciones", label: "Licitaciones" },
    { href: "/dashboard/mercado-publico/ordenes-compra", label: "Órdenes de Compra" },
];

export default function Sidebar({ open = false, onClose }) {
    const pathname = usePathname();
    const enMP = pathname.startsWith("/dashboard/mercado-publico");
    const [esAdmin, setEsAdmin] = useState(false);

    useEffect(() => {
        let activo = true;
        const supabase = createSupabaseBrowserClient();

        supabase.auth.getUser().then(async ({ data }) => {
            if (!activo || !data?.user) return;
            const { data: perfil } = await supabase
                .from("usuarios")
                .select("rol")
                .eq("id", data.user.id)
                .maybeSingle();
            if (activo) setEsAdmin(perfil?.rol === "admin");
        });

        return () => {
            activo = false;
        };
    }, []);

    return (
        <>
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex min-h-dvh shrink-0 flex-col bg-[#0b0f19]/95 backdrop-blur-xl border-r border-slate-800/80 transition-transform duration-300 ease-out lg:static lg:z-auto lg:translate-x-0 ${
                    open ? "translate-x-0" : "-translate-x-full pointer-events-none lg:pointer-events-auto"
                }`}
                style={{ width: "var(--sidebar-w)" }}
            >
                {/* Encabezado con Nuevo Logo SVG */}
                <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3 select-none">
                        {/* Isotipo SVG Tecnológico y Colorido */}
                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-violet-500/20 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                                <circle cx="12" cy="12" r="9" stroke="url(#logo-grad-1)" strokeWidth="2" strokeDasharray="3 3" />
                                <path
                                    d="M12 3C7.02944 3 3 7.02944 3 12C3 14.5 4 16.8 5.7 18.4"
                                    stroke="url(#logo-grad-2)"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                />
                                <circle cx="12" cy="12" r="3.5" fill="#38bdf8" />
                                <defs>
                                    <linearGradient id="logo-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#06b6d4" />
                                        <stop offset="100%" stopColor="#8b5cf6" />
                                    </linearGradient>
                                    <linearGradient id="logo-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#38bdf8" />
                                        <stop offset="100%" stopColor="#ec4899" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>

                        {/* Textos de Marca */}
                        <div className="flex flex-col">
                            <div className="flex items-center text-lg font-black tracking-tight leading-none">
                                <span className="text-white">Estado</span>
                                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(56,189,248,0.3)]">
                                    HUB
                                </span>
                            </div>
                            <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mt-1">
                                APIs del Estado
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        aria-label="Cerrar menú"
                        onClick={onClose}
                        className="rounded-lg p-1.5 border border-slate-800 bg-slate-900 text-slate-400 hover:text-white lg:hidden transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Navegación Principal */}
                <nav className="flex-1 p-3.5 space-y-6 overflow-y-auto">
                    {nav.map((grupo) => (
                        <div key={grupo.grupo} className="space-y-1.5">
                            <p className="px-2 text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">
                                {grupo.grupo}
                            </p>

                            <ul className="space-y-1">
                                {grupo.items.map((item) => {
                                    const isTGR = item.href === "/dashboard/tgr";
                                    const isMP = item.href.startsWith("/dashboard/mercado-publico");
                                    const active = isTGR
                                        ? pathname.startsWith("/dashboard/tgr")
                                        : isMP
                                            ? pathname.startsWith("/dashboard/mercado-publico")
                                            : pathname === item.href;

                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                onClick={onClose}
                                                className={`group relative flex items-center gap-3 rounded-xl p-2.5 transition-all duration-200 border ${
                                                    active
                                                        ? "bg-slate-900/80 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.12)] text-white"
                                                        : "bg-transparent border-transparent text-slate-400 hover:bg-slate-900/50 hover:text-slate-200 hover:border-slate-800"
                                                }`}
                                            >
                                                {/* Indicador de barra lateral activa */}
                                                {active && (
                                                    <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                                                )}

                                                <span
                                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                                                        active
                                                            ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                                                            : "bg-slate-900/80 border-slate-800 text-slate-500 group-hover:text-slate-300 group-hover:border-slate-700"
                                                    }`}
                                                >
                                                    {item.icon}
                                                </span>

                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-semibold tracking-tight ${active ? "text-cyan-300" : "text-slate-200"}`}>
                                                        {item.label}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 truncate">
                                                        {item.desc}
                                                    </p>
                                                </div>

                                                {item.badge && isTGR && active && (
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                                                    </span>
                                                )}
                                            </Link>

                                            {/* Submenú de Mercado Público */}
                                            {isMP && enMP && (
                                                <ul className="mt-1 ml-6 pl-3 space-y-1 border-l border-slate-800/80">
                                                    {mpItems.map((sub) => {
                                                        const subActive = pathname === sub.href;
                                                        return (
                                                            <li key={sub.href}>
                                                                <Link
                                                                    href={sub.href}
                                                                    onClick={onClose}
                                                                    className={`block rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                                                                        subActive
                                                                            ? "bg-cyan-500/10 font-semibold text-cyan-400"
                                                                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                                                                    }`}
                                                                >
                                                                    {sub.label}
                                                                </Link>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}

                    {/* Módulo Administración */}
                    {esAdmin && (
                        <div className="space-y-1.5 pt-2">
                            <p className="px-2 text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">
                                ADMINISTRACIÓN
                            </p>
                            <ul className="space-y-1">
                                <li>
                                    {(() => {
                                        const href = "/dashboard/admin/estadisticas";
                                        const active = pathname.startsWith("/dashboard/admin");
                                        return (
                                            <Link
                                                href={href}
                                                onClick={onClose}
                                                className={`group relative flex items-center gap-3 rounded-xl p-2.5 transition-all duration-200 border ${
                                                    active
                                                        ? "bg-slate-900/80 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.12)] text-white"
                                                        : "bg-transparent border-transparent text-slate-400 hover:bg-slate-900/50 hover:text-slate-200 hover:border-slate-800"
                                                }`}
                                            >
                                                {active && (
                                                    <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                                                )}

                                                <span
                                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                                                        active
                                                            ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                                                            : "bg-slate-900/80 border-slate-800 text-slate-500 group-hover:text-slate-300 group-hover:border-slate-700"
                                                    }`}
                                                >
                                                    <BarChart3 size={16} />
                                                </span>

                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-semibold tracking-tight ${active ? "text-cyan-300" : "text-slate-200"}`}>
                                                        Estadística de Uso
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 truncate">
                                                        Tráfico y alcance de la app
                                                    </p>
                                                </div>
                                            </Link>
                                        );
                                    })()}
                                </li>
                            </ul>
                        </div>
                    )}
                </nav>

                {/* Footer Feedback */}
                <div className="p-3 border-t border-slate-800/80">
                    <BetaFeedbackCard />
                </div>
            </aside>
        </>
    );
}