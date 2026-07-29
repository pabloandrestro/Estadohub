/**
 * Expansión léxica + re-rank híbrido (similitud + keyword).
 * La vía ILIKE vive en buscarPorSimilitudMp; acá se puntúa y prioriza.
 */

const BOOST_LEXICO = 0.15;
const MIN_TOKEN = 3;
/** Si nadie tiene match léxico, exigir al menos esta similitud. */
const SIMILITUD_FALLBACK = 0.35;
/** Tope de sinónimos que se agregan al texto de embedding. */
const MAX_EXTRAS_EMBED = 8;
/** Tope de términos ILIKE en la vía léxica (evita OR gigantes). */
const MAX_TERMINOS_RECUPERACION = 12;

/** Tokens demasiado genéricos: no bastan solos para recuperar por keyword. */
const TOKENS_GENERICOS = new Set([
    "articulo",
    "articulos",
    "producto",
    "productos",
    "material",
    "materiales",
    "insumo",
    "insumos",
    "bien",
    "bienes",
    "item",
    "items",
    "equipo",
    "equipos",
    "suministro",
    "suministros",
]);

/**
 * Modificadores de dominio: con un sustantivo ancla NO abren el match solos
 * (evita "zapatos/gafas de seguridad" en "cámaras de seguridad").
 */
const TOKENS_MODIFICADORES = new Set([
    "seguridad",
    "proteccion",
    "vigilancia",
    "industrial",
    "laboral",
    "personal",
    "publico",
    "municipal",
    "escolar",
    "clinico",
    "hospitalario",
    "medico",
    "preventivo",
    "integral",
]);

const STOPWORDS = new Set([
    "con",
    "para",
    "por",
    "del",
    "los",
    "las",
    "una",
    "uno",
    "unos",
    "unas",
    "que",
    "como",
    "mas",
    "muy",
    "sin",
    "sobre",
    "entre",
    "desde",
    "hasta",
    "este",
    "esta",
    "estos",
    "estas",
    "todo",
    "toda",
    "todos",
    "todas",
    "algo",
    "aqui",
    "alla",
    "donde",
    "cuando",
    "cual",
    "cuales",
    "tipo",
    "tipos",
    "servicio",
    "servicios",
    "compra",
    "compras",
    "adquisicion",
    "adquisiciones",
]);

/**
 * Rubros / productos frecuentes en Mercado Público (Chile).
 * Clave = token de consulta; valor = términos para embed + match léxico.
 */
const SINONIMOS = {
    // Aseo e higiene
    aseo: ["limpieza", "higiene", "sanitizacion", "utiles de aseo", "materiales de aseo"],
    limpieza: ["aseo", "higiene", "sanitizacion", "desinfeccion"],
    higiene: ["aseo", "limpieza", "sanitizacion"],
    sanitizacion: ["aseo", "limpieza", "desinfeccion"],
    desinfeccion: ["aseo", "limpieza", "sanitizacion"],
    detergente: ["aseo", "limpieza", "jabon"],
    jabon: ["aseo", "detergente", "higiene"],

    // TI / computación
    computacion: ["computadores", "notebooks", "informatica", "equipos computacionales"],
    computadores: ["computacion", "notebooks", "pc", "equipos computacionales"],
    computador: ["computadores", "notebooks", "pc"],
    notebooks: ["computadores", "computacion", "laptop", "portatil"],
    notebook: ["notebooks", "laptop", "portatil", "computadores"],
    laptop: ["notebook", "notebooks", "portatil"],
    informatica: ["computacion", "computadores", "ti"],
    impresora: ["impresoras", "multifuncional", "toner"],
    impresoras: ["impresora", "multifuncional", "toner"],
    toner: ["impresora", "cartucho", "tinta"],
    cartucho: ["toner", "tinta", "impresora"],
    monitor: ["pantalla", "display", "computacion"],
    servidor: ["servidores", "datacenter", "hosting"],
    software: ["licencia", "licencias", "sistema informatico"],
    licencia: ["software", "licencias"],
    licencias: ["software", "licencia"],

    // Oficina / mobiliario
    oficina: ["escritorio", "mobiliario", "utiles de oficina"],
    escritorio: ["oficina", "mobiliario", "silla"],
    mobiliario: ["oficina", "escritorio", "muebles"],
    muebles: ["mobiliario", "oficina", "escritorio"],
    silla: ["sillas", "mobiliario", "oficina"],
    sillas: ["silla", "mobiliario"],
    papeleria: ["papel", "utiles de oficina", "resma"],
    papel: ["papeleria", "resma", "impresion"],
    archivador: ["archivo", "oficina", "carpetas"],

    // Alimentos / casino
    alimentos: ["viveres", "comida", "catering", "alimentacion"],
    alimentacion: ["alimentos", "comida", "casino", "catering"],
    viveres: ["alimentos", "comida", "abarrotes"],
    comida: ["alimentos", "catering", "casino"],
    catering: ["alimentos", "comida", "coffee break"],
    casino: ["alimentacion", "comida", "catering"],
    abarrotes: ["viveres", "alimentos", "despensa"],
    bebida: ["bebidas", "agua", "jugos"],
    bebidas: ["bebida", "agua", "refrescos"],
    agua: ["bebida", "aguas", "bidon"],

    // Seguridad
    seguridad: ["vigilancia", "guardias", "proteccion"],
    vigilancia: ["seguridad", "guardias", "rondines"],
    guardias: ["seguridad", "vigilancia"],
    extintor: ["extintores", "incendio", "seguridad"],
    extintores: ["extintor", "incendio", "seguridad"],
    incendio: ["extintores", "seguridad", "bomberos"],
    camaras: ["cctv", "videovigilancia"],
    cctv: ["camaras", "videovigilancia"],

    // Mantención / reparaciones
    mantencion: ["mantenimiento", "reparacion", "servicio tecnico"],
    mantenimiento: ["mantencion", "reparacion", "servicio tecnico"],
    reparacion: ["mantencion", "mantenimiento", "arreglo"],
    reparaciones: ["reparacion", "mantencion"],

    // Construcción / obras
    construccion: ["obras", "edificacion", "remodelacion"],
    obras: ["construccion", "edificacion", "faenas"],
    remodelacion: ["construccion", "obras", "habilitacion"],
    pintura: ["pinturas", "esmalte", "brocha"],
    pinturas: ["pintura", "esmalte"],
    ferreteria: ["herramientas", "tornillos", "materiales"],
    herramientas: ["ferreteria", "herramienta", "equipos"],
    cemento: ["construccion", "hormigon", "obras"],
    fierro: ["construccion", "acero", "obras"],

    // Electricidad / clima
    electricidad: ["electrico", "electricos", "instalacion electrica"],
    electrico: ["electricidad", "cableado", "tablero"],
    iluminacion: ["luminarias", "ampolletas", "led"],
    luminarias: ["iluminacion", "led", "focos"],
    cableado: ["electricidad", "cables", "red"],
    climatizacion: ["aire acondicionado", "calefaccion", "ventilacion"],
    calefaccion: ["climatizacion", "calefactor", "estufa"],

    // Fontanería
    gasfiteria: ["fontaneria", "sanitarios", "cañerias"],
    fontaneria: ["gasfiteria", "sanitarios", "plomeria"],
    sanitario: ["sanitarios", "gasfiteria", "bano"],
    sanitarios: ["sanitario", "gasfiteria", "wc"],

    // Salud
    salud: ["medico", "clinico", "hospitalario", "farmacia"],
    medico: ["salud", "clinico", "hospitalario"],
    medica: ["medico", "salud", "insumos medicos"],
    hospitalario: ["salud", "clinico", "medico"],
    farmaceutico: ["farmacia", "medicamentos", "farmacos"],
    farmacia: ["medicamentos", "farmacos", "farmaceutico"],
    medicamentos: ["farmacia", "farmacos", "remedios"],
    dental: ["odontologico", "odontologia", "salud"],
    odontologia: ["dental", "odontologico"],
    laboratorio: ["reactivos", "analisis", "insumos laboratorio"],
    reactivos: ["laboratorio", "quimicos", "analisis"],
    ambulancia: ["traslado medico", "urgencia", "salud"],

    // Transporte / vehículos
    transporte: ["flete", "traslado", "logistica"],
    flete: ["transporte", "traslado", "mudanza"],
    mudanza: ["flete", "traslado", "transporte"],
    vehiculo: ["vehiculos", "automotor", "camioneta"],
    vehiculos: ["vehiculo", "automotor", "flota"],
    camioneta: ["vehiculo", "pickup", "automotor"],
    combustible: ["bencina", "petroleo", "diesel", "gasolina"],
    bencina: ["combustible", "gasolina"],
    diesel: ["combustible", "petroleo"],
    neumaticos: ["neumatico", "llantas", "vehiculo"],

    // Educación
    educacion: ["educativo", "didactico", "escolar"],
    educativo: ["educacion", "didactico", "pedagogico"],
    didactico: ["educacion", "material didactico", "escolar"],
    escolar: ["educacion", "colegio", "didactico"],
    capacitacion: ["curso", "taller", "entrenamiento", "formacion"],
    curso: ["capacitacion", "taller", "formacion"],
    taller: ["capacitacion", "curso"],

    // Vestuario
    vestuario: ["ropa", "uniformes", "indumentaria"],
    uniforme: ["uniformes", "vestuario", "ropa"],
    uniformes: ["uniforme", "vestuario", "ropa laboral"],
    calzado: ["zapatos", "botas", "seguridad"],
    zapatos: ["calzado", "botas"],
    textil: ["tela", "vestuario", "ropa"],

    // Jardinería / aseo de áreas
    jardineria: ["areas verdes", "poda", "paisajismo"],
    poda: ["jardineria", "areas verdes"],
    residuos: ["basura", "desechos", "reciclaje"],
    basura: ["residuos", "desechos", "aseo"],
    reciclaje: ["residuos", "desechos"],

    // Telecomunicaciones
    telecomunicaciones: ["telefonia", "internet", "conectividad"],
    telefonia: ["telefono", "telecomunicaciones", "movil"],
    internet: ["conectividad", "red", "telecomunicaciones"],
    red: ["networking", "cableado", "internet"],

    // Consultoría / servicios profesionales
    consultoria: ["asesoria", "consultor", "estudios"],
    asesoria: ["consultoria", "asesor"],
    auditoria: ["auditor", "contabilidad", "control"],
    contabilidad: ["contable", "auditoria", "finanzas"],
    legal: ["juridico", "abogado", "asesoria legal"],
    juridico: ["legal", "abogado"],
    notarial: ["notario", "legal", "escritura"],

    // Publicidad / eventos / gráficos
    publicidad: ["marketing", "difusion", "avisaje"],
    marketing: ["publicidad", "difusion"],
    impresion: ["impresiones", "plotter", "grafica", "graficos"],
    grafico: ["graficos", "impresion", "plotter", "diseno", "imprenta"],
    graficos: ["grafico", "impresion", "plotter", "diseno", "imprenta"],
    grafica: ["graficos", "impresion", "plotter"],
    senaletica: ["senales", "letreros", "avisos"],
    evento: ["eventos", "produccion", "ceremonia"],
    eventos: ["evento", "produccion"],
    hoteleria: ["hotel", "alojamiento", "hospedaje"],
    alojamiento: ["hotel", "hospedaje", "hoteleria"],

    // Arriendos
    arriendo: ["arriendos", "leasing", "alquiler"],
    arriendos: ["arriendo", "alquiler"],
    leasing: ["arriendo", "renting"],

    // Energía / misc
    generador: ["generadores", "energia", "electrogeno"],
    energia: ["electrico", "generador", "suministro"],
    quimicos: ["reactivos", "productos quimicos", "laboratorio"],
    gas: ["combustible", "gas licuado", "cilindro"],
};

