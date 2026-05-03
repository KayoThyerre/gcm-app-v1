import fs from "fs";
import path from "path";
import request from "supertest";
import jwt from "jsonwebtoken";
import { afterEach, describe, expect, it } from "vitest";
import type { Role } from "@prisma/client";
import { app } from "../src/app";
import { prismaMock } from "./prismaMock";

function authHeader(role: Role, sub = `upload-${role.toLowerCase()}-1`) {
  const token = jwt.sign({ sub, role }, process.env.JWT_SECRET as string);

  return `Bearer ${token}`;
}

const uploadsPath = path.resolve(process.cwd(), "uploads");
const newsUploadsPath = path.join(uploadsPath, "news");
const approachUploadsPath = path.join(uploadsPath, "approaches");
const validImage = Buffer.from("valid test image");
const invalidText = Buffer.from("not an image");

function cleanupTestUploads() {
  const cleanupTargets = [
    { directory: uploadsPath, prefixes: ["avatar-upload-"] },
    { directory: newsUploadsPath, prefixes: ["news-upload-"] },
    { directory: approachUploadsPath, prefixes: ["approach-upload-"] },
  ];

  cleanupTargets.forEach(({ directory, prefixes }) => {
    if (!fs.existsSync(directory)) {
      return;
    }

    fs.readdirSync(directory).forEach((filename) => {
      if (!prefixes.some((prefix) => filename.startsWith(prefix))) {
        return;
      }

      fs.rmSync(path.join(directory, filename), { force: true });
    });
  });
}

afterEach(() => {
  cleanupTestUploads();
});

describe("uploads", () => {
  describe("avatar upload", () => {
    it("permite usuario autenticado enviar avatar", async () => {
      prismaMock.user.update.mockResolvedValue({
        id: "upload-avatar-user",
        avatarUrl: "avatar-url",
      });

      const response = await request(app)
        .post("/upload/avatar")
        .set("Authorization", authHeader("USER", "upload-avatar-user"))
        .attach("avatar", validImage, {
          filename: "avatar.png",
          contentType: "image/png",
        });

      expect(response.status).toBe(200);
      expect(response.body.avatarUrl).toEqual(
        expect.stringContaining("/uploads/avatar-upload-avatar-user-")
      );
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "upload-avatar-user" },
          data: {
            avatarUrl: expect.stringContaining(
              "/uploads/avatar-upload-avatar-user-"
            ),
          },
        })
      );
    });

    it("retorna 401 sem token", async () => {
      const response = await request(app)
        .post("/upload/avatar")
        .attach("avatar", validImage, {
          filename: "avatar.png",
          contentType: "image/png",
        });

      expect(response.status).toBe(401);
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it("falha com MIME invalido", async () => {
      const response = await request(app)
        .post("/upload/avatar")
        .set("Authorization", authHeader("USER", "upload-avatar-user"))
        .attach("avatar", invalidText, {
          filename: "avatar.txt",
          contentType: "text/plain",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "Apenas arquivos JPG, PNG e WEBP sao permitidos."
      );
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it("falha quando excede o limite de tamanho", async () => {
      const response = await request(app)
        .post("/upload/avatar")
        .set("Authorization", authHeader("USER", "upload-avatar-user"))
        .attach("avatar", Buffer.alloc(2 * 1024 * 1024 + 1), {
          filename: "avatar.png",
          contentType: "image/png",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "Arquivo muito grande. Tamanho maximo de 2MB."
      );
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
  });

  describe("news upload", () => {
    it("permite ADMIN enviar imagem de noticia", async () => {
      const response = await request(app)
        .post("/upload/news")
        .set("Authorization", authHeader("ADMIN", "upload-news-admin"))
        .attach("image", validImage, {
          filename: "news.png",
          contentType: "image/png",
        });

      expect(response.status).toBe(200);
      expect(response.body.url).toEqual(
        expect.stringContaining("/uploads/news/news-upload-news-admin-")
      );
    });

    it("permite USER enviar imagem de noticia pela regra atual", async () => {
      const response = await request(app)
        .post("/upload/news")
        .set("Authorization", authHeader("USER", "upload-news-user"))
        .attach("image", validImage, {
          filename: "news.png",
          contentType: "image/png",
        });

      expect(response.status).toBe(200);
      expect(response.body.url).toEqual(
        expect.stringContaining("/uploads/news/news-upload-news-user-")
      );
    });

    it("falha com MIME invalido", async () => {
      const response = await request(app)
        .post("/upload/news")
        .set("Authorization", authHeader("ADMIN", "upload-news-admin"))
        .attach("image", invalidText, {
          filename: "news.txt",
          contentType: "text/plain",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "Apenas arquivos JPG, PNG e WEBP são permitidos."
      );
    });

    it("falha quando excede o limite de tamanho", async () => {
      const response = await request(app)
        .post("/upload/news")
        .set("Authorization", authHeader("ADMIN", "upload-news-admin"))
        .attach("image", Buffer.alloc(5 * 1024 * 1024 + 1), {
          filename: "news.png",
          contentType: "image/png",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "Arquivo muito grande. Tamanho máximo de 5MB."
      );
    });
  });

  describe("approach upload", () => {
    it.each(["USER", "SUPERVISOR", "ADMIN", "DEV"] as Role[])(
      "permite %s enviar imagem de abordagem",
      async (role) => {
        const response = await request(app)
          .post("/upload/approach")
          .set("Authorization", authHeader(role, `upload-approach-${role.toLowerCase()}`))
          .attach("image", validImage, {
            filename: "approach.png",
            contentType: "image/png",
          });

        expect(response.status).toBe(200);
        expect(response.body.url).toEqual(
          expect.stringContaining(
            `approaches/approach-upload-approach-${role.toLowerCase()}-`
          )
        );
      }
    );

    it("retorna 401 sem token", async () => {
      const response = await request(app)
        .post("/upload/approach")
        .attach("image", validImage, {
          filename: "approach.png",
          contentType: "image/png",
        });

      expect(response.status).toBe(401);
    });

    it("falha com MIME invalido", async () => {
      const response = await request(app)
        .post("/upload/approach")
        .set("Authorization", authHeader("USER", "upload-approach-user"))
        .attach("image", invalidText, {
          filename: "approach.txt",
          contentType: "text/plain",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "Apenas arquivos JPG, PNG e WEBP sao permitidos."
      );
    });

    it("falha quando excede o limite de tamanho", async () => {
      const response = await request(app)
        .post("/upload/approach")
        .set("Authorization", authHeader("USER", "upload-approach-user"))
        .attach("image", Buffer.alloc(5 * 1024 * 1024 + 1), {
          filename: "approach.png",
          contentType: "image/png",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "Arquivo muito grande. Tamanho maximo de 5MB."
      );
    });
  });
});
