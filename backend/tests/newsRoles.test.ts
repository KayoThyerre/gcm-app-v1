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

function newsPayload() {
  return {
    title: "Noticia de teste",
    content: "Conteudo da noticia de teste.",
    published: true,
  };
}

describe("news roles", () => {
  it("permite ADMIN acessar GET /news/admin", async () => {
    prismaMock.news.findMany.mockResolvedValue([]);
    prismaMock.news.count.mockResolvedValue(0);

    const response = await request(app)
      .get("/news/admin")
      .set("Authorization", authHeader("ADMIN"));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      data: [],
      total: 0,
    });
  });

  it.each(["USER", "SUPERVISOR", "DEV"] as Role[])(
    "bloqueia %s em GET /news/admin",
    async (role) => {
      const response = await request(app)
        .get("/news/admin")
        .set("Authorization", authHeader(role));

      expect(response.status).toBe(403);
      expect(prismaMock.news.findMany).not.toHaveBeenCalled();
    }
  );

  it("permite ADMIN criar noticia", async () => {
    prismaMock.news.create.mockResolvedValue({
      id: "news-1",
      ...newsPayload(),
      slug: "noticia-de-teste",
      imageUrl: null,
    });

    const response = await request(app)
      .post("/news")
      .set("Authorization", authHeader("ADMIN"))
      .send(newsPayload());

    expect(response.status).toBe(201);
    expect(prismaMock.news.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Noticia de teste",
          slug: "noticia-de-teste",
          published: true,
        }),
      })
    );
  });

  it.each(["USER", "SUPERVISOR", "DEV"] as Role[])(
    "bloqueia %s em POST /news",
    async (role) => {
      const response = await request(app)
        .post("/news")
        .set("Authorization", authHeader(role))
        .send(newsPayload());

      expect(response.status).toBe(403);
      expect(prismaMock.news.create).not.toHaveBeenCalled();
    }
  );

  it("permite ADMIN editar noticia", async () => {
    prismaMock.news.update.mockResolvedValue({
      id: "news-1",
      title: "Titulo atualizado",
      content: "Conteudo atualizado.",
    });

    const response = await request(app)
      .put("/news/news-1")
      .set("Authorization", authHeader("ADMIN"))
      .send({
        title: "Titulo atualizado",
      });

    expect(response.status).toBe(200);
    expect(prismaMock.news.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "news-1" },
        data: expect.objectContaining({
          title: "Titulo atualizado",
        }),
      })
    );
  });

  it("bloqueia USER em PUT /news/:id", async () => {
    const response = await request(app)
      .put("/news/news-1")
      .set("Authorization", authHeader("USER"))
      .send({
        title: "Titulo atualizado",
      });

    expect(response.status).toBe(403);
    expect(prismaMock.news.update).not.toHaveBeenCalled();
  });

  it("permite ADMIN deletar noticia", async () => {
    prismaMock.news.delete.mockResolvedValue({
      id: "news-1",
    });

    const response = await request(app)
      .delete("/news/news-1")
      .set("Authorization", authHeader("ADMIN"));

    expect(response.status).toBe(204);
    expect(prismaMock.news.delete).toHaveBeenCalledWith({
      where: { id: "news-1" },
    });
  });

  it("bloqueia USER em DELETE /news/:id", async () => {
    const response = await request(app)
      .delete("/news/news-1")
      .set("Authorization", authHeader("USER"));

    expect(response.status).toBe(403);
    expect(prismaMock.news.delete).not.toHaveBeenCalled();
  });
});
