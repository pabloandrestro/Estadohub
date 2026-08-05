import { NextResponse } from "next/server";

const SII_URL = "https://www4.sii.cl/mapasui/services/data/mapasFacadeService/getPredioNacional";

const COMUNAS_SII = {
    "ALGARROBO": 5406, "ALHUÉ": 14605, "ALHUE": 14605, "ALTO BIOBÍO": 8414,
    "ALTO BIOBIO": 8414, "ALTO DEL CARMEN": 3304, "ALTO HOSPICIO": 1211, "ANCUD": 10406,
    "ANDACOLLO": 4104, "ANGOL": 9101, "ANTOFAGASTA": 2201, "ANTUCO": 8413,
    "ARAUCO": 8301, "ARICA": 1101, "AYSÉN": 11101, "AYSEN": 11101,
    "BUIN": 16403, "BULNES": 8113, "CABILDO": 5203, "CABO DE HORNOS": 12401,
    "CABRERO": 8410, "CALAMA": 2301, "CALBUCO": 10309, "CALDERA": 3202,
    "CALERA DE TANGO": 16402, "CALLE LARGA": 5702, "CAMARONES": 1106, "CAMIÑA": 1208,
    "CAMINA": 1208, "CANELA": 4304, "CARAHUE": 9209, "CARTAGENA": 5403,
    "CASABLANCA": 5305, "CASTRO": 10401, "CATEMU": 5603, "CAUQUENES": 7401,
    "CAÑETE": 8305, "CANETE": 8305, "CERRILLOS": 14166, "CERRO NAVIA": 14156,
    "CHAITÉN": 10501, "CHAITEN": 10501, "CHANCO": 7403, "CHAÑARAL": 3101,
    "CHANARAL": 3101, "CHIGUAYANTE": 8211, "CHILE CHICO": 11201, "CHILLÁN": 8101,
    "CHILLAN": 8101, "CHILLÁN VIEJO": 8121, "CHILLAN VIEJO": 8121, "CHIMBARONGO": 6202,
    "CHOLCHOL": 9221, "CHONCHI": 10402, "CHÉPICA": 6209, "CHEPICA": 6209,
    "CISNES": 11102, "COBQUECURA": 8107, "COCHAMÓ": 10302, "COCHAMO": 10302,
    "COCHRANE": 11301, "CODEGUA": 6107, "COELEMU": 8120, "COIHUECO": 8103,
    "COINCO": 6116, "COLBÚN": 7303, "COLBUN": 7303, "COLCHANE": 1210,
    "COLINA": 14201, "COLLIPULLI": 9105, "COLTAUCO": 6106, "COMBARBALÁ": 4205,
    "COMBARBALA": 4205, "CONCEPCIÓN": 8201, "CONCEPCION": 8201, "CONCHALÍ": 14127,
    "CONCHALI": 14127, "CONCÓN": 5309, "CONCON": 5309, "CONSTITUCIÓN": 7208,
    "CONSTITUCION": 7208, "CONTULMO": 8306, "COPIAPÓ": 3201, "COPIAPO": 3201,
    "COQUIMBO": 4103, "CORONEL": 8207, "CORRAL": 10106, "COYHAIQUE": 11401,
    "CUNCO": 9204, "CURACAUTÍN": 9110, "CURACAUTIN": 9110, "CURACAVÍ": 14603,
    "CURACAVI": 14603, "CURACO DE VÉLEZ": 10410, "CURACO DE VELEZ": 10410, "CURANILAHUE": 8302,
    "CURARREHUE": 9218, "CUREPTO": 7207, "CURICÓ": 7101, "CURICO": 7101,
    "DALCAHUE": 10408, "DIEGO DE ALMAGRO": 3102, "DOÑIHUE": 6105, "DONIHUE": 6105,
    "EL BOSQUE": 16165, "EL CARMEN": 8118, "EL MONTE": 14503, "EL QUISCO": 5405,
    "EL TABO": 5404, "EMPEDRADO": 7209, "ERCILLA": 9106, "ESTACIÓN CENTRAL": 14157,
    "ESTACION CENTRAL": 14157, "FLORIDA": 8204, "FREIRE": 9203, "FREIRINA": 3302,
    "FRESIA": 10304, "FRUTILLAR": 10305, "FUTALEUFÚ": 10503, "FUTALEUFU": 10503,
    "FUTRONO": 10105, "GALVARINO": 9207, "GENERAL LAGOS": 1302, "GORBEA": 9212,
    "GRANEROS": 6103, "GUAITECAS": 11104, "HIJUELAS": 5503, "HUALAIHUÉ": 10502,
    "HUALAIHUE": 10502, "HUALAÑÉ": 7107, "HUALANE": 7107, "HUALPÉN": 8212,
    "HUALPEN": 8212, "HUALQUI": 8203, "HUARA": 1206, "HUASCO": 3303,
    "HUECHURABA": 14158, "ILLAPEL": 4301, "INDEPENDENCIA": 13167, "IQUIQUE": 1201,
    "ISLA DE MAIPO": 14502, "ISLA DE PASCUA": 5101, "JUAN FERNÁNDEZ": 5308, "JUAN FERNANDEZ": 5308,
    "LA CALERA": 5504, "LA CISTERNA": 16110, "LA CRUZ": 5505, "LA ESTRELLA": 6304,
    "LA FLORIDA": 15128, "LA GRANJA": 16131, "LA HIGUERA": 4102, "LA LIGUA": 5201,
    "LA PINTANA": 16154, "LA REINA": 15132, "LA SERENA": 4101, "LA UNIÓN": 10109,
    "LA UNION": 10109, "LAGO RANCO": 10112, "LAGO VERDE": 11402, "LAGUNA BLANCA": 12206,
    "LAJA": 8403, "LAMPA": 14202, "LANCO": 10103, "LAS CABRAS": 6109,
    "LAS CONDES": 15108, "LAUTARO": 9205, "LEBU": 8303, "LICANTÉN": 7105,
    "LICANTEN": 7105, "LIMACHE": 5506, "LINARES": 7301, "LITUECHE": 6303,
    "LLANQUIHUE": 10306, "LLAY-LLAY": 5606, "LO BARNECHEA": 15161, "LO ESPEJO": 16164,
    "LO PRADO": 14155, "LOLOL": 6206, "LONCOCHE": 9214, "LONGAVÍ": 7304,
    "LONGAVI": 7304, "LONQUIMAY": 9111, "LOS ALAMOS": 8304, "LOS ANDES": 5701,
    "LOS ANGELES": 8401, "LOS LAGOS": 10104, "LOS MUERMOS": 10308, "LOS SAUCES": 9103,
    "LOS VILOS": 4303, "LOTA": 8208, "LUMACO": 9108, "MACHALÍ": 6102,
    "MACHALI": 6102, "MACUL": 15151, "MAIPÚ": 14109, "MAIPU": 14109,
    "MALLOA": 6115, "MARCHIGÜE": 6305, "MARCHIGUE": 6305, "MARIQUINA": 10102,
    "MARÍA ELENA": 2103, "MARIA ELENA": 2103, "MARÍA PINTO": 14602, "MARIA PINTO": 14602,
    "MAULE": 7206, "MAULLÍN": 10307, "MAULLIN": 10307, "MEJILLONES": 2203,
    "MELIPEUCO": 9217, "MELIPILLA": 14601, "MOLINA": 7108, "MONTE PATRIA": 4203,
    "MULCHÉN": 8407, "MULCHEN": 8407, "MÁFIL": 10107, "MAFIL": 10107,
    "NACIMIENTO": 8405, "NANCAGUA": 6203, "NATALES": 12101, "NAVIDAD": 6302,
    "NEGRETE": 8406, "NINHUE": 8105, "NOGALES": 5502, "NUEVA IMPERIAL": 9208,
    "O'HIGGINS": 11302, "OLIVAR": 6114, "OLLAGÜE": 2302, "OLLAGUE": 2302,
    "OLMUÉ": 5507, "OLMUE": 5507, "OSORNO": 10201, "OVALLE": 4201,
    "PADRE HURTADO": 14505, "PADRE LAS CASAS": 9220, "PAIHUANO": 4106, "PAILLACO": 10110,
    "PAINE": 16404, "PALENA": 10504, "PALMILLA": 6207, "PANGUIPULLI": 10108,
    "PANQUEHUE": 5602, "PAPUDO": 5205, "PAREDONES": 6306, "PARRAL": 7305,
    "PEDRO AGUIRRE CERDA": 16162, "PELARCO": 7203, "PELLUHUE": 7402, "PEMUCO": 8117,
    "PENCAHUE": 7205, "PENCO": 8202, "PERALILLO": 6208, "PERQUENCO": 9206,
    "PETORCA": 5202, "PEUMO": 6108, "PEÑAFLOR": 14504, "PENAFLOR": 14504,
    "PEÑALOLÉN": 15152, "PENALOLEN": 15152, "PICA": 1203, "PICHIDEGUA": 6111,
    "PICHILEMU": 6301, "PINTO": 8102, "PIRQUE": 16302, "PITRUFQUÉN": 9211,
    "PITRUFQUEN": 9211, "PLACILLA": 6204, "PORTEZUELO": 8106, "PORVENIR": 12301,
    "POZO ALMONTE": 1204, "PRIMAVERA": 12302, "PROVIDENCIA": 15103, "PUCHUNCAVÍ": 5307,
    "PUCHUNCAVI": 5307, "PUCÓN": 9216, "PUCON": 9216, "PUDAHUEL": 14111,
    "PUENTE ALTO": 16301, "PUERTO MONTT": 10301, "PUERTO OCTAY": 10203, "PUERTO VARAS": 10303,
    "PUMANQUE": 6214, "PUNITAQUI": 4204, "PUNTA ARENAS": 12205, "PUQUELDÓN": 10405,
    "PUQUELDON": 10405, "PURRANQUE": 10206, "PURÉN": 9102, "PUREN": 9102,
    "PUTAENDO": 5604, "PUTRE": 1301, "PUYEHUE": 10204, "QUEILÉN": 10403,
    "QUEILEN": 10403, "QUELLÓN": 10404, "QUELLON": 10404, "QUEMCHI": 10407,
    "QUILACO": 8408, "QUILICURA": 14114, "QUILLECO": 8404, "QUILLOTA": 5501,
    "QUILLÓN": 8115, "QUILLON": 8115, "QUILPUÉ": 5304, "QUILPUE": 5304,
    "QUINCHAO": 10415, "QUINTA DE TILCOCO": 6117, "QUINTA NORMAL": 14107, "QUINTERO": 5306,
    "QUIRIHUE": 8104, "RANCAGUA": 6101, "RAUCO": 7104, "RECOLETA": 13159,
    "RENAICO": 9104, "RENCA": 14113, "RENGO": 6112, "REQUÍNOA": 6113,
    "REQUINOA": 6113, "RETIRO": 7306, "RINCONADA": 5704, "ROMERAL": 7103,
    "RÁNQUIL": 8119, "RANQUIL": 8119, "RÍO BUENO": 10111, "RIO BUENO": 10111,
    "RÍO CLARO": 7204, "RIO CLARO": 7204, "RÍO HURTADO": 4206, "RIO HURTADO": 4206,
    "RÍO IBÁÑEZ": 11203, "RIO IBANEZ": 11203, "RÍO NEGRO": 10205, "RIO NEGRO": 10205,
    "RÍO VERDE": 12202, "RIO VERDE": 12202, "SAAVEDRA": 9210, "SAGRADA FAMILIA": 7109,
    "SALAMANCA": 4302, "SAN ANTONIO": 5401, "SAN BERNARDO": 16401, "SAN CARLOS": 8109,
    "SAN CLEMENTE": 7202, "SAN ESTEBAN": 5703, "SAN FABIÁN": 8111, "SAN FABIAN": 8111,
    "SAN FELIPE": 5601, "SAN FERNANDO": 6201, "SAN FRANCISCO DE MOSTAZAL": 6104, "SAN GREGORIO": 12204,
    "SAN IGNACIO": 8114, "SAN JAVIER": 7310, "SAN JOAQUÍN": 16163, "SAN JOAQUIN": 16163,
    "SAN JOSÉ DE MAIPO": 16303, "SAN JOSE DE MAIPO": 16303, "SAN JUAN DE LA COSTA": 10207, "SAN MIGUEL": 16106,
    "SAN NICOLÁS": 8112, "SAN NICOLAS": 8112, "SAN PABLO": 10202, "SAN PEDRO": 14604,
    "SAN PEDRO DE ATACAMA": 2303, "SAN PEDRO DE LA PAZ": 8210, "SAN RAFAEL": 7210, "SAN RAMÓN": 16153,
    "SAN RAMON": 16153, "SAN ROSENDO": 8411, "SAN VICENTE": 6110, "SANTA BÁRBARA": 8402,
    "SANTA BARBARA": 8402, "SANTA CRUZ": 6205, "SANTA JUANA": 8209, "SANTA MARÍA": 5605,
    "SANTA MARIA": 5605, "SANTIAGO": 13101, "SANTIAGO OESTE": 13134, "SANTIAGO SUR": 13135,
    "SANTO DOMINGO": 5402, "SIERRA GORDA": 2206, "TALAGANTE": 14501, "TALCA": 7201,
    "TALCAHUANO": 8206, "TALTAL": 2202, "TEMUCO": 9201, "TENO": 7102,
    "TEODORO SCHMIDT": 9219, "TIERRA AMARILLA": 3203, "TIL-TIL": 14203, "TIMAUKEL": 12304,
    "TIRÚA": 8307, "TIRUA": 8307, "TOCOPILLA": 2101, "TOLTÉN": 9213,
    "TOLTEN": 9213, "TOMÉ": 8205, "TOME": 8205, "TORRES DEL PAINE": 12103,
    "TORTEL": 11303, "TRAIGUÉN": 9107, "TRAIGUEN": 9107, "TREHUACO": 8108,
    "TUCAPEL": 8412, "VALDIVIA": 10101, "VALLENAR": 3301, "VALPARAISO": 5301,
    "VICHUQUÉN": 7106, "VICHUQUEN": 7106, "VICTORIA": 9109, "VICUÑA": 4105,
    "VICUNA": 4105, "VILCÚN": 9202, "VILCUN": 9202, "VILLA ALEGRE": 7309,
    "VILLA ALEMANA": 5303, "VILLARRICA": 9215, "VITACURA": 15160, "VIÑA DEL MAR": 5302,
    "VINA DEL MAR": 5302, "YERBAS BUENAS": 7302, "YUMBEL": 8409, "YUNGAY": 8116,
    "ZAPALLAR": 5204, "ÑIQUÉN": 8110, "NIQUEN": 8110, "ÑUÑOA": 15105,
    "NUNOA": 15105,
};

