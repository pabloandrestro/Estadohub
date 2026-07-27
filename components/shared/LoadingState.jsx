export default function LoadingState({
    title = "Cargando información",
    description = "Espera un momento mientras se obtienen los datos.",
}) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
            <div className="mb-4 h-4 w-40 animate-pulse rounded bg-slate-800" />
            <div className="mb-3 h-8 w-72 animate-pulse rounded bg-slate-800" />
            <div className="mb-6 h-4 w-full max-w-2xl animate-pulse rounded bg-slate-900" />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div
                        key={index}
                        className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
                    >
                        <div className="mb-3 h-3 w-24 animate-pulse rounded bg-slate-800" />
                        <div className="h-8 w-20 animate-pulse rounded bg-slate-700" />
                    </div>
                ))}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="mb-4 h-4 w-48 animate-pulse rounded bg-slate-800" />
                <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="h-10 animate-pulse rounded bg-slate-800/80" />
                    ))}
                </div>
            </div>

            <p className="mt-5 text-sm text-slate-400">{title}</p>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
    );
}