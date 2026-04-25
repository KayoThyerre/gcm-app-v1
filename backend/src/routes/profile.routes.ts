import { Router } from "express";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { prisma } from "../prisma/client";
import bcrypt from "bcrypt";
import { FIELD_LIMITS, validateMaxLength } from "../utils/validation";

export const profileRoutes = Router();

const profileSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatarUrl: true,
  createdAt: true,
} as const;

profileRoutes.get("/", ensureAuthenticated, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: profileSelect,
  });

  if (!user) {
    return res.status(404).json({
      error: "Usuário não encontrado",
    });
  }

  return res.json(user);
});

profileRoutes.patch("/", ensureAuthenticated, async (req, res) => {
  const { name, phone, avatarUrl, email, role, status, password } = req.body as {
    name?: unknown;
    phone?: unknown;
    avatarUrl?: unknown;
    email?: unknown;
    role?: unknown;
    status?: unknown;
    password?: unknown;
  };

  if (email !== undefined || role !== undefined || status !== undefined || password !== undefined) {
    return res.status(400).json({
      error: "Campos não permitidos para atualização de perfil",
    });
  }

  if (name !== undefined && typeof name !== "string") {
    return res.status(400).json({
      error: "Campo name inválido",
    });
  }

  if (phone !== undefined && typeof phone !== "string") {
    return res.status(400).json({
      error: "Campo phone inválido",
    });
  }

  if (avatarUrl !== undefined && typeof avatarUrl !== "string") {
    return res.status(400).json({
      error: "Campo avatarUrl inválido",
    });
  }

  const maxLengthError =
    validateMaxLength(name, "Nome", FIELD_LIMITS.name) ||
    validateMaxLength(phone, "Telefone", FIELD_LIMITS.phone) ||
    validateMaxLength(avatarUrl, "Avatar", FIELD_LIMITS.imageUrl);

  if (maxLengthError) {
    return res.status(400).json({ error: maxLengthError });
  }

  const data: {
    name?: string;
    phone?: string;
    avatarUrl?: string;
  } = {};

  if (name !== undefined) {
    data.name = name;
  }

  if (phone !== undefined) {
    data.phone = phone;
  }

  if (avatarUrl !== undefined) {
    data.avatarUrl = avatarUrl;
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({
      error: "Envie ao menos um campo para atualização",
    });
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data,
    select: profileSelect,
  });

  return res.json(user);
});

profileRoutes.post("/change-password", ensureAuthenticated, async (req, res) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: unknown;
    newPassword?: unknown;
  };

  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    !currentPassword ||
    !newPassword
  ) {
    return res.status(400).json({
      error: "currentPassword e newPassword sao obrigatorios",
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      error: "newPassword deve ter no minimo 6 caracteres",
    });
  }

  const maxLengthError =
    validateMaxLength(currentPassword, "Senha atual", FIELD_LIMITS.password) ||
    validateMaxLength(newPassword, "Nova senha", FIELD_LIMITS.password);

  if (maxLengthError) {
    return res.status(400).json({ error: maxLengthError });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      password: true,
    },
  });

  if (!user) {
    return res.status(404).json({
      error: "Usuario nao encontrado",
    });
  }

  const currentPasswordMatches = await bcrypt.compare(
    currentPassword,
    user.password
  );

  if (!currentPasswordMatches) {
    return res.status(401).json({
      error: "Senha atual incorreta",
    });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedPassword },
  });

  return res.json({
    message: "Senha atualizada com sucesso",
  });
});
