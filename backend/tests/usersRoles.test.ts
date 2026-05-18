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

describe("users roles", () => {
  it.each(["ADMIN", "DEV"] as Role[])("permite %s listar usuarios", async (role) => {
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.user.count.mockResolvedValue(0);

    const response = await request(app)
      .get("/users")
      .set("Authorization", authHeader(role));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      data: [],
      total: 0,
    });
    expect(prismaMock.user.findMany).toHaveBeenCalled();
  });

  it.each(["USER", "SUPERVISOR"] as Role[])(
    "bloqueia %s ao listar usuarios",
    async (role) => {
      const response = await request(app)
        .get("/users")
        .set("Authorization", authHeader(role));

      expect(response.status).toBe(403);
      expect(prismaMock.user.findMany).not.toHaveBeenCalled();
    }
  );

  it.each(["ADMIN", "DEV"] as Role[])(
    "permite %s atualizar status de usuario",
    async (role) => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: "user-1",
      });
      prismaMock.user.update.mockResolvedValue({
        id: "user-1",
        name: "Usuario Teste",
        email: "user@email.com",
        role: "USER",
        status: "ACTIVE",
        createdAt: new Date(),
      });

      const response = await request(app)
        .patch("/users/user-1/status")
        .set("Authorization", authHeader(role))
        .send({ status: "ACTIVE" });

      expect(response.status).toBe(200);
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-1" },
          data: { status: "ACTIVE" },
        })
      );
    }
  );

  it.each(["USER", "SUPERVISOR"] as Role[])(
    "bloqueia %s ao atualizar status de usuario",
    async (role) => {
      const response = await request(app)
        .patch("/users/user-1/status")
        .set("Authorization", authHeader(role))
        .send({ status: "ACTIVE" });

      expect(response.status).toBe(403);
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    }
  );
});