function sinTildes(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLowerCase();
}

/** Tokens alfanuméricos ≥ MIN_TOKEN, sin stopwords. */
function tokensConsulta(texto) {
    const base = sinTildes(texto);
    if (!base) return [];
    const vistos = new Set();
    const out = [];
    for (const t of base.match(/[\p{L}\p{N}]+/gu) || []) {
        if (t.length < MIN_TOKEN || STOPWORDS.has(t) || vistos.has(t)) continue;
        vistos.add(t);
        out.push(t);
    }
    return out;
}

function esTokenDiscriminativo(token) {
    if (SINONIMOS[token]) return true;
    if (TOKENS_GENERICOS.has(token)) return false;
    return token.length >= 4;
}

/**
 * Separa anclas (producto) vs modificadores (dominio).
 * Con ancla + modificador → hay que matchear el ancla (o su sinónimo de producto).
 */
function clasificarTokens(tokensOriginales) {
    const disc = tokensOriginales.filter(esTokenDiscriminativo);
    const base = disc.length > 0 ? disc : [...tokensOriginales];
    const anclas = base.filter((t) => !TOKENS_MODIFICADORES.has(t));
    const modificadores = base.filter((t) => TOKENS_MODIFICADORES.has(t));

    // Solo modificadores ("seguridad") → se tratan como ancla única.
    if (anclas.length === 0) {
        return {
            anclas: base,
            modificadores: [],
            exigeAncla: false,
        };
    }

    return {
        anclas,
        modificadores,
        // 2+ conceptos o ancla+modificador → exigir evidencia del producto
        exigeAncla: modificadores.length > 0 || anclas.length >= 2,
    };
}

