import { Router } from "express";
import { prisma } from "../prisma/client";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { ensureRole } from "../middlewares/ensureRole";

const router = Router();

router.post(
  "/",
  ensureAuthenticated,
  async (req, res) => {
    const {
      name,
      cpf,
      rg,
      birthDate,
      motherName,
      notes,
      isConvicted,
      photoUrl,
    } = req.body as {
      name?: unknown;
      cpf?: unknown;
      rg?: unknown;
      birthDate?: unknown;
      motherName?: unknown;
      notes?: unknown;
      isConvicted?: unknown;
      photoUrl?: unknown;
    };

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "name is required" });
    }

    if (cpf !== undefined && typeof cpf !== "string") {
      return res.status(400).json({ message: "cpf must be a string" });
    }

    if (rg !== undefined && typeof rg !== "string") {
      return res.status(400).json({ message: "rg must be a string" });
    }

    if (motherName !== undefined && typeof motherName !== "string") {
      return res.status(400).json({ message: "motherName must be a string" });
    }

    if (notes !== undefined && typeof notes !== "string") {
      return res.status(400).json({ message: "notes must be a string" });
    }

    if (photoUrl !== undefined && typeof photoUrl !== "string") {
      return res.status(400).json({ message: "photoUrl must be a string" });
    }

    if (isConvicted !== undefined && typeof isConvicted !== "boolean") {
      return res.status(400).json({ message: "isConvicted must be boolean" });
    }

    let parsedBirthDate: Date | null | undefined;

    if (birthDate !== undefined) {
      if (typeof birthDate !== "string") {
        return res.status(400).json({ message: "birthDate must be a string" });
      }

      if (!birthDate.trim()) {
        parsedBirthDate = null;
      } else {
        parsedBirthDate = new Date(birthDate);

        if (Number.isNaN(parsedBirthDate.getTime())) {
          return res.status(400).json({ message: "birthDate is invalid" });
        }
      }
    }

    const approach = await prisma.approach.create({
      data: {
        name: name.trim(),
        cpf: typeof cpf === "string" ? cpf.trim() || null : undefined,
        rg: typeof rg === "string" ? rg.trim() || null : undefined,
        birthDate: parsedBirthDate,
        motherName:
          typeof motherName === "string" ? motherName.trim() || null : undefined,
        notes: typeof notes === "string" ? notes.trim() || null : undefined,
        isConvicted: typeof isConvicted === "boolean" ? isConvicted : false,
        photoUrl: typeof photoUrl === "string" ? photoUrl.trim() || null : undefined,
        createdById: req.user.id,
      },
    });

    return res.status(201).json(approach);
  }
);

router.get(
  "/",
  ensureAuthenticated,
  async (req, res) => {
    const approaches = await prisma.approach.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.json(approaches);
  }
);

router.put(
  "/:id",
  ensureAuthenticated,
  ensureRole(["SUPERVISOR", "ADMIN", "DEV"]),
  async (req, res) => {
    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({ message: "Invalid id" });
    }

    const {
      name,
      cpf,
      rg,
      birthDate,
      motherName,
      notes,
      isConvicted,
      photoUrl,
    } = req.body as {
      name?: unknown;
      cpf?: unknown;
      rg?: unknown;
      birthDate?: unknown;
      motherName?: unknown;
      notes?: unknown;
      isConvicted?: unknown;
      photoUrl?: unknown;
    };

    const data: {
      name?: string;
      cpf?: string | null;
      rg?: string | null;
      birthDate?: Date | null;
      motherName?: string | null;
      notes?: string | null;
      isConvicted?: boolean;
      photoUrl?: string | null;
      updatedById: string;
    } = {
      updatedById: req.user.id,
    };

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "name is required" });
      }
      data.name = name.trim();
    }

    if (cpf !== undefined) {
      if (typeof cpf !== "string") {
        return res.status(400).json({ message: "cpf must be a string" });
      }
      data.cpf = cpf.trim() || null;
    }

    if (rg !== undefined) {
      if (typeof rg !== "string") {
        return res.status(400).json({ message: "rg must be a string" });
      }
      data.rg = rg.trim() || null;
    }

    if (motherName !== undefined) {
      if (typeof motherName !== "string") {
        return res.status(400).json({ message: "motherName must be a string" });
      }
      data.motherName = motherName.trim() || null;
    }

    if (notes !== undefined) {
      if (typeof notes !== "string") {
        return res.status(400).json({ message: "notes must be a string" });
      }
      data.notes = notes.trim() || null;
    }

    if (photoUrl !== undefined) {
      if (typeof photoUrl !== "string") {
        return res.status(400).json({ message: "photoUrl must be a string" });
      }
      data.photoUrl = photoUrl.trim() || null;
    }

    if (isConvicted !== undefined) {
      if (typeof isConvicted !== "boolean") {
        return res.status(400).json({ message: "isConvicted must be boolean" });
      }
      data.isConvicted = isConvicted;
    }

    if (birthDate !== undefined) {
      if (typeof birthDate !== "string") {
        return res.status(400).json({ message: "birthDate must be a string" });
      }

      if (!birthDate.trim()) {
        data.birthDate = null;
      } else {
        const parsedBirthDate = new Date(birthDate);

        if (Number.isNaN(parsedBirthDate.getTime())) {
          return res.status(400).json({ message: "birthDate is invalid" });
        }

        data.birthDate = parsedBirthDate;
      }
    }

    if (Object.keys(data).length === 1) {
      return res.status(400).json({ message: "No data provided" });
    }

    try {
      const approach = await prisma.approach.update({
        where: { id },
        data,
      });

      return res.json(approach);
    } catch {
      return res.status(404).json({ message: "Approach not found" });
    }
  }
);

router.delete(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN", "DEV"]),
  async (req, res) => {
    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({ message: "Invalid id" });
    }

    try {
      await prisma.approach.delete({
        where: { id },
      });
    } catch {
      return res.status(404).json({ message: "Approach not found" });
    }

    return res.status(204).send();
  }
);

export default router;
