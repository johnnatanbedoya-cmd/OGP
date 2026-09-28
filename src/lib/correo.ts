import "server-only";
import { Resend } from "resend";

let clienteResend: Resend | null = null;

function obtenerClienteResend(): Resend {
  if (!clienteResend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("Falta la variable de entorno RESEND_API_KEY");
    clienteResend = new Resend(apiKey);
  }
  return clienteResend;
}

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type EnvioCorreoResultado = { ok: true } | { ok: false; error: string };

/** Mismo asunto/cuerpo que ya usa el botón manual (mailto), pero enviado de verdad vía Resend. */
export async function enviarInvitacionTallerPorCorreo(params: {
  paraEmail: string;
  trabajadorNombre: string;
  cargoNombre: string;
  url: string;
}): Promise<EnvioCorreoResultado> {
  const remitente = process.env.RESEND_FROM_EMAIL || "OGP <onboarding@resend.dev>";
  const nombre = escaparHtml(params.trabajadorNombre);
  const cargo = escaparHtml(params.cargoNombre);

  try {
    const resultado = await obtenerClienteResend().emails.send({
      from: remitente,
      to: params.paraEmail,
      subject: `Taller de campo — ${params.cargoNombre}`,
      text: `Hola ${params.trabajadorNombre},\n\nPor favor completa este breve cuestionario sobre tu cargo (${params.cargoNombre}), en tus propias palabras:\n${params.url}\n\nTe toma unos 15-20 minutos. El enlace es personal y vence en 7 días.\n\nGracias.`,
      html: `<p>Hola ${nombre},</p><p>Por favor completa este breve cuestionario sobre tu cargo (<strong>${cargo}</strong>), en tus propias palabras:</p><p><a href="${params.url}">${params.url}</a></p><p>Te toma unos 15-20 minutos. El enlace es personal y vence en 7 días.</p><p>Gracias.</p>`,
    });
    if (resultado.error) return { ok: false, error: resultado.error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error desconocido al enviar el correo" };
  }
}
