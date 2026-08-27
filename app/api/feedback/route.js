import { NextResponse } from "next/server";
import { escaparHtml, fila, enlaceCorreo, layoutCorreo, adjuntoLogo } from "@/lib/email/plantilla";

const TIPOS = {
  sugerencia: "Sugerencia",
  error: "Reporte de Error",
  otro: "Comentario",
};

export async function POST(request) {
  try {
    const { mensaje, tipo, email, ruta } = await request.json();

    if (!mensaje || !mensaje.trim()) {
      return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 });
    }
    if (mensaje.length > 4000) {
      return NextResponse.json({ error: "El mensaje es demasiado largo" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("Falta RESEND_API_KEY en las variables de entorno");
    }

    const etiquetaTipo = TIPOS[tipo] || TIPOS.otro;

    // Importación lazy dentro de la función (evita ejecución en build)
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: "EstadoHUB <onboarding@resend.dev>",
      to: process.env.COLABORACION_EMAIL,
      subject: `${etiquetaTipo} - feedback plataforma beta`,
      html: layoutCorreo({
        preview: `${etiquetaTipo}: ${mensaje.slice(0, 90)}`,
        titulo: etiquetaTipo,
        filas: [
          fila("Sección", escaparHtml(ruta) || "-"),
          fila("Correo de contacto", enlaceCorreo(email)),
        ],
        mensaje,
        pie: "Mensaje enviado desde el recuadro «Plataforma beta» de EstadoHUB.",
      }),
      attachments: [adjuntoLogo()],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error enviando feedback:", error);
    return NextResponse.json({ error: "No se pudo enviar el mensaje" }, { status: 500 });
  }
}
