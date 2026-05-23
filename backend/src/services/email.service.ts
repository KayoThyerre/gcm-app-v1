import { env } from "../config/env";

type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

async function sendWithResend(message: EmailMessage) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.EMAIL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(
      `[email] Falha ao enviar e-mail via Resend: ${response.status} ${responseBody}`
    );
  }
}

function sendWithConsole(message: EmailMessage) {
  console.info("[email/console] E-mail preparado.", {
    to: message.to,
    subject: message.subject,
  });
}

export async function sendEmail(message: EmailMessage) {
  if (env.EMAIL_PROVIDER === "resend") {
    await sendWithResend(message);
    return;
  }

  sendWithConsole(message);
}
