const MP_API_BASE = "https://api.mercadopublico.cl/servicios/v1/publico";

function limpiarUrlParaLog(urlString) {
    const url = new URL(urlString);
    url.searchParams.delete("ticket");
    return url.toString();
}

export async function fetchMercadoPublico(rutaRelativa, params = {}) {
    const ticket = process.env.MERCADO_PUBLICO_TICKET;

    if (!ticket) {
        throw new Error("MERCADO_PUBLICO_TICKET no configurado en .env.local");
    }

    const url = new URL(`${MP_API_BASE}${rutaRelativa}`);
    url.searchParams.set("ticket", ticket);

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            url.searchParams.set(key, String(value));
        }
    });

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; TGR.V2/1.0)",
        },
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(
            `Mercado Público API: ${response.status} ${response.statusText} - ${limpiarUrlParaLog(url.toString())}`
        );
    }

    return response.json();
}