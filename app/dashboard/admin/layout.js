import { notFound } from "next/navigation";
import { esAdmin } from "@/lib/supabase/auth";

// Guarda de servidor: aunque proxy.js ya redirige, aquí cortamos por si el
// proxy se saltara esta ruta en algún refactor del matcher.
export default async function AdminLayout({ children }) {
    if (!(await esAdmin())) {
        notFound();
    }
    return children;
}
