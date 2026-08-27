import { NextResponse } from "next/server";
import { escaparHtml, fila, enlaceCorreo, layoutCorreo, adjuntoLogo } from "@/lib/email/plantilla";

export async function POST(request) {
  try {
    const { nombre, profesion, interes, email } = await request.json();

    if (!nombre || !email) {
      return NextResponse.json({ error: "Nombre y correo son obligatorios" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("Falta RESEND_API_KEY en las variables de entorno");
    }

    // Importación lazy dentro de la función (evita ejecución en build)
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: "EstadoHUB <onboarding@resend.dev>",
      to: process.env.COLABORACION_EMAIL,
      subject: `🤝 Nuevo colaborador: ${nombre}`,
      html: layoutCorreo({
        preview: `Nueva postulación de ${nombre} — ${profesion || "sin área"}`,
        titulo: "Nuevo colaborador interesado",
        filas: [
          fila("Nombre", escaparHtml(nombre)),
          fila("Profesión / área", escaparHtml(profesion) || "—"),
          fila("Correo de contacto", enlaceCorreo(email)),
        ],
        mensaje: interes || undefined,
        pie: "Postulación enviada desde el formulario «¿Quieres colaborar?» de EstadoHUB.",
      }),
      attachments: [adjuntoLogo()],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error enviando correo:", error);
    return NextResponse.json({ error: "No se pudo enviar el correo" }, { status: 500 });
  }
}
