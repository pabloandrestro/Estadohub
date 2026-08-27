import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

export const metadata = {
  title: "EstadoHUB - APIs Públicas Chile",
  description: "Dashboard centralizado para TGR Remates y Mercado Público",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <body className="bg-[#090d16] text-slate-100 min-h-screen relative overflow-x-hidden antialiased">
        {/* Orbes de luz atmosférica de fondo */}
        <div className="fixed -top-40 right-10 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="fixed -bottom-40 left-10 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}