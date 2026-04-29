import request from "supertest";
import bcrypt from "bcrypt";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { prismaMock } from "./prismaMock";

describe("auth", () => {
  it("retorna sucesso para login valido", async () => {
    const hashedPassword = await bcrypt.hash("senha123", 10);

    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      name: "Usuario Teste",
      email: "user@email.com",
      password: hashedPassword,
      role: "USER",
      status: "ACTIVE",
      emailVerified: true,
    });

    const response = await request(app)
      .post("/auth/login")
      .set("x-skip-rate-limit", "1")
      .send({
        email: "user@email.com",
        password: "senha123",
      });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      id: "user-1",
      email: "user@email.com",
      role: "USER",
    });
  });

  it("retorna erro para login invalido", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .post("/auth/login")
      .set("x-skip-rate-limit", "1")
      .send({
        email: "missing@email.com",
        password: "senha-errada",
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Email ou senha inválidos");
  });

  it("retorna 401 em rota protegida sem token", async () => {
    const response = await request(app).get("/profile");

    expect(response.status).toBe(401);
  });

  it("retorna 429 apos multiplas tentativas invalidas de login", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    let response = await request(app).post("/auth/login").send({
      email: "rate-limit@email.com",
      password: "senha-errada",
    });

    for (let index = 0; index < 5; index += 1) {
      response = await request(app).post("/auth/login").send({
        email: "rate-limit@email.com",
        password: "senha-errada",
      });
    }

    expect(response.status).toBe(429);
    expect(response.body.error).toBe(
      "Muitas tentativas de login. Tente novamente mais tarde."
    );
  });
});
