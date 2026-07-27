import RematesVisualizer from "@/components/apis/tgr/RematesVisualizer";
import ErrorBanner from "@/components/shared/ErrorBanner";
import { getRematesActivos } from "@/services/tgr/rematesService";

export const revalidate = 3600;

export default async function TgrPage() {
    let datos = [];
    let error = null;

    try {
        datos = await getRematesActivos();
    } catch {
        error = "No se pudieron obtener los remates desde TGR. Intente más tarde.";
    }

    return error ? <ErrorBanner mensaje={error} /> : <RematesVisualizer datos={datos} />;
}