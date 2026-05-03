import fs from "fs";
import path from "path";
import request from "supertest";
import jwt from "jsonwebtoken";
import { afterEach, describe, expect, it } from "vitest";
import type { Role } from "@prisma/client";
import { app } from "../src/app";
import { prismaMock } from "./prismaMock";

function authHeader(role: Role, sub = `approach-image-${role.toLowerCase()}-1`) {
  const token = jwt.sign({ sub, role }, process.env.JWT_SECRET as string);

  return `Bearer ${token}`;
}

const uploadsPath = path.resolve(process.cwd(), "uploads");
const approachUploadsPath = path.join(uploadsPath, "approaches");
const testApproachImage = path.join(
  approachUploadsPath,
  "approach-image-test.png"
);
const outsideTraversalTarget = path.join(uploadsPath, "outside-traversal.png");

function ensureTestImage() {
  fs.mkdirSync(approachUploadsPath, { recursive: true });
  fs.writeFileSync(testApproachImage, Buffer.from("approach image"));
}

function cleanupTestImages() {
  fs.rmSync(testApproachImage, { force: true });
  fs.rmSync(outsideTraversalTarget, { force: true });
}

afterEach(() => {
  cleanupTestImages();
});

describe("approach image access", () => {
  it("permite usuario autenticado autorizado acessar imagem", async () => {
    ensureTestImage();
    prismaMock.approach.findUnique.mockResolvedValue({
      photoUrl: "approaches/approach-image-test.png",
    });

    const response = await request(app)
      .get("/approaches/approach-1/image")
      .set("Authorization", authHeader("USER"));

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("image/png");
    expect(prismaMock.approach.findUnique).toHaveBeenCalledWith({
      where: { id: "approach-1" },
      select: {
        photoUrl: true,
      },
    });
  });

  it("retorna 401 sem token", async () => {
    const response = await request(app).get("/approaches/approach-1/image");

    expect(response.status).toBe(401);
    expect(prismaMock.approach.findUnique).not.toHaveBeenCalled();
  });

  it("retorna 404 quando abordagem nao tem foto", async () => {
    prismaMock.approach.findUnique.mockResolvedValue({
      photoUrl: null,
    });

    const response = await request(app)
      .get("/approaches/approach-1/image")
      .set("Authorization", authHeader("USER"));

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Approach image not found");
  });

  it("retorna 404 quando arquivo nao existe", async () => {
    prismaMock.approach.findUnique.mockResolvedValue({
      photoUrl: "approaches/missing-approach-image.png",
    });

    const response = await request(app)
      .get("/approaches/approach-1/image")
      .set("Authorization", authHeader("USER"));

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Approach image not found");
  });

  it("nao serve arquivo fora da pasta de imagens por path traversal", async () => {
    fs.mkdirSync(uploadsPath, { recursive: true });
    fs.writeFileSync(outsideTraversalTarget, Buffer.from("outside file"));
    prismaMock.approach.findUnique.mockResolvedValue({
      photoUrl: "approaches/../outside-traversal.png",
    });

    const response = await request(app)
      .get("/approaches/approach-1/image")
      .set("Authorization", authHeader("USER"));

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Approach image not found");
  });
});