function obtenerCodigoComuna(nombre) {
    const upper = nombre.toUpperCase().trim();
    if (COMUNAS_SII[upper]) return COMUNAS_SII[upper];
    for (const [key, codigo] of Object.entries(COMUNAS_SII)) {
        if (key.includes(upper) || upper.includes(key)) return codigo;
    }
    return null;
}

async function geocodificarSII(rolFormato) {
    const partes = rolFormato.split("-");
    if (partes.length < 3) return { error: "Formato de rol inválido" };

    const nombreComuna = partes[0].trim();
    const manzana = String(parseInt(partes[1])).padStart(5, "0");
    const predio = String(parseInt(partes[2])).padStart(3, "0");
    const codigoComuna = obtenerCodigoComuna(nombreComuna);

    if (!codigoComuna) return { error: `Comuna no encontrada: ${nombreComuna}` };

    const payload = {
        metaData: {
            namespace: "cl.sii.sdi.lob.bbrr.mapas.data.api.interfaces.MapasFacadeService/getPredioNacional",
            conversationId: "UNAUTHENTICATED-CALL",
            transactionId: "estadohub-001",
        },
        data: {
            predio: { comuna: String(codigoComuna), manzana, predio },
            servicios: [],
        },
    };

    try {
        const resp = await fetch(SII_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://www4.sii.cl/mapasui/internet/",
                "Origin": "https://www4.sii.cl",
            },
            body: JSON.stringify(payload),
        });

        const data = await resp.json();
        const predioData = data?.data;

        if (!predioData?.existePredio) {
            return { error: "No se encontraron datos en el SII para esta propiedad." };
        }

        const lat = predioData.ubicacionX;
        const lon = predioData.ubicacionY;

        if (!lat || !lon) return { error: "SII no devolvió coordenadas para este predio." };

        return {
            lat, lon,
            ubicacion: predioData.ubicacion || "",
            destino: predioData.destinoDescripcion || "",
        };
    } catch (e) {
        return { error: `Error consultando SII: ${e.message}` };
    }
}

