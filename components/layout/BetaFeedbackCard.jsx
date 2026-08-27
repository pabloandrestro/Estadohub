"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import FeedbackModal from "./FeedbackModal";

export default function BetaFeedbackCard() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <div className="beta-card">
                <span className="beta-card-tag">Plataforma beta</span>
                <p className="beta-card-text">
                    Estamos construyendo esto. Cuéntanos qué mejorar.
                </p>
                <button type="button" className="beta-card-btn" onClick={() => setOpen(true)}>
                    <MessageSquarePlus size={14} />
                    Ayúdanos a mejorar
                </button>
            </div>

            {open && <FeedbackModal onClose={() => setOpen(false)} />}
        </>
    );
}
