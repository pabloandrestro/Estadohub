/**
 * Plantilla mínima y compartida para los correos que envía la app (feedback,
 * colaboradores…). Es una réplica en HTML plano del diseño react-email: los
 * clientes de correo no ejecutan CSS custom properties de forma confiable, así
 * que los colores van con valores fijos (tomados del tema claro) y el correo no
 * tiene modo oscuro.
 */

import {
  LOGO_HUBLAB_BASE64,
  LOGO_HUBLAB_CID,
  LOGO_HUBLAB_FILENAME,
} from "./logo-hublab";

export const COLOR = {
  paper: "#F4F6FB",
  card: "#FFFFFF",
  ink: "#0D1310",
  soft: "rgba(13, 19, 16, 0.58)",
  line: "rgba(13, 19, 16, 0.12)",
  accent: "#0284c7",
};

const FONT_FAMILY =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

/**
 * Adjunto inline del logo para pasar a `resend.emails.send({ attachments: [...] })`.
 * El HTML del correo lo referencia con `<img src="cid:${LOGO_HUBLAB_CID}">`.
 */
export function adjuntoLogo() {
  return {
    filename: LOGO_HUBLAB_FILENAME,
    content: LOGO_HUBLAB_BASE64,
    contentId: LOGO_HUBLAB_CID,
  };
}

/** Escapa texto que provenga del usuario antes de interpolarlo en el HTML. */
export function escaparHtml(valor) {
  if (valor === undefined || valor === null) return "";
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Fila "Etiqueta: valor" con la etiqueta atenuada. `valor` ya debe venir seguro. */
export function fila(label, valor) {
  return `<p style="font-size:14px;line-height:22px;color:${COLOR.ink};margin:0 0 10px">
    <span style="color:${COLOR.soft}">${escaparHtml(label)}: </span>${valor}
  </p>`;
}

/** Enlace mailto seguro para usar dentro de una fila. */
export function enlaceCorreo(email) {
  if (!email) return "—";
  const e = escaparHtml(email);
  return `<a href="mailto:${e}" style="color:${COLOR.accent};text-decoration:none">${e}</a>`;
}

/**
 * Devuelve el documento HTML completo del correo.
 *
 * @param {object} opts
 * @param {string} opts.preview  Texto de vista previa (inbox).
 * @param {string} opts.titulo   Encabezado principal.
 * @param {string[]} [opts.filas]   Filas ya renderizadas con `fila(...)`.
 * @param {string} [opts.mensaje]   Bloque de texto libre del usuario (se escapa aquí).
 * @param {string} [opts.pie]       Nota final atenuada.
 */
export function layoutCorreo({ preview = "", titulo, filas = [], mensaje, pie }) {
  const bloqueMensaje = mensaje
    ? `<hr style="border:none;border-top:1px solid ${COLOR.line};margin:20px 0" />
       <p style="font-size:14px;line-height:22px;color:${COLOR.ink};margin:0;white-space:pre-wrap">${escaparHtml(
         mensaje
       )}</p>`
    : "";

  const bloquePie = pie
    ? `<hr style="border:none;border-top:1px solid ${COLOR.line};margin:28px 0 16px" />
       <p style="font-size:13px;line-height:20px;color:${COLOR.soft};margin:0">${escaparHtml(pie)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light only" />
  </head>
  <body style="background-color:${COLOR.paper};font-family:${FONT_FAMILY};margin:0;padding:0">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escaparHtml(preview)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${COLOR.paper}" style="border-collapse:collapse;background-color:${COLOR.paper}">
      <tr>
        <td align="center" bgcolor="${COLOR.paper}" style="background-color:${COLOR.paper};padding:40px 20px">
          <div style="background-color:${COLOR.card};border-radius:12px;border:1px solid ${COLOR.line};padding:40px 32px;max-width:480px;text-align:left">
            <img src="cid:${LOGO_HUBLAB_CID}" alt="EstadoHUB" width="150" style="display:block;margin:0 auto 24px;width:150px;max-width:60%;height:auto" />
            <h1 style="font-size:20px;color:${COLOR.ink};margin:0 0 20px;font-weight:700">${escaparHtml(
              titulo
            )}</h1>
            ${filas.join("\n            ")}
            ${bloqueMensaje}
            ${bloquePie}
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