/** Variantes de un ancla para match/ILIKE (sin colarse modificadores tipo "seguridad"). */
function variantesAncla(token) {
    const out = [token];
    const vistos = new Set([token]);
    for (const s of SINONIMOS[token] || []) {
        const key = sinTildes(s);
        if (!key || vistos.has(key) || TOKENS_MODIFICADORES.has(key)) continue;
        // Evitar frases multi-palabra con modificador suelto ya filtrado arriba
        const partes = key.split(/\s+/).filter(Boolean);
        if (partes.some((p) => TOKENS_MODIFICADORES.has(p))) continue;
        vistos.add(key);
        out.push(key);
    }
    return out;
}

/**
 * Términos para la vía léxica (ILIKE).
 * Con ancla+modificador solo busca el ancla (+ sinónimos de producto), no "seguridad" solo.
 */
export function terminosRecuperacionLexica(textoSemantico) {
    const tokens = tokensConsulta(textoSemantico);
    if (tokens.length === 0) return [];

    const { anclas, modificadores, exigeAncla } = clasificarTokens(tokens);
    const semilla = exigeAncla ? anclas : anclas.length > 0 ? anclas : tokens;

    const out = [];
    const vistos = new Set();

    for (const t of semilla) {
        for (const v of variantesAncla(t)) {
            if (vistos.has(v)) continue;
            vistos.add(v);
            out.push(v);
            if (out.length >= MAX_TERMINOS_RECUPERACION) return out;
        }
    }

    // Sin exigir ancla (consulta corta): sí expandir modificadores si eran la semilla.
    if (!exigeAncla && modificadores.length > 0) {
        for (const t of modificadores) {
            for (const v of variantesAncla(t)) {
                if (vistos.has(v)) continue;
                vistos.add(v);
                out.push(v);
                if (out.length >= MAX_TERMINOS_RECUPERACION) return out;
            }
        }
    }

    return out.slice(0, MAX_TERMINOS_RECUPERACION);
}

/**
 * Amplía texto corto con sinónimos conocidos (para el embedding).
 */
export function expandirTextoEmbed(textoSemantico) {
    const original = String(textoSemantico || "").trim();
    if (!original) return original;

    const tokens = tokensConsulta(original);
    const extras = [];
    const vistos = new Set(tokens);

    for (const t of tokens) {
        const syns = SINONIMOS[t];
        if (!syns) continue;
        for (const s of syns) {
            if (extras.length >= MAX_EXTRAS_EMBED) break;
            const key = sinTildes(s);
            if (vistos.has(key)) continue;
            vistos.add(key);
            extras.push(s);
        }
        if (extras.length >= MAX_EXTRAS_EMBED) break;
    }

    if (extras.length === 0) return original;
    return `${original} ${extras.join(" ")}`.trim();
}

function terminosLexicos(textoSemantico) {
    const tokens = tokensConsulta(textoSemantico);
    const out = new Set(tokens);
    for (const t of tokens) {
        for (const s of SINONIMOS[t] || []) {
            out.add(sinTildes(s));
        }
    }
    return [...out];
}

function haystackFila(row) {
    return sinTildes(
        [row?.nombre, row?.descripcion, row?.texto_indice].filter(Boolean).join(" ")
    );
}

/** Tokens que aportan evidencia de rubro (ignora "artículos", "productos", …). */
function tokensParaEvidenciaLexica(tokensOriginales) {
    const disc = tokensOriginales.filter(esTokenDiscriminativo);
    return disc.length > 0 ? disc : tokensOriginales;
}

function hayMatchAlgunTermino(haystack, terminos) {
    if (!haystack || terminos.length === 0) return false;
    return terminos.some((t) => haystack.includes(t));
}

/** ¿Hay evidencia del producto ancla (token o sinónimo de producto)? */
function hayMatchAncla(row, anclas) {
    if (!anclas.length) return false;
    const haystack = haystackFila(row);
    if (!haystack) return false;
    const terminos = anclas.flatMap((a) => variantesAncla(a));
    return hayMatchAlgunTermino(haystack, terminos);
}

function hayMatchModificador(row, modificadores) {
    if (!modificadores.length) return false;
    const haystack = haystackFila(row);
    if (!haystack) return false;
    return hayMatchAlgunTermino(haystack, modificadores);
}

