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

export const env = {
  NODE_ENV,
  isProduction,
  PORT,
  CORS_ORIGIN: process.env.CORS_ORIGIN?.trim() || "http://localhost:5173",
  API_PUBLIC_URL,
  DATABASE_URL: process.env.DATABASE_URL as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
};
