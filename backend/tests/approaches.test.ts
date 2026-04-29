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

describe("approaches roles", () => {
  it("permite USER criar abordagem", async () => {
    prismaMock.approach.create.mockResolvedValue({
      id: "approach-1",
      name: "Pessoa abordada",
      createdById: "user-1",
    });

    const response = await request(app)
      .post("/approaches")
      .set("Authorization", authHeader("USER", "user-1"))
      .send({
        name: "Pessoa abordada",
      });

    expect(response.status).toBe(201);
    expect(prismaMock.approach.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Pessoa abordada",
          createdById: "user-1",
        }),
      })
    );
  });

  it("bloqueia USER ao editar abordagem", async () => {
    const response = await request(app)
      .put("/approaches/approach-1")
      .set("Authorization", authHeader("USER", "user-1"))
      .send({
        name: "Nome alterado",
      });

    expect(response.status).toBe(403);
    expect(prismaMock.approach.update).not.toHaveBeenCalled();
  });

  it("permite SUPERVISOR editar abordagem", async () => {
    prismaMock.approach.update.mockResolvedValue({
      id: "approach-1",
      name: "Nome alterado",
      updatedById: "supervisor-1",
    });

    const response = await request(app)
      .put("/approaches/approach-1")
      .set("Authorization", authHeader("SUPERVISOR", "supervisor-1"))
      .send({
        name: "Nome alterado",
      });

    expect(response.status).toBe(200);
    expect(prismaMock.approach.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "approach-1" },
        data: expect.objectContaining({
          name: "Nome alterado",
          updatedById: "supervisor-1",
        }),
      })
    );
  });

  it.each(["ADMIN", "DEV"] as Role[])("permite %s deletar abordagem", async (role) => {
    prismaMock.approach.delete.mockResolvedValue({
      id: "approach-1",
    });

    const response = await request(app)
      .delete("/approaches/approach-1")
      .set("Authorization", authHeader(role));

    expect(response.status).toBe(204);
    expect(prismaMock.approach.delete).toHaveBeenCalledWith({
      where: { id: "approach-1" },
    });
  });
});
