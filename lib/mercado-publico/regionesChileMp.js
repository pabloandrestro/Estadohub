/**
 * Alias → patrón ILIKE para regiones Chile (compra ágil / unidad).
 * El patrón con % funciona con la RPC actual: region ILIKE region_filtro.
 */

const REGIONES_BUSQUEDA_MP = [
    {
        etiqueta: "Arica y Parinacota",
        patron: "%Arica%",
        aliases: ["arica", "parinacota", "arica y parinacota"],
    },
    {
        etiqueta: "Tarapacá",
        patron: "%Tarapac%",
        aliases: ["tarapaca", "tarapacá", "iquique"],
    },
    {
        etiqueta: "Antofagasta",
        patron: "%Antofagasta%",
        aliases: ["antofagasta", "calama"],
    },
    {
        etiqueta: "Atacama",
        patron: "%Atacama%",
        aliases: ["atacama", "copiapo", "copiapó"],
    },
    {
        etiqueta: "Coquimbo",
        patron: "%Coquimbo%",
        aliases: ["coquimbo", "la serena", "ovalle"],
    },
    {
        etiqueta: "Valparaíso",
        patron: "%Valpara%",
        aliases: ["valparaiso", "valparaíso", "vina", "viña", "viña del mar"],
    },
    {
        etiqueta: "Metropolitana",
        patron: "%Metropolitana%",
        aliases: [
            "metropolitana",
            "region metropolitana",
            "región metropolitana",
            "rm",
            "santiago",
            "stgo",
        ],
    },
    {
        etiqueta: "O'Higgins",
        patron: "%Higgins%",
        aliases: ["ohiggins", "o'higgins", "higgins", "rancagua", "libertador"],
    },
    {
        etiqueta: "Maule",
        patron: "%Maule%",
        aliases: ["maule", "talca", "curico", "curicó"],
    },
    {
        etiqueta: "Ñuble",
        patron: "%uble%",
        aliases: ["nuble", "ñuble", "chillan", "chillán"],
    },
    {
        etiqueta: "Biobío",
        patron: "%Biob%",
        aliases: ["biobio", "biobío", "concepcion", "concepción", "bio bio"],
    },
    {
        etiqueta: "Araucanía",
        patron: "%Araucan%",
        aliases: ["araucania", "araucanía", "temuco"],
    },
    {
        etiqueta: "Los Ríos",
        patron: "%Los R%",
        aliases: ["los rios", "los ríos", "valdivia"],
    },
    {
        etiqueta: "Los Lagos",
        patron: "%Los Lagos%",
        aliases: ["los lagos", "puerto montt", "osorno"],
    },
    {
        etiqueta: "Aysén",
        patron: "%Ays%",
        aliases: ["aysen", "aysén", "coyhaique"],
    },
    {
        etiqueta: "Magallanes",
        patron: "%Magallanes%",
        aliases: ["magallanes", "punta arenas", "antartica", "antártica"],
    },
];

function sinTildes(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLowerCase();
}

/**
 * @param {string} frase
 * @returns {{ etiqueta: string, patron: string, matchedAlias: string } | null}
 */
export function detectarRegionEnFrase(frase) {
    const base = sinTildes(frase);
    if (!base.trim()) return null;

    // Más largos primero para no comer "los" antes de "los lagos"
    const candidatos = REGIONES_BUSQUEDA_MP.flatMap((r) =>
        r.aliases.map((alias) => ({
            ...r,
            alias,
            largo: alias.length,
        }))
    ).sort((a, b) => b.largo - a.largo);

    for (const c of candidatos) {
        const alias = sinTildes(c.alias);
        const re = new RegExp(
            `(?:^|[^a-z0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:[^a-z0-9]|$)`,
            "i"
        );
        if (re.test(base)) {
            return { etiqueta: c.etiqueta, patron: c.patron, matchedAlias: c.alias };
        }
    }
    return null;
}
