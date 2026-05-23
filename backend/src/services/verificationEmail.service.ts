import { env } from "../config/env";
import { sendEmail } from "./email.service";

type SendVerificationEmailInput = {
  to: string;
  name: string;
  token: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function buildVerificationUrl(token: string) {
  const params = new URLSearchParams({ token });
  return `${env.API_PUBLIC_URL}/auth/verify-email?${params.toString()}`;
}

export async function sendVerificationEmail({
  to,
  name,
  token,
}: SendVerificationEmailInput) {
  const verificationUrl = buildVerificationUrl(token);
  const safeName = escapeHtml(name);
  const safeVerificationUrl = escapeHtml(verificationUrl);

  if (env.EMAIL_PROVIDER === "console" && env.EMAIL_LOG_VERIFICATION_LINKS) {
    console.info("[auth/verification-email] Link de verificacao gerado.", {
      to,
      verificationUrl,
    });
  }

  await sendEmail({
    to,
    subject: "Verifique seu e-mail",
    text: [
      `Ola, ${name}.`,
      "",
      "Recebemos seu cadastro no sistema da Guarda Civil Municipal.",
      "Para confirmar seu e-mail, acesse o link abaixo:",
      verificationUrl,
      "",
      "Este link expira em 1 hora.",
      "Se voce nao realizou este cadastro, ignore esta mensagem.",
    ].join("\n"),
    html: [
      `<p>Ola, <strong>${safeName}</strong>.</p>`,
      "<p>Recebemos seu cadastro no sistema da Guarda Civil Municipal.</p>",
      `<p><a href="${safeVerificationUrl}">Clique aqui para confirmar seu e-mail</a>.</p>`,
      "<p>Este link expira em 1 hora.</p>",
      "<p>Se voce nao realizou este cadastro, ignore esta mensagem.</p>",
    ].join(""),
  });
}
