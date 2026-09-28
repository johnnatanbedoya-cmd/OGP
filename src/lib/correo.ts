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

export async function enviarInvitacionTallerPorCorreo(params: {
  paraEmail: string;
  trabajadorNombre: string;
  cargoNombre: string;
  empresaNombre: string;
  url: string;
}): Promise<EnvioCorreoResultado> {
  const remitente = process.env.RESEND_FROM_EMAIL || "OGP <onboarding@resend.dev>";
  const nombre = escaparHtml(params.trabajadorNombre);
  const cargo = escaparHtml(params.cargoNombre);
  const empresa = escaparHtml(params.empresaNombre);

  const textoPlano = `Hola ${params.trabajadorNombre},

${params.empresaNombre} está actualizando la descripción de los cargos de la compañía, y tu aporte es clave — nadie conoce tu día a día mejor que tú.

Por favor completa este breve cuestionario sobre tu cargo, ${params.cargoNombre}, en tus propias palabras:

${params.url}

Te toma entre 15 y 20 minutos. El enlace es personal e intransferible, y vence en 7 días.

Gracias por tu tiempo.

— Equipo de Talento Humano, ${params.empresaNombre}
Este es un mensaje automático enviado a través de OGP — por favor no respondas a este correo.`;

  const html = `
    <p>Hola ${nombre},</p>
    <p>${empresa} está actualizando la descripción de los cargos de la compañía, y tu aporte es clave — nadie conoce tu día a día mejor que tú.</p>
    <p>Por favor completa este breve cuestionario sobre tu cargo, <strong>${cargo}</strong>, en tus propias palabras:</p>
    <p><a href="${params.url}" style="background-color:#0e6b4f;color:#ffffff;padding:10px 20px;border-radius:9999px;text-decoration:none;display:inline-block;">Completar el Taller</a></p>
    <p style="font-size:13px;color:#6b6f76;">O copia y pega este enlace en tu navegador: ${params.url}</p>
    <p>Te toma entre 15 y 20 minutos. El enlace es personal e intransferible, y vence en 7 días.</p>
    <p>Gracias por tu tiempo.</p>
    <p>— Equipo de Talento Humano, ${empresa}</p>
    <p style="font-size:12px;color:#9ba0aa;">Este es un mensaje automático enviado a través de OGP — por favor no respondas a este correo.</p>
  `;

  try {
    const resultado = await obtenerClienteResend().emails.send({
      from: remitente,
      to: params.paraEmail,
      subject: `${params.empresaNombre}: completa el Taller de tu cargo (${params.cargoNombre})`,
      text: textoPlano,
      html,
    });
    if (resultado.error) return { ok: false, error: resultado.error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error desconocido al enviar el correo" };
  }
}
