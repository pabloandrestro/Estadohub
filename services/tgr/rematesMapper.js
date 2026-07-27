function primeroValor(...valores) {
    for (const v of valores) {
        if (v !== null && v !== undefined && v !== "") return v;
    }
    return null;
}

function texto(...valores) {
    for (const v of valores) {
        if (typeof v === "string" && v.trim() !== "") return v.trim();
        if (typeof v === "number" && Number.isFinite(v)) return String(v);
    }
    return null;
}

function numero(...valores) {
    for (const v of valores) {
        if (v === null || v === undefined || v === "") continue;

        if (typeof v === "number" && Number.isFinite(v) && v > 0) {
            return v;
        }

        if (typeof v === "string") {
            const limpio = v
                .replace(/\$/g, "")
                .replace(/\s/g, "")
                .replace(/\./g, "")
                .replace(/,/g, ".")
                .replace(/[^\d.-]/g, "");

            const n = Number(limpio);
            if (!Number.isNaN(n) && n > 0) return n;
        }
    }
    return null;
}

function fecha(...valores) {
    for (const v of valores) {
        if (!v) continue;
        if (typeof v === "string" && v.trim() !== "") return v.trim();
        if (v instanceof Date) return v.toISOString();
    }
    return null;
}

export function mapearRemate(raw = {}) {
    const rolPropiedad = texto(
        raw.rolPropiedad,
        raw.rolPropiedadSii,
        raw.rolSii,
        raw.rolAvalúo,
        raw.rolAvaluo,
        raw.rol_inmueble,
        raw.rolBien,
        raw.numeroRol,
        raw.idPropiedad,
        raw.rol
    );

    const rolCausa = texto(
        raw.rolCausa,
        raw.rolJuicio,
        raw.rolJudicial,
        raw.rol_judicial,
        raw.causaRol,
        raw.numeroCausa,
        raw.causa,
        raw.rit,
        raw.rolExpediente,
        raw.idCausa,
        raw.expedienteCausa,
        raw.codDemanda,               // ← CLAVE REAL
        raw.nroExpJud                 // ← apoyo
    );

    const expediente = texto(
        raw.expediente,
        raw.numeroExpediente,
        raw.idExpediente,
        raw.codigoExpediente,
        raw.expedienteRemate,
        raw.expediente_caratulado,
        raw.identificacionExpedienteAdm // ← CLAVE REAL
    );

    const montoAvaluo = numero(
        raw.montoAvaluo,
        raw.avaluoFiscal,
        raw.valorReferencia,
        raw.avaluo,
        raw.valorAvaluo,
        raw.referencia,
        raw.valor_referencial
    );

    const montoMinimo = numero(
        raw.montoMinimo,
        raw.tasacionMinima,
        raw.posturaMinima,
        raw.valorMinimo,
        raw.minimoSubasta,
        raw.precioMinimo,
        raw.baseRemate,
        raw.base_minima,
        raw.postura_minima,
        raw.minimo_remate,
        raw.monto_minimo,
        raw.tasacion_minima,
        raw.valor_minimo,
        raw.base,
        raw.minimo,
        raw.subastaMinima,
        raw.tasacion // ← CLAVE REAL
    );

    const periodoDesde = texto(
        raw.periodoDesde,
        raw.desdePeriodo,
        raw.periodoInicial,
        raw.inicioPeriodo,
        raw.periodo_inicio,
        raw.periodoDeudaDesde,
        raw.periodoMin,
        raw.desde,
        raw.periodoPublicacionI // ← CLAVE REAL
    );

    const periodoHasta = texto(
        raw.periodoHasta,
        raw.hastaPeriodo,
        raw.periodoFinal,
        raw.finPeriodo,
        raw.periodo_fin,
        raw.periodoDeudaHasta,
        raw.periodoMax,
        raw.hasta,
        raw.periodoPublicacionF // ← CLAVE REAL
    );

    const extension = texto(
        raw.extension,
        raw.tramo,
        raw.superficie,
        raw.detalleExtension,
        raw.area,
        raw.metros,
        raw.extensionTerreno
    );

    return {
        id: primeroValor(
            raw.id,
            raw.idRemate,
            raw.codigoRemate,
            raw.pblRemId,
            expediente,
            rolPropiedad,
            `${rolPropiedad || "sin-rol"}-${raw.fechaRemate || raw.fecha || ""}`
        ),

        nombreDuegno: texto(
            raw.nombreDuegno,
            raw.nombreDueno,
            raw.deudor,
            raw.propietario,
            raw.nombrePropietario,
            raw.nombreDeudor
        ),

        direccionRol: texto(
            raw.direccionRol,
            raw.direccion,
            raw.ubicacion,
            raw.domicilioBien,
            raw.direccionPropiedad,
            raw.ubicacionPropiedad
        ),

        comunaJuzgado: texto(
            raw.comunaJuzgado,
            raw.comuna,
            raw.comunaBien,
            raw.comunaPropiedad,
            raw.comunaRemate
        ),

        tribunal: texto(
            raw.tribunal,
            raw.juzgado,
            raw.nombreJuzgado,
            raw.tribunalNombre,
            raw.juzgadoLetras
        ),

        direccionTribunal: texto(
            raw.direccionTribunal,
            raw.domicilioJuzgado,
            raw.direccionJuzgado,
            raw.ubicacionJuzgado
        ),

        rol: rolPropiedad,
        rolPropiedad,
        rolCausa,
        expediente,

        tipoDeuda: texto(
            raw.tipoDeuda,
            raw.tipo,
            raw.tipoCobro,
            raw.impuesto,
            raw.tipoImpuesto
        ) || "TERRITORIAL",

        montoAvaluo,
        montoMinimo,

        fechaRemate: fecha(
            raw.fechaRemate,
            raw.fecha,
            raw.fechaSubasta,
            raw.fechaAudiencia,
            raw.fecha_remate
        ),

        horaRemate: texto(
            raw.horaRemate,
            raw.hora,
            raw.horaSubasta,
            raw.hora_remate
        ) || "13:00",

        periodoDesde,
        periodoHasta,
        extension,

        _raw: raw,
    };
}

export function mapearListaRemates(lista = []) {
    if (!Array.isArray(lista)) return [];
    return lista.map(mapearRemate).filter(Boolean);
}

export function deduplicarRemates(lista = []) {
    const vistos = new Set();

    return lista.filter((item) => {
        const key = `${item.rolPropiedad || ""}-${item.fechaRemate || ""}-${item.direccionRol || ""}`;
        if (vistos.has(key)) return false;
        vistos.add(key);
        return true;
    });
}