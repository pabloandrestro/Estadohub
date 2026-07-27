export default function ErrorBanner({
    title = "Ocurrió un error",
    message = "No fue posible cargar la información solicitada.",
}) {
    return (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-red-300">
                {title}
            </h3>
            <p className="mt-2 text-sm text-red-200">{message}</p>
        </div>
    );
}