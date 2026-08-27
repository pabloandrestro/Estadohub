import { unstable_cache } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const DIAS = 30;

// TTL de la caché de la sección "Estadística de Uso": los datos se recalculan
// como mucho una vez cada 5 minutos, no en cada carga de página.
export const TTL_SEGUNDOS = 300;

async function consultarEstadisticasUso() {
    const admin = getSupabaseAdmin();

    const [resumen, porDia, porPais, porRuta] = await Promise.all([
        admin.rpc("uso_resumen", { dias: DIAS }),
        admin.rpc("uso_por_dia", { dias: DIAS }),
        admin.rpc("uso_por_pais", { dias: DIAS }),
        admin.rpc("uso_por_ruta", { dias: DIAS, limite: 12 }),
    ]);

    const error =
        resumen.error?.message ||
        porDia.error?.message ||
        porPais.error?.message ||
        porRuta.error?.message ||
        null;

    return {
        dias: DIAS,
        resumen: resumen.data?.[0] ?? null,
        porDia: porDia.data ?? [],
        porPais: porPais.data ?? [],
        porRuta: porRuta.data ?? [],
        actualizado: new Date().toISOString(),
        error,
    };
}

// Caché global (misma clave para todos los admin). El control de acceso lo hace
// la página/layout con esAdmin(); acá solo se sirven datos agregados ya cacheados.
export const getEstadisticasUso = unstable_cache(
    consultarEstadisticasUso,
    ["estadisticas-uso"],
    { revalidate: TTL_SEGUNDOS, tags: ["estadisticas-uso"] }
);
