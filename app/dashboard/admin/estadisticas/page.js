import { notFound } from "next/navigation";
import { esAdmin } from "@/lib/supabase/auth";
import { getEstadisticasUso, TTL_SEGUNDOS } from "@/services/admin/estadisticasUsoService";
import EstadisticasUso from "@/components/apis/admin/EstadisticasUso";
import ErrorBanner from "@/components/shared/ErrorBanner";

export default async function EstadisticasPage() {
    // Defensa en profundidad: el layout y proxy.js ya cortan, pero cada
    // componente de servidor verifica su propio acceso.
    if (!(await esAdmin())) {
        notFound();
    }

    // Vercel define estas variables en cualquier deploy; su ausencia = entorno local,
    // donde /api/track no recibe las cabeceras de geolocalización.
    const enProduccion = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

    // Datos servidos desde una caché de 5 minutos (no se recalculan en cada carga).
    const data = await getEstadisticasUso();

    if (data.error) {
        return (
            <ErrorBanner
                title="No se pudieron cargar las estadísticas"
                message={data.error}
            />
        );
    }

    return (
        <EstadisticasUso
            dias={data.dias}
            resumen={data.resumen}
            porDia={data.porDia}
            porPais={data.porPais}
            porRuta={data.porRuta}
            actualizado={data.actualizado}
            ttlSegundos={TTL_SEGUNDOS}
            enProduccion={enProduccion}
        />
    );
}