async function consultarDGA(lat, lon) {
    const BASE = "https://rest-sit.mop.gov.cl/arcgis/rest/services";
    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://dga.mop.gob.cl/",
        "Accept": "application/json, text/plain, */*",
    };

    let pozos500m = 0, pozos2km = 0, caudalPromedio = 0;
    let zonaProhibicion = false, zonaRestriccion = false, nombreZona = "";
    let errorDGA = "";

    try {
        const params = new URLSearchParams({
            geometry: `${lon},${lat}`,
            geometryType: "esriGeometryPoint",
            inSR: "4326",
            spatialRel: "esriSpatialRelIntersects",
            distance: "2000",
            units: "esriSRUnit_Meter",
            outFields: "TIPO_FUENTE,CAUDAL_MEDIO,PROF_POZO,ESTADO,EXPEDIENTE",
            returnGeometry: "true",
            outSR: "4326",
            f: "json",
        });

        const resp = await fetch(`${BASE}/SNIA/SNIA_DerechoAprovechamiento/MapServer/0/query?${params}`, { headers });
        const data = await resp.json();
        const features = data.features || [];

        const caudales = [];
        for (const feat of features) {
            const attrs = feat.attributes || {};
            const geom = feat.geometry || {};
            const tipoFuente = (attrs.TIPO_FUENTE || "").toUpperCase();
            if (tipoFuente && !tipoFuente.includes("SUB")) continue;

            const dLat = lat - (geom.y || lat);
            const dLon = lon - (geom.x || lon);
            const distM = Math.sqrt(dLat * dLat + dLon * dLon) * 111000;

            if (distM <= 500) pozos500m++;
            pozos2km++;

            const caudal = attrs.CAUDAL_MEDIO;
            if (caudal && caudal > 0) caudales.push(caudal);
        }

        if (caudales.length) caudalPromedio = caudales.reduce((a, b) => a + b, 0) / caudales.length;
    } catch {
        errorDGA = "Servicio DGA temporalmente no disponible.";
    }

    try {
        const params = new URLSearchParams({
            geometry: `${lon},${lat}`,
            geometryType: "esriGeometryPoint",
            inSR: "4326",
            spatialRel: "esriSpatialRelIntersects",
            outFields: "TIPO,NOMBREAREA",
            returnGeometry: "false",
            f: "json",
        });

        const resp = await fetch(`${BASE}/DGA/Areas_Restriccion_Zonas_prohibicion/MapServer/0/query?${params}`, { headers });
        const data = await resp.json();

        for (const feat of (data.features || [])) {
            const attrs = feat.attributes || {};
            const tipo = (attrs.TIPO || "").toUpperCase();
            if (tipo.includes("PROHIBICION") || tipo.includes("PROHIBICIÓN")) zonaProhibicion = true;
            else if (tipo.includes("RESTRICCION") || tipo.includes("RESTRICCIÓN")) zonaRestriccion = true;
            if (attrs.NOMBREAREA) nombreZona = attrs.NOMBREAREA;
        }
    } catch { /* restricciones falló silenciosamente */ }

    return { pozos500m, pozos2km, caudalPromedio, zonaProhibicion, zonaRestriccion, nombreZona, errorDGA };
}

