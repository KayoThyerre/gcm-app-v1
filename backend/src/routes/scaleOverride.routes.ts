import { Router } from "express";
import { ScaleCellValue } from "@prisma/client";
import { prisma } from "../prisma/client";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { ensureRole } from "../middlewares/ensureRole";

const router = Router();
const allowedValues = new Set<ScaleCellValue>([
  "DAY",
  "NIGHT_START",
  "NIGHT_END",
  "NIGHT_FULL",
  "OFF",
  "MEDICAL_LEAVE",
  "BANK_HOURS",
  "VACATION",
]);

router.get(
  "/:scaleMonthId/overrides",
  ensureAuthenticated,
  ensureRole(["ADMIN", "DEV"]),
  async (req, res) => {
    const { scaleMonthId } = req.params;

    if (typeof scaleMonthId !== "string") {
      return res.status(400).json({ message: "Invalid scaleMonthId" });
    }

    const overrides = await prisma.scaleCellOverride.findMany({
      where: { scaleMonthId },
      orderBy: [{ day: "asc" }, { teamName: "asc" }, { personKey: "asc" }],
    });

    return res.json(overrides);
  }
);

router.post(
  "/:scaleMonthId/overrides",
  ensureAuthenticated,
  ensureRole(["ADMIN", "DEV"]),
  async (req, res) => {
    const { scaleMonthId } = req.params;

    if (typeof scaleMonthId !== "string") {
      return res.status(400).json({ message: "Invalid scaleMonthId" });
    }

    const { teamName, personKey, day, value } = req.body as {
      teamName?: unknown;
      personKey?: unknown;
      day?: unknown;
      value?: unknown;
    };

    if (typeof teamName !== "string" || !teamName.trim()) {
      return res.status(400).json({ message: "teamName is required" });
    }

    if (typeof personKey !== "string" || !personKey.trim()) {
      return res.status(400).json({ message: "personKey is required" });
    }

    if (typeof day !== "number" || !Number.isInteger(day) || day < 1 || day > 31) {
      return res.status(400).json({ message: "day must be an integer between 1 and 31" });
    }

    if (typeof value !== "string" || !allowedValues.has(value as ScaleCellValue)) {
      return res.status(400).json({
        message:
          "value must be DAY, NIGHT_START, NIGHT_END, NIGHT_FULL, OFF, MEDICAL_LEAVE, BANK_HOURS or VACATION",
      });
    }

    const scaleMonth = await prisma.scaleMonth.findUnique({
      where: { id: scaleMonthId },
      select: { id: true },
    });

    if (!scaleMonth) {
      return res.status(404).json({ message: "Scale month not found" });
    }

    const normalizedTeamName = teamName.trim();
    const normalizedPersonKey = personKey.trim();

    const override = await prisma.scaleCellOverride.upsert({
      where: {
        scaleMonthId_teamName_personKey_day: {
          scaleMonthId,
          teamName: normalizedTeamName,
          personKey: normalizedPersonKey,
          day,
        },
      },
      update: {
        value: value as ScaleCellValue,
      },
      create: {
        scaleMonthId,
        teamName: normalizedTeamName,
        personKey: normalizedPersonKey,
        day,
        value: value as ScaleCellValue,
      },
    });

    return res.status(201).json(override);
  }
);

router.put(
  "/overrides/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN", "DEV"]),
  async (req, res) => {
    const { id } = req.params;
    const { value } = req.body as {
      value?: unknown;
    };

    if (typeof id !== "string") {
      return res.status(400).json({ message: "Invalid id" });
    }

    if (typeof value !== "string" || !allowedValues.has(value as ScaleCellValue)) {
      return res.status(400).json({
        message:
          "value must be DAY, NIGHT_START, NIGHT_END, NIGHT_FULL, OFF, MEDICAL_LEAVE, BANK_HOURS or VACATION",
      });
    }

    try {
      const override = await prisma.scaleCellOverride.update({
        where: { id },
        data: {
          value: value as ScaleCellValue,
        },
      });

      return res.json(override);
    } catch {
      return res.status(404).json({ message: "Scale override not found" });
    }
  }
);

router.delete(
  "/overrides/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN", "DEV"]),
  async (req, res) => {
    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({ message: "Invalid id" });
    }

    try {
      await prisma.scaleCellOverride.delete({
        where: { id },
      });
    } catch {
      return res.status(404).json({ message: "Scale override not found" });
    }

    return res.status(204).send();
  }
);

export default router;