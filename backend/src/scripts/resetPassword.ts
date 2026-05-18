import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../prisma/client";
import { FIELD_LIMITS, validateMaxLength } from "../utils/validation";

type ResetPasswordInput = {
  email: string;
  password: string;
};

function readArg(name: string) {
  const prefix = `--${name}=`;
  const inlineValue = process.argv.find((arg) => arg.startsWith(prefix));

  if (inlineValue) {
    return inlineValue.slice(prefix.length).trim();
  }

  const index = process.argv.findIndex((arg) => arg === `--${name}`);
  const value = index >= 0 ? process.argv[index + 1] : undefined;

  return value?.trim();
}

function getResetPasswordInput(): ResetPasswordInput {
  return {
    email: readArg("email") || "",
    password: readArg("password") || "",
  };
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateInput(input: ResetPasswordInput) {
  const email = input.email.trim();
  const password = input.password.trim();

  if (!email) {
    throw new Error("Informe o e-mail com --email.");
  }

  if (!validateEmail(email)) {
    throw new Error("Informe um e-mail valido.");
  }

  if (!password) {
    throw new Error("Informe a nova senha com --password.");
  }

  const maxLengthError =
    validateMaxLength(email, "E-mail", FIELD_LIMITS.email) ||
    validateMaxLength(password, "Senha", FIELD_LIMITS.password);

  if (maxLengthError) {
    throw new Error(maxLengthError);
  }

  if (password.length < 12) {
    throw new Error("A nova senha deve ter pelo menos 12 caracteres.");
  }

  return {
    email,
    password,
  };
}

function printUsage() {
  console.info(`
Uso:
  npm run reset:password -- --email user@email.com --password "NovaSenhaForte"

Observacao:
  O script apenas atualiza o hash da senha do usuario existente.
  Ele nao cria usuario, nao altera role, status ou verificacao de e-mail.
`);
}

async function resetPassword() {
  const input = validateInput(getResetPasswordInput());

  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
    },
  });

  if (!user) {
    throw new Error(`Usuario nao encontrado para o e-mail ${input.email}.`);
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
    },
    select: {
      id: true,
    },
  });

  console.info("[reset:password] Senha redefinida com sucesso.", {
    id: user.id,
    email: user.email,
  });
}

resetPassword()
  .catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Falha ao redefinir senha.";
    console.error(`[reset:password] ${message}`);
    printUsage();
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