async function consultarTopografia(lat, lon) {
    const DELTA = 0.0015;
    const puntos = [
        [lat, lon], [lat + DELTA, lon], [lat - DELTA, lon],
        [lat, lon + DELTA], [lat, lon - DELTA],
    ];
    const locations = puntos.map(([la, lo]) => `${la},${lo}`).join("|");

    try {
        const resp = await fetch(`https://api.opentopodata.org/v1/srtm30m?locations=${locations}`);
        const data = await resp.json();
        const elevaciones = (data.results || []).map(r => r.elevation || 0);
        if (elevaciones.length < 5) return { elevacion: 0, pendiente: 0, posicion: "DESCONOCIDO" };

        const [centro, norte, sur, este, oeste] = elevaciones;
        const distM = DELTA * 111000;
        const pendienteMax = Math.max(
            Math.abs(centro - norte), Math.abs(centro - sur),
            Math.abs(centro - este), Math.abs(centro - oeste)
        ) / distM * 100;

        const vecinosMasAltos = [norte, sur, este, oeste].filter(v => v > centro).length;

        return {
            elevacion: Math.round(centro),
            pendiente: Math.round(pendienteMax * 10) / 10,
            posicion: vecinosMasAltos >= 2 ? "VALLE" : "CERRO",
        };
    } catch {
        return { elevacion: 0, pendiente: 0, posicion: "DESCONOCIDO" };
    }
}

