import { Router } from "express";
import { prisma } from "../prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import rateLimit from "express-rate-limit";
import { FIELD_LIMITS, validateMaxLength } from "../utils/validation";
import { env } from "../config/env";

export const authRoutes = Router();
const resendVerificationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  statusCode: 429,
  message: "Muitas solicitações. Tente novamente mais tarde.",
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 4,
  statusCode: 429,
  message: {
    error: "Muitas tentativas de login. Tente novamente mais tarde.",
  },
});

authRoutes.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      error: "Name, email e password sao obrigatorios",
    });
  }

  const maxLengthError =
    validateMaxLength(name, "Nome", FIELD_LIMITS.name) ||
    validateMaxLength(email, "E-mail", FIELD_LIMITS.email) ||
    validateMaxLength(password, "Senha", FIELD_LIMITS.password);

  if (maxLengthError) {
    return res.status(400).json({ error: maxLengthError });
  }

  const userAlreadyExists = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
    },
  });

  if (userAlreadyExists) {
    return res.status(400).json({
      error: "Nao foi possivel concluir o cadastro",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = randomBytes(32).toString("hex");
  const verificationTokenExpires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "USER",
      status: "PENDING",
      emailVerified: false,
      verificationToken,
      verificationTokenExpires,
      lastVerificationSentAt: new Date(),
    },
  });

  console.log(
    `${env.API_PUBLIC_URL}/auth/verify-email?token=${verificationToken}`
  );

  return res.status(201).json({
    message: "Cadastro realizado. Verifique seu e-mail para continuar.",
  });
});

authRoutes.get("/verify-email", async (req, res) => {
  const { token } = req.query;

  if (typeof token !== "string" || !token.trim()) {
    return res.status(400).json({
      error: "Token nao enviado",
    });
  }

  const user = await prisma.user.findFirst({
    where: { verificationToken: token },
    select: {
      id: true,
      verificationTokenExpires: true,
    },
  });

  if (!user) {
    return res.status(400).json({
      error: "Token invÃ¡lido",
    });
  }

  if (
    !user.verificationTokenExpires ||
    user.verificationTokenExpires <= new Date()
  ) {
    return res.status(400).json({
      error: "Token expirado",
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
    },
  });

  return res.status(200).json({
    message: "E-mail verificado com sucesso. Aguarde aprovação do administrador.",
  });
});

authRoutes.post("/resend-verification", resendVerificationLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: "E-mail é obrigatório.",
    });
  }

  const maxLengthError = validateMaxLength(email, "E-mail", FIELD_LIMITS.email);

  if (maxLengthError) {
    return res.status(400).json({ error: maxLengthError });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      emailVerified: true,
      lastVerificationSentAt: true,
    },
  });

  if (!user) {
    return res.status(200).json({
      message: "Se o e-mail estiver cadastrado, você receberá instruções.",
    });
  }

  if (user.emailVerified) {
    return res.status(400).json({
      error: "E-mail já verificado.",
    });
  }

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (
    user.lastVerificationSentAt &&
    user.lastVerificationSentAt > fiveMinutesAgo
  ) {
    return res.status(429).json({
      error: "Aguarde antes de solicitar novo envio.",
    });
  }

  const verificationToken = randomBytes(32).toString("hex");
  const verificationTokenExpires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationToken,
      verificationTokenExpires,
      lastVerificationSentAt: new Date(),
    },
  });

  console.log(
    `${env.API_PUBLIC_URL}/auth/verify-email?token=${verificationToken}`
  );

  return res.status(200).json({
    message: "Se o e-mail estiver cadastrado, você receberá instruções.",
  });
});

authRoutes.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Email e senha são obrigatórios",
    });
  }

  const maxLengthError =
    validateMaxLength(email, "E-mail", FIELD_LIMITS.email) ||
    validateMaxLength(password, "Senha", FIELD_LIMITS.password);

  if (maxLengthError) {
    return res.status(400).json({ error: maxLengthError });
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(401).json({
      error: "Email ou senha inválidos",
    });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return res.status(401).json({
      error: "Email ou senha inválidos",
    });
  }

  console.log("[auth/login] account flags", {
    emailVerified: user.emailVerified,
    status: user.status,
  });

  if (!user.emailVerified) {
    return res.status(403).json({
      error: "E-mail ainda não verificado",
    });
  }

  if (user.status !== "ACTIVE") {
    return res.status(403).json({
      error: "Usuário ainda não aprovado pelo administrador",
    });
  }

  const token = jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });

});
