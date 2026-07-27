"use client";

import { Download } from "lucide-react";
import { exportarCSV } from "@/utils/exportCsv";

export default function BotonesExportar({ datos, nombre }) {
    return (
        <button
            onClick={() => exportarCSV(datos, nombre)}
            style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono hover:opacity-80 transition"
        >
            <Download size={13} />
            export.csv
        </button>
    );
}