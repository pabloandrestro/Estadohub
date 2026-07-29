/**
 * Tickets Mercado Público (cuota diaria por ticket).
 * Con MERCADO_PUBLICO_TICKET_2 definido, cada llamada alterna ticket 1 → 2 → 1…
 */

let indice = 0;
let cacheTickets = null;

function cargarTickets() {
    if (cacheTickets) return cacheTickets;

    const lista = [
        process.env.MERCADO_PUBLICO_TICKET,
        process.env.MERCADO_PUBLICO_TICKET_2,
    ]
        .map((t) => String(t || "").trim())
        .filter(Boolean);

    cacheTickets = lista;
    return lista;
}

/** Cantidad de tickets configurados (1 o 2). */
export function cantidadTicketsMercadoPublico() {
    return cargarTickets().length;
}

/**
 * Próximo ticket en round-robin.
 * @returns {string}
 */
export function obtenerTicketMercadoPublico() {
    const tickets = cargarTickets();
    if (tickets.length === 0) {
        throw new Error(
            "MERCADO_PUBLICO_TICKET no configurado en .env.local " +
                "(opcional: MERCADO_PUBLICO_TICKET_2 para alternar cuota)"
        );
    }
    const ticket = tickets[indice % tickets.length];
    indice += 1;
    return ticket;
}
