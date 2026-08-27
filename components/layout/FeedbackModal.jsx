"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { X, Send, Loader2, CheckCircle } from "lucide-react";

export default function FeedbackModal({ onClose }) {
    const pathname = usePathname();
    const [form, setForm] = useState({ tipo: "sugerencia", mensaje: "", email: "" });
    const [estado, setEstado] = useState("idle"); // idle | loading | success | error
    const [errorMsg, setErrorMsg] = useState("");

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setEstado("loading");
        setErrorMsg("");
        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, ruta: pathname }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error desconocido");
            setEstado("success");
        } catch (err) {
            setEstado("error");
            setErrorMsg(err.message);
        }
    };

    const inputStyle = {
        width: "100%",
        padding: "0.6rem 0.85rem",
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: "0.5rem",
        color: "var(--text)",
        fontFamily: "monospace",
        fontSize: "0.85rem",
        outline: "none",
        transition: "border-color 160ms ease",
    };

    const labelStyle = {
        display: "block",
        fontSize: "0.75rem",
        color: "var(--text-muted)",
        fontFamily: "monospace",
        marginBottom: "0.4rem",
    };

    // El modal se monta en <body> con un portal: así queda centrado en la
    // pantalla completa y no atrapado dentro del <aside> (que tiene transform).
    // Solo se renderiza tras un clic del usuario, así que document ya existe.
    if (typeof document === "undefined") return null;

    return createPortal(
        <div
            style={{
                position: "fixed", inset: 0, zIndex: 100,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                style={{
                    background: "var(--surface)",
                    border: "1px solid color-mix(in srgb, var(--accent) 45%, var(--border))",
                    borderRadius: "1rem",
                    padding: "2rem",
                    width: "100%",
                    maxWidth: "480px",
                    margin: "1rem",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 32px color-mix(in srgb, var(--accent) 22%, transparent)",
                    position: "relative",
                }}
            >
                {/* Cerrar */}
                <button
                    onClick={onClose}
                    aria-label="Cerrar"
                    style={{
                        position: "absolute", top: "1rem", right: "1rem",
                        background: "var(--surface-2)", border: "1px solid var(--border)",
                        borderRadius: "0.5rem", padding: "0.35rem", cursor: "pointer",
                        color: "var(--danger)", display: "flex", alignItems: "center",
                    }}
                >
                    <X size={16} />
                </button>

                {/* Header */}
                <div style={{ marginBottom: "1.5rem" }}>
                    <span
                        style={{
                            display: "inline-block",
                            fontSize: "0.6rem",
                            fontWeight: 700,
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            color: "var(--accent)",
                            border: "1px solid color-mix(in srgb, var(--accent) 45%, transparent)",
                            borderRadius: "999px",
                            padding: "0.15rem 0.55rem",
                            marginBottom: "0.6rem",
                        }}
                    >
                        Plataforma beta
                    </span>
                    <h2 style={{ fontFamily: "monospace", fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.35rem" }}>
                        Ayúdanos a mejorar
                    </h2>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "monospace", lineHeight: 1.5 }}>
                        Cuéntanos qué falló, qué te gustaría ver o cualquier idea.<br />
                        Tu mensaje llega directo al equipo.
                    </p>
                </div>

                {/* Estado: éxito */}
                {estado === "success" ? (
                    <div style={{ textAlign: "center", padding: "2rem 0" }}>
                        <CheckCircle size={48} style={{ color: "var(--accent)", margin: "0 auto 1rem" }} />
                        <p style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--text)", fontSize: "1rem", marginBottom: "0.5rem" }}>
                            ¡Gracias por tu aporte!
                        </p>
                        <p style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            Recibimos tu mensaje. Lo revisaremos pronto.
                        </p>
                        <button
                            onClick={onClose}
                            style={{
                                marginTop: "1.5rem", padding: "0.6rem 1.5rem",
                                background: "var(--accent)", color: "var(--bg)",
                                border: "none", borderRadius: "0.5rem",
                                fontFamily: "monospace", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
                            }}
                        >
                            Cerrar
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div>
                            <label style={labelStyle}>Tipo de mensaje</label>
                            <select name="tipo" value={form.tipo} onChange={handleChange} style={inputStyle}>
                                <option value="sugerencia">Sugerencia / idea</option>
                                <option value="error">Reporte de error</option>
                                <option value="otro">Otro comentario</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Tu mensaje *</label>
                            <textarea
                                name="mensaje" value={form.mensaje} onChange={handleChange} required
                                placeholder="Escribe aquí lo que quieras contarnos..."
                                rows={4}
                                maxLength={4000}
                                style={{ ...inputStyle, resize: "vertical" }}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Correo (opcional, por si necesitamos responderte)</label>
                            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="tu@correo.cl" style={inputStyle} />
                        </div>

                        {estado === "error" && (
                            <p style={{ color: "var(--error, #dd6974)", fontFamily: "monospace", fontSize: "0.78rem" }}>
                                ⚠ {errorMsg}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={estado === "loading"}
                            style={{
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                                padding: "0.7rem", marginTop: "0.25rem",
                                background: "var(--accent)", color: "var(--bg)",
                                border: "none", borderRadius: "0.5rem",
                                fontFamily: "monospace", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
                                opacity: estado === "loading" ? 0.7 : 1,
                                transition: "opacity 160ms ease",
                            }}
                        >
                            {estado === "loading" ? (
                                <><Loader2 size={16} className="animate-spin" /> Enviando...</>
                            ) : (
                                <><Send size={14} /> Enviar mensaje</>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>,
        document.body
    );
}
