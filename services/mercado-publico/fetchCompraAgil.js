import { lanzarErrorMercadoPublico } from "@/services/mercado-publico/erroresMercadoPublico";
import { obtenerTicketMercadoPublico } from "@/lib/mercado-publico/ticketMercadoPublico";

const BASE_COMPRA_AGIL = "https://api2.mercadopublico.cl";

export async function fetchCompraAgil(rutaRelativa, { parametros = {} } = {}) {
    const ticket = obtenerTicketMercadoPublico();
    const url = new URL(`${BASE_COMPRA_AGIL}${rutaRelativa}`);

    Object.entries(parametros).forEach(([clave, valor]) => {
        if (valor !== undefined && valor !== null && valor !== "") {
            url.searchParams.set(clave, String(valor));
        }
    });

    const respuesta = await fetch(url.toString(), {
        method: "GET",
        headers: {
            Accept: "application/json",
            ticket,
            "User-Agent": "Mozilla/5.0 (compatible; TGR.V2/1.0)",
        },
        cache: "no-store",
    });

    if (!respuesta.ok) {
        lanzarErrorMercadoPublico(respuesta.status, url.toString());
    }

    const json = await respuesta.json();

    if (json?.success === "NOK") {
        const mensaje =
            json?.errors?.[0]?.mensaje ?? "Error de Mercado Público";
        throw new Error(mensaje);
    }

    return json;
}
