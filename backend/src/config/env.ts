const NODE_ENV = process.env.NODE_ENV?.trim() || "development";
const isProduction = NODE_ENV === "production";

const requiredEnvVars = [
  "DATABASE_URL",
  "JWT_SECRET",
  ...(isProduction ? ["CORS_ORIGIN", "API_PUBLIC_URL"] : []),
] as const;

const missingEnvVars = requiredEnvVars.filter(
  (name) => !process.env[name]?.trim()
);

if (missingEnvVars.length > 0) {
  throw new Error(
    `[env] Variaveis obrigatorias ausentes: ${missingEnvVars.join(", ")}`
  );
}

const rawPort = process.env.PORT?.trim();
const PORT = rawPort ? Number(rawPort) : 3333;

if (!Number.isInteger(PORT) || PORT <= 0) {
  throw new Error("[env] PORT deve ser um numero inteiro positivo.");
}

const API_PUBLIC_URL = (
  process.env.API_PUBLIC_URL?.trim() || `http://localhost:${PORT}`
).replace(/\/+$/, "");

const supportedEmailProviders = ["console", "resend"] as const;
type EmailProvider = (typeof supportedEmailProviders)[number];

const EMAIL_PROVIDER = (
  process.env.EMAIL_PROVIDER?.trim().toLowerCase() || "console"
) as EmailProvider;

if (!supportedEmailProviders.includes(EMAIL_PROVIDER)) {
  throw new Error(
    `[env] EMAIL_PROVIDER deve ser um destes valores: ${supportedEmailProviders.join(", ")}.`
  );
}

const EMAIL_FROM = process.env.EMAIL_FROM?.trim() || "";
const EMAIL_API_KEY = process.env.EMAIL_API_KEY?.trim() || "";

if (EMAIL_PROVIDER !== "console") {
  const missingEmailVars = [
    !EMAIL_FROM ? "EMAIL_FROM" : null,
    !EMAIL_API_KEY ? "EMAIL_API_KEY" : null,
  ].filter(Boolean);

  if (missingEmailVars.length > 0) {
    throw new Error(
      `[env] Variaveis obrigatorias para envio de e-mail ausentes: ${missingEmailVars.join(", ")}`
    );
  }
}

export const env = {
  NODE_ENV,
  isProduction,
  PORT,
  CORS_ORIGIN: process.env.CORS_ORIGIN?.trim() || "http://localhost:5173",
  API_PUBLIC_URL,
  DATABASE_URL: process.env.DATABASE_URL as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  EMAIL_PROVIDER,
  EMAIL_FROM,
  EMAIL_API_KEY,
  EMAIL_LOG_VERIFICATION_LINKS:
    process.env.EMAIL_LOG_VERIFICATION_LINKS?.trim() === "true",
};
