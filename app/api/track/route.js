import { after } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Registra un evento de navegación dentro del dashboard. El cliente lo llama
// con navigator.sendBeacon en cada cambio de ruta; la respuesta es 204 y el
// insert real se difiere con `after` para no bloquear al navegador.

function rutaValida(r) {
    return typeof r === "string" && r.startsWith("/") && r.length <= 300;
}

export async function POST(request) {
    let ruta = null;
    try {
        const raw = await request.text();
        ruta = JSON.parse(raw)?.ruta ?? null;
    } catch {
        // cuerpo ilegible → se ignora
    }

    if (!rutaValida(ruta)) {
        return new Response(null, { status: 204 });
    }

    // País / ciudad desde el edge de Vercel (ausentes en local → null).
    const pais = request.headers.get("x-vercel-ip-country")?.toUpperCase() || null;
    const ciudadRaw = request.headers.get("x-vercel-ip-city") || null;
    let ciudad = null;
    if (ciudadRaw) {
        try {
            ciudad = decodeURIComponent(ciudadRaw);
        } catch {
            ciudad = ciudadRaw;
        }
    }

    // El dashboard ya exige sesión; solo registramos usuarios autenticados.
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return new Response(null, { status: 204 });
    }

    after(async () => {
        try {
            const admin = getSupabaseAdmin();
            await admin.from("eventos_uso").insert({
                usuario_id: user.id,
                ruta: ruta.slice(0, 300),
                pais,
                ciudad: ciudad ? ciudad.slice(0, 120) : null,
            });
        } catch (e) {
            console.error("track: no se pudo registrar el evento de uso", e);
        }
    });

    return new Response(null, { status: 204 });
}
