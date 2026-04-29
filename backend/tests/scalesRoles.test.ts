import request from "supertest";
import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import type { Role } from "@prisma/client";
import { app } from "../src/app";
import { prismaMock } from "./prismaMock";

function authHeader(role: Role, sub = `${role.toLowerCase()}-1`) {
  const token = jwt.sign({ sub, role }, process.env.JWT_SECRET as string);

  return `Bearer ${token}`;
}

const allowedScaleRoles: Role[] = ["ADMIN", "DEV"];
const blockedScaleRoles: Role[] = ["USER", "SUPERVISOR"];

function teamPayload() {
  return {
    teamName: "A",
    initialCycle: "DAY",
    supervisorName: "Supervisor Teste",
    radioOperatorName: "Radio Teste",
    members: ["Integrante Teste"],
  };
}

function overridePayload() {
  return {
    teamName: "A",
    personKey: "member-1",
    day: 1,
    value: "DAY",
  };
}

describe("scales roles", () => {
  it.each(allowedScaleRoles)("permite %s acessar GET /scales/months", async (role) => {
    prismaMock.scaleMonth.findMany.mockResolvedValue([]);
    prismaMock.scaleMonth.count.mockResolvedValue(0);

    const response = await request(app)
      .get("/scales/months")
      .set("Authorization", authHeader(role));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      data: [],
      total: 0,
    });
  });

  it.each(blockedScaleRoles)("bloqueia %s em GET /scales/months", async (role) => {
    const response = await request(app)
      .get("/scales/months")
      .set("Authorization", authHeader(role));

    expect(response.status).toBe(403);
    expect(prismaMock.scaleMonth.findMany).not.toHaveBeenCalled();
  });

  it.each(allowedScaleRoles)("permite %s criar mes de escala", async (role) => {
    prismaMock.scaleMonth.findFirst.mockResolvedValue(null);
    prismaMock.scaleMonth.create.mockResolvedValue({
      id: "scale-month-1",
      month: 1,
      year: 2026,
    });
    prismaMock.scaleMonth.findUnique.mockResolvedValue({
      id: "scale-month-1",
      month: 1,
      year: 2026,
      days: [],
    });

    const response = await request(app)
      .post("/scales/months")
      .set("Authorization", authHeader(role))
      .send({
        month: 1,
        year: 2026,
      });

    expect(response.status).toBe(201);
    expect(prismaMock.scaleMonth.create).toHaveBeenCalled();
  });

  it.each(blockedScaleRoles)("bloqueia %s em POST /scales/months", async (role) => {
    const response = await request(app)
      .post("/scales/months")
      .set("Authorization", authHeader(role))
      .send({
        month: 1,
        year: 2026,
      });

    expect(response.status).toBe(403);
    expect(prismaMock.scaleMonth.create).not.toHaveBeenCalled();
  });

  it.each(allowedScaleRoles)(
    "permite %s acessar GET /scales/:scaleMonthId/teams",
    async (role) => {
      prismaMock.scaleTeamConfig.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get("/scales/scale-month-1/teams")
        .set("Authorization", authHeader(role));

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    }
  );

  it.each(blockedScaleRoles)(
    "bloqueia %s em GET /scales/:scaleMonthId/teams",
    async (role) => {
      const response = await request(app)
        .get("/scales/scale-month-1/teams")
        .set("Authorization", authHeader(role));

      expect(response.status).toBe(403);
      expect(prismaMock.scaleTeamConfig.findMany).not.toHaveBeenCalled();
    }
  );

  it.each(allowedScaleRoles)(
    "permite %s criar configuracao de equipe",
    async (role) => {
      prismaMock.scaleMonth.findUnique.mockResolvedValue({
        id: "scale-month-1",
      });
      prismaMock.scaleTeamConfig.findFirst.mockResolvedValue(null);
      prismaMock.scaleTeamConfig.create.mockResolvedValue({
        id: "team-config-1",
        scaleMonthId: "scale-month-1",
        ...teamPayload(),
        members: [{ id: "member-1", name: "Integrante Teste" }],
      });

      const response = await request(app)
        .post("/scales/scale-month-1/teams")
        .set("Authorization", authHeader(role))
        .send(teamPayload());

      expect(response.status).toBe(201);
      expect(prismaMock.scaleTeamConfig.create).toHaveBeenCalled();
    }
  );

  it.each(blockedScaleRoles)(
    "bloqueia %s em POST /scales/:scaleMonthId/teams",
    async (role) => {
      const response = await request(app)
        .post("/scales/scale-month-1/teams")
        .set("Authorization", authHeader(role))
        .send(teamPayload());

      expect(response.status).toBe(403);
      expect(prismaMock.scaleTeamConfig.create).not.toHaveBeenCalled();
    }
  );

  it.each(allowedScaleRoles)(
    "permite %s acessar GET /scales/:scaleMonthId/overrides",
    async (role) => {
      prismaMock.scaleCellOverride.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get("/scales/scale-month-1/overrides")
        .set("Authorization", authHeader(role));

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    }
  );

  it.each(blockedScaleRoles)(
    "bloqueia %s em GET /scales/:scaleMonthId/overrides",
    async (role) => {
      const response = await request(app)
        .get("/scales/scale-month-1/overrides")
        .set("Authorization", authHeader(role));

      expect(response.status).toBe(403);
      expect(prismaMock.scaleCellOverride.findMany).not.toHaveBeenCalled();
    }
  );

  it.each(allowedScaleRoles)(
    "permite %s criar override de escala",
    async (role) => {
      prismaMock.scaleMonth.findUnique.mockResolvedValue({
        id: "scale-month-1",
      });
      prismaMock.scaleCellOverride.upsert.mockResolvedValue({
        id: "override-1",
        scaleMonthId: "scale-month-1",
        ...overridePayload(),
      });

      const response = await request(app)
        .post("/scales/scale-month-1/overrides")
        .set("Authorization", authHeader(role))
        .send(overridePayload());

      expect(response.status).toBe(201);
      expect(prismaMock.scaleCellOverride.upsert).toHaveBeenCalled();
    }
  );

  it.each(blockedScaleRoles)(
    "bloqueia %s em POST /scales/:scaleMonthId/overrides",
    async (role) => {
      const response = await request(app)
        .post("/scales/scale-month-1/overrides")
        .set("Authorization", authHeader(role))
        .send(overridePayload());

      expect(response.status).toBe(403);
      expect(prismaMock.scaleCellOverride.upsert).not.toHaveBeenCalled();
    }
  );

  it.each(allowedScaleRoles)("permite %s editar override", async (role) => {
    prismaMock.scaleCellOverride.update.mockResolvedValue({
      id: "override-1",
      value: "OFF",
    });

    const response = await request(app)
      .put("/scales/overrides/override-1")
      .set("Authorization", authHeader(role))
      .send({
        value: "OFF",
      });

    expect(response.status).toBe(200);
    expect(prismaMock.scaleCellOverride.update).toHaveBeenCalled();
  });

  it.each(blockedScaleRoles)("bloqueia %s em PUT /scales/overrides/:id", async (role) => {
    const response = await request(app)
      .put("/scales/overrides/override-1")
      .set("Authorization", authHeader(role))
      .send({
        value: "OFF",
      });

    expect(response.status).toBe(403);
    expect(prismaMock.scaleCellOverride.update).not.toHaveBeenCalled();
  });

  it.each(allowedScaleRoles)("permite %s deletar override", async (role) => {
    prismaMock.scaleCellOverride.delete.mockResolvedValue({
      id: "override-1",
    });

    const response = await request(app)
      .delete("/scales/overrides/override-1")
      .set("Authorization", authHeader(role));

    expect(response.status).toBe(204);
    expect(prismaMock.scaleCellOverride.delete).toHaveBeenCalled();
  });

  it.each(blockedScaleRoles)(
    "bloqueia %s em DELETE /scales/overrides/:id",
    async (role) => {
      const response = await request(app)
        .delete("/scales/overrides/override-1")
        .set("Authorization", authHeader(role));

      expect(response.status).toBe(403);
      expect(prismaMock.scaleCellOverride.delete).not.toHaveBeenCalled();
    }
  );
});