/**
 * Si llegó por ILIKE (vía léxica), ya tiene evidencia de keyword —
 * salvo cuando exigimos ancla y la fila no la tiene (p. ej. entró por bug/legado).
 */
function vinoPorViaLexica(row) {
    const f = row?.fuenteRecuperacion;
    return f === "lexico" || f === "ambos";
}

function puntuar(parecidos, tokensOriginales) {
    const { anclas, modificadores, exigeAncla } = clasificarTokens(tokensOriginales);
    const tokensLibres = tokensParaEvidenciaLexica(tokensOriginales);

    return parecidos.map((row) => {
        const similitud = Number(row.similitud) || 0;
        const matchAncla = hayMatchAncla(row, anclas);
        const matchMod = hayMatchModificador(row, modificadores);

        let matchOriginal = false;
        let matchSinonimo = false;
        let matchViaLexica = false;
        let lexico = false;
        let scoreHibrido = similitud;

        if (exigeAncla) {
            // Debe aparecer el producto; el modificador solo refuerza el score.
            lexico = matchAncla;
            matchOriginal = matchAncla;
            if (matchAncla && matchMod) scoreHibrido += BOOST_LEXICO;
            else if (matchAncla) scoreHibrido += BOOST_LEXICO * 0.75;
        } else {
            const haystack = haystackFila(row);
            matchOriginal =
                tokensLibres.length > 0 &&
                hayMatchAlgunTermino(haystack, tokensLibres);
            if (!matchOriginal) {
                const sinonimos = tokensLibres
                    .flatMap((t) => variantesAncla(t))
                    .filter((v) => !tokensLibres.includes(v));
                matchSinonimo = hayMatchAlgunTermino(haystack, sinonimos);
            }
            matchViaLexica =
                !matchOriginal && !matchSinonimo && vinoPorViaLexica(row);
            lexico = matchOriginal || matchSinonimo || matchViaLexica;
            if (matchOriginal) scoreHibrido += BOOST_LEXICO;
            else if (matchSinonimo) scoreHibrido += BOOST_LEXICO * 0.65;
            else if (matchViaLexica) scoreHibrido += BOOST_LEXICO * 0.5;
        }

        return {
            ...row,
            scoreHibrido,
            matchLexico: lexico,
            matchOriginal,
            matchSinonimo,
            matchViaLexica,
            matchAncla,
            matchModificador: matchMod,
            exigeAncla,
        };
    });
}

/**
 * Si hay ≥ este N de evidencia léxica, priorizamos precisión (solo léxico).
 * Si hay menos, mezclamos léxico + semánticos altos (rescate de recall).
 */
const MIN_LEXICO_SOLO = 5;

/**
 * Reordena y prioriza sin aniquilar el pool:
 * 1) Evidencia léxica primero (token, sinónimo en haystack, o vía B).
 * 2) Si hay pocos léxicos → también semánticos con similitud alta.
 * 3) Si no hay léxico → similitud alta / ranking completo.
 */
export function rerankHibridoMp(parecidos, textoSemantico) {
    if (!Array.isArray(parecidos) || parecidos.length === 0) {
        return { filas: [], filtro: "vacio", terminos: [], tokensQuery: [] };
    }

    const tokensQuery = tokensConsulta(textoSemantico);
    const terminos = terminosLexicos(textoSemantico);
    const scored = puntuar(parecidos, tokensQuery);
    scored.sort((a, b) => (b.scoreHibrido || 0) - (a.scoreHibrido || 0));

    if (tokensQuery.length === 0) {
        return { filas: scored, filtro: "sin_terminos", terminos, tokensQuery };
    }

    const conLexico = scored.filter((r) => r.matchLexico);
    const sinLexicoAltos = scored.filter(
        (r) =>
            !r.matchLexico && (Number(r.similitud) || 0) >= SIMILITUD_FALLBACK
    );

    if (conLexico.length >= MIN_LEXICO_SOLO) {
        return { filas: conLexico, filtro: "lexico", terminos, tokensQuery };
    }

    if (conLexico.length > 0) {
        return {
            filas: [...conLexico, ...sinLexicoAltos],
            filtro: "lexico_mas_similitud",
            terminos,
            tokensQuery,
        };
    }

    if (sinLexicoAltos.length > 0) {
        return { filas: sinLexicoAltos, filtro: "similitud_alta", terminos, tokensQuery };
    }

    return { filas: scored, filtro: "semantico_puro", terminos, tokensQuery };
}