function calcularScore(dga, ubicacion, destino, pendiente, posicion) {
    let score = 0;

    if (dga.pozos500m >= 3) score += 40;
    else if (dga.pozos500m >= 1) score += 30;
    else if (dga.pozos2km >= 3) score += 20;
    else if (dga.pozos2km >= 1) score += 10;

    if (dga.caudalPromedio >= 5) score += 10;
    else if (dga.caudalPromedio >= 1) score += 5;

    if (posicion === "VALLE") score += 20;
    else score += 5;

    if (pendiente < 3) score += 10;
    else if (pendiente < 8) score += 5;

    const destinoUpper = (destino || "").toUpperCase();
    if (destinoUpper.includes("AGRICOLA") || destinoUpper.includes("AGRÍCOLA")) score += 20;
    else if (ubicacion === "RURAL") score += 10;

    return Math.min(score, 100);
}

function calcularOportunidad(montoMinimo, montoAvaluo) {
    if (!montoMinimo || !montoAvaluo) return null;
    const ratio = montoMinimo / montoAvaluo;
    const descuento = Math.round((1 - ratio) * 100);
    let nivel = "NORMAL";
    if (descuento >= 40) nivel = "ALTA";
    else if (descuento >= 20) nivel = "MEDIA";
    return { ratio: Math.round(ratio * 100) / 100, descuento, nivel };
}

