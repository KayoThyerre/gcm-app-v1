import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../prisma/client";
import { FIELD_LIMITS, validateMaxLength } from "../utils/validation";

type BootstrapInput = {
  email: string;
  password?: string;
  name?: string;
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

function getBootstrapInput(): BootstrapInput {
  return {
    email:
      readArg("email") ||
      process.env.BOOTSTRAP_DEV_EMAIL?.trim() ||
      "",
    password:
      readArg("password") ||
      process.env.BOOTSTRAP_DEV_PASSWORD?.trim(),
    name:
      readArg("name") ||
      process.env.BOOTSTRAP_DEV_NAME?.trim(),
  };
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateInput(input: BootstrapInput) {
  const email = input.email.trim().toLowerCase();
  const name = input.name?.trim();
  const password = input.password?.trim();

  if (!email) {
    throw new Error("Informe o e-mail com --email ou BOOTSTRAP_DEV_EMAIL.");
  }

  if (!validateEmail(email)) {
    throw new Error("Informe um e-mail valido para o bootstrap.");
  }

  const maxLengthError =
    validateMaxLength(email, "E-mail", FIELD_LIMITS.email) ||
    validateMaxLength(name, "Nome", FIELD_LIMITS.name) ||
    validateMaxLength(password, "Senha", FIELD_LIMITS.password);

  if (maxLengthError) {
    throw new Error(maxLengthError);
  }

  if (password && password.length < 12) {
    throw new Error("A senha do bootstrap deve ter pelo menos 12 caracteres.");
  }

  return {
    email,
    name: name || "Bootstrap DEV",
    password,
  };
}

function printUsage() {
  console.info(`
Uso:
  npm run bootstrap:dev -- --email dev@example.com --password "senha-com-12+chars" --name "Nome DEV"

Tambem e possivel usar variaveis de ambiente:
  BOOTSTRAP_DEV_EMAIL
  BOOTSTRAP_DEV_PASSWORD
  BOOTSTRAP_DEV_NAME

Observacao:
  Se o usuario ja existir, o script apenas promove para DEV, ACTIVE e emailVerified=true.
  Se nao existir, BOOTSTRAP_DEV_PASSWORD/--password e obrigatoria para criar o usuario.
`);
}

async function bootstrapDev() {
  const input = validateInput(getBootstrapInput());

  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, email: true },
  });

  if (existingUser) {
    const user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        role: "DEV",
        status: "ACTIVE",
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
        lastVerificationSentAt: null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
      },
    });

    console.info("[bootstrap:dev] Usuario existente promovido com sucesso.", user);
    return;
  }

  if (!input.password) {
    throw new Error(
      "Usuario nao existe. Informe --password ou BOOTSTRAP_DEV_PASSWORD para cria-lo."
    );
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashedPassword,
      role: "DEV",
      status: "ACTIVE",
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
      lastVerificationSentAt: null,
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
    },
  });

  console.info("[bootstrap:dev] Usuario DEV criado com sucesso.", user);
}

bootstrapDev()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Falha no bootstrap.";
    console.error(`[bootstrap:dev] ${message}`);
    printUsage();
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
