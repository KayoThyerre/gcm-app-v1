import { Router } from "express";
import { InitialCycle } from "@prisma/client";
import { prisma } from "../prisma/client";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { ensureRole } from "../middlewares/ensureRole";

const router = Router();
const allowedTeamNames = new Set(["A", "B", "C", "D"]);
const allowedInitialCycles = new Set<InitialCycle>([
  "DAY",
  "NIGHT_START",
  "NIGHT_END",
  "OFF",
]);

function parseMembers(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const members = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  if (members.length !== value.length) {
    return null;
  }

  return members;
}

router.post(
  "/:scaleMonthId/teams",
  ensureAuthenticated,
  ensureRole(["ADMIN", "DEV"]),
  async (req, res) => {
    const { scaleMonthId } = req.params;

    if (typeof scaleMonthId !== "string") {
      return res.status(400).json({ message: "Invalid scaleMonthId" });
    }

    const {
      teamName,
      initialCycle,
      supervisorName,
      radioOperatorName,
      members,
    } = req.body as {
      teamName?: unknown;
      initialCycle?: unknown;
      supervisorName?: unknown;
      radioOperatorName?: unknown;
      members?: unknown;
    };

    if (typeof teamName !== "string" || !allowedTeamNames.has(teamName)) {
      return res.status(400).json({ message: "teamName must be A, B, C or D" });
    }

    if (
      typeof initialCycle !== "string" ||
      !allowedInitialCycles.has(initialCycle as InitialCycle)
    ) {
      return res.status(400).json({
        message: "initialCycle must be DAY, NIGHT_START, NIGHT_END or OFF",
      });
    }

    if (typeof supervisorName !== "string" || !supervisorName.trim()) {
      return res.status(400).json({ message: "supervisorName is required" });
    }

    if (typeof radioOperatorName !== "string" || !radioOperatorName.trim()) {
      return res.status(400).json({ message: "radioOperatorName is required" });
    }

    const parsedMembers = parseMembers(members);

    if (parsedMembers === null) {
      return res.status(400).json({ message: "members must be an array of strings" });
    }

    const scaleMonth = await prisma.scaleMonth.findUnique({
      where: { id: scaleMonthId },
    });

    if (!scaleMonth) {
      return res.status(404).json({ message: "Scale month not found" });
    }

    const existingTeamName = await prisma.scaleTeamConfig.findFirst({
      where: { scaleMonthId, teamName },
    });

    if (existingTeamName) {
      return res.status(400).json({ message: "Team already configured for this month" });
    }

    const existingInitialCycle = await prisma.scaleTeamConfig.findFirst({
      where: {
        scaleMonthId,
        initialCycle: initialCycle as InitialCycle,
      },
    });

    if (existingInitialCycle) {
      return res.status(400).json({ message: "Initial cycle already in use for this month" });
    }

    const teamConfig = await prisma.scaleTeamConfig.create({
      data: {
        scaleMonthId,
        teamName,
        initialCycle: initialCycle as InitialCycle,
        supervisorName: supervisorName.trim(),
        radioOperatorName: radioOperatorName.trim(),
        members: {
          create: parsedMembers.map((name) => ({ name })),
        },
      },
      include: {
        members: true,
      },
    });

    return res.status(201).json(teamConfig);
  }
);

router.get(
  "/:scaleMonthId/teams",
  ensureAuthenticated,
  ensureRole(["ADMIN", "DEV"]),
  async (req, res) => {
    const { scaleMonthId } = req.params;

    if (typeof scaleMonthId !== "string") {
      return res.status(400).json({ message: "Invalid scaleMonthId" });
    }

    const teamConfigs = await prisma.scaleTeamConfig.findMany({
      where: { scaleMonthId },
      include: {
        members: true,
      },
      orderBy: { teamName: "asc" },
    });

    return res.json(teamConfigs);
  }
);

router.put(
  "/:teamConfigId",
  ensureAuthenticated,
  ensureRole(["ADMIN", "DEV"]),
  async (req, res) => {
    const { teamConfigId } = req.params;

    if (typeof teamConfigId !== "string") {
      return res.status(400).json({ message: "Invalid teamConfigId" });
    }

    const {
      initialCycle,
      supervisorName,
      radioOperatorName,
      members,
    } = req.body as {
      initialCycle?: unknown;
      supervisorName?: unknown;
      radioOperatorName?: unknown;
      members?: unknown;
    };

    if (
      typeof initialCycle !== "string" ||
      !allowedInitialCycles.has(initialCycle as InitialCycle)
    ) {
      return res.status(400).json({
        message: "initialCycle must be DAY, NIGHT_START, NIGHT_END or OFF",
      });
    }

    if (typeof supervisorName !== "string" || !supervisorName.trim()) {
      return res.status(400).json({ message: "supervisorName is required" });
    }

    if (typeof radioOperatorName !== "string" || !radioOperatorName.trim()) {
      return res.status(400).json({ message: "radioOperatorName is required" });
    }

    const parsedMembers = parseMembers(members);

    if (parsedMembers === null) {
      return res.status(400).json({ message: "members must be an array of strings" });
    }

    const existingTeamConfig = await prisma.scaleTeamConfig.findUnique({
      where: { id: teamConfigId },
    });

    if (!existingTeamConfig) {
      return res.status(404).json({ message: "Team config not found" });
    }

    const duplicatedInitialCycle = await prisma.scaleTeamConfig.findFirst({
      where: {
        scaleMonthId: existingTeamConfig.scaleMonthId,
        initialCycle: initialCycle as InitialCycle,
        id: { not: teamConfigId },
      },
    });

    if (duplicatedInitialCycle) {
      return res.status(400).json({ message: "Initial cycle already in use for this month" });
    }

    const teamConfig = await prisma.scaleTeamConfig.update({
      where: { id: teamConfigId },
      data: {
        initialCycle: initialCycle as InitialCycle,
        supervisorName: supervisorName.trim(),
        radioOperatorName: radioOperatorName.trim(),
        members: {
          deleteMany: {},
          create: parsedMembers.map((name) => ({ name })),
        },
      },
      include: {
        members: true,
      },
    });

    return res.json(teamConfig);
  }
);

export default router;