function calcularAntiguedadDeuda(periodoDesde) {
    if (!periodoDesde) return null;
    const partes = periodoDesde.split("-");
    if (partes.length < 2) return null;
    const [mes, anio] = partes;
    const fechaDesde = new Date(parseInt(anio), parseInt(mes) - 1);
    const hoy = new Date();
    const meses = (hoy.getFullYear() - fechaDesde.getFullYear()) * 12 +
        (hoy.getMonth() - fechaDesde.getMonth());
    const anios = Math.floor(meses / 12);
    let nivel = "RECIENTE";
    if (anios >= 5) nivel = "MUY ANTIGUA";
    else if (anios >= 3) nivel = "ANTIGUA";
    else if (anios >= 1) nivel = "MODERADA";
    return { meses, anios, nivel };
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const rolFormato = searchParams.get("rol");
    const montoMinimo = parseFloat(searchParams.get("montoMinimo") || "0");
    const montoAvaluo = parseFloat(searchParams.get("montoAvaluo") || "0");
    const periodoDesde = searchParams.get("periodoDesde") || "";

    if (!rolFormato) {
        return NextResponse.json({ error: "Falta parámetro rol" }, { status: 400 });
    }

    // 1. SII
    const geo = await geocodificarSII(rolFormato);
    if (geo.error) {
        return NextResponse.json({ error: geo.error }, { status: 422 });
    }

    // 2. DGA
    const dga = await consultarDGA(geo.lat, geo.lon);

    // 3. Topografía
    const topo = await consultarTopografia(geo.lat, geo.lon);

    // 4. Score agua
    const scoreAgua = calcularScore(dga, geo.ubicacion, geo.destino, topo.pendiente, topo.posicion);
    const nivelAgua = scoreAgua >= 70 ? "ALTO" : scoreAgua >= 40 ? "MEDIO" : "BAJO";
    const puedePerforar = !dga.zonaProhibicion;

    // 5. Score oportunidad
    const oportunidad = calcularOportunidad(montoMinimo, montoAvaluo);

    // 6. Antigüedad deuda
    const antiguedad = calcularAntiguedadDeuda(periodoDesde);

    return NextResponse.json({
        coordenadas: { lat: geo.lat, lon: geo.lon },
        ubicacion: geo.ubicacion,
        destino: geo.destino,
        agua: {
            score: scoreAgua,
            nivel: nivelAgua,
            puedePerforar,
            pozos500m: dga.pozos500m,
            pozos2km: dga.pozos2km,
            caudalPromedio: Math.round(dga.caudalPromedio * 100) / 100,
            zonaProhibicion: dga.zonaProhibicion,
            zonaRestriccion: dga.zonaRestriccion,
            nombreZona: dga.nombreZona,
            elevacion: topo.elevacion,
            pendiente: topo.pendiente,
            posicion: topo.posicion,
            errorDGA: dga.errorDGA,
        },
        oportunidad,
        antiguedad,
    });
}