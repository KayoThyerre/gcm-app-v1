import { Router } from "express";
import { prisma } from "../prisma/client";
import bcrypt from "bcrypt";
import { Status } from "@prisma/client";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { ensureRole } from "../middlewares/ensureRole";
import { FIELD_LIMITS, validateMaxLength } from "../utils/validation";

export const usersRoutes = Router();

usersRoutes.get(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  async (req, res) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return res.json(users);
  }
);

usersRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      error: "Name, email e password são obrigatórios",
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
      error: "Usuário já existe",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role || "USER",
      status: "PENDING",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  return res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
});

usersRoutes.patch(
  "/:id/status",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (typeof id !== "string") {
      return res.status(400).json({
        error: "ID inválido",
      });
    }

    if (
      typeof status !== "string" ||
      !Object.values(Status).includes(status as Status)
    ) {
      return res.status(400).json({
        error: "Status inválido",
      });
    }

    const userExists = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
      },
    });

    if (!userExists) {
      return res.status(404).json({
        error: "Usuário não encontrado",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status: status as Status,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return res.json(updatedUser);
  }
);
