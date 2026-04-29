import { Router } from "express";
import { prisma } from "../prisma/client";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { ensureRole } from "../middlewares/ensureRole";
import { ShiftType } from "@prisma/client";
import { getPagination } from "../utils/pagination";

const router = Router();

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function createScaleDates(year: number, month: number) {
  const totalDays = getDaysInMonth(year, month);
  const days: Array<{ date: Date; shiftType: ShiftType }> = [];

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(Date.UTC(year, month - 1, day));

    days.push({ date, shiftType: "DAY" });
    days.push({ date, shiftType: "NIGHT" });
  }

  return days;
}

router.post(
  "/months",
  ensureAuthenticated,
  ensureRole(["ADMIN", "DEV"]),
  async (req, res) => {
    const { month, year } = req.body as {
      month?: unknown;
      year?: unknown;
    };

    if (typeof month !== "number" || typeof year !== "number") {
      return res.status(400).json({ message: "month and year are required" });
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return res.status(400).json({ message: "month must be an integer between 1 and 12" });
    }

    if (!Number.isInteger(year) || year < 1) {
      return res.status(400).json({ message: "year must be a positive integer" });
    }

    const existingScaleMonth = await prisma.scaleMonth.findFirst({
      where: { month, year },
    });

    if (existingScaleMonth) {
      return res.status(400).json({ message: "Scale month already exists" });
    }

    const createdScaleMonth = await prisma.scaleMonth.create({
      data: {
        month,
        year,
        days: {
          create: createScaleDates(year, month),
        },
      },
    });

    const scaleMonth = await prisma.scaleMonth.findUnique({
      where: { id: createdScaleMonth.id },
      include: {
        days: {
          orderBy: [{ date: "asc" }, { shiftType: "asc" }],
        },
      },
    });

    return res.status(201).json(scaleMonth);
  }
);

router.get(
  "/months",
  ensureAuthenticated,
  ensureRole(["ADMIN", "DEV"]),
  async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, { maxLimit: 50 });

    const [scaleMonths, total] = await Promise.all([
      prisma.scaleMonth.findMany({
        orderBy: [{ year: "desc" }, { month: "desc" }],
        skip,
        take: limit,
      }),
      prisma.scaleMonth.count(),
    ]);

    return res.json({
      data: scaleMonths,
      total,
      page,
      limit,
    });
  }
);

router.get(
  "/months/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN", "DEV"]),
  async (req, res) => {
    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({ message: "Invalid id" });
    }

    const scaleMonth = await prisma.scaleMonth.findUnique({
      where: { id },
      include: {
        days: {
          orderBy: [{ date: "asc" }, { shiftType: "asc" }],
          include: {
            assignments: true,
          },
        },
      },
    });

    if (!scaleMonth) {
      return res.status(404).json({ message: "Scale month not found" });
    }

    return res.json(scaleMonth);
  }
);

router.delete(
  "/months/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN", "DEV"]),
  async (req, res) => {
    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({ message: "Invalid id" });
    }

    const scaleMonth = await prisma.scaleMonth.findUnique({
      where: { id },
    });

    if (!scaleMonth) {
      return res.status(404).json({ message: "Scale month not found" });
    }

    await prisma.scaleMonth.delete({
      where: { id },
    });

    return res.json({ message: "Scale month deleted successfully" });
  }
);

export default router;
