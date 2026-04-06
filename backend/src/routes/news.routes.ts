import { Router } from "express";
import { prisma } from "../prisma/client";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { ensureRole } from "../middlewares/ensureRole";
import { generateSlug } from "../utils/slug";

export const newsRoutes = Router();

newsRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  async (req, res) => {
    const { title, content, imageUrl, published } = req.body as {
      title?: unknown;
      content?: unknown;
      imageUrl?: unknown;
      published?: unknown;
    };

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Campo title é obrigatório" });
    }

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "Campo content é obrigatório" });
    }

    if (imageUrl !== undefined && typeof imageUrl !== "string") {
      return res.status(400).json({ error: "Campo imageUrl inválido" });
    }

    if (published !== undefined && typeof published !== "boolean") {
      return res.status(400).json({ error: "Campo published deve ser boolean" });
    }

    const slug = generateSlug(title);

    const existing = await prisma.news.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existing) {
      return res.status(409).json({ error: "Já existe uma notícia com este slug" });
    }

    const news = await prisma.news.create({
      data: {
        title: title.trim(),
        slug,
        content: content.trim(),
        imageUrl: imageUrl?.trim() || null,
        published: published ?? false,
      },
    });

    return res.status(201).json(news);
  }
);

newsRoutes.get("/", async (req, res) => {
  const news = await prisma.news.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return res.json(news);
});

newsRoutes.get("/:slug", async (req, res) => {
  const { slug } = req.params;

  const news = await prisma.news.findUnique({
    where: { slug },
  });

  if (!news) {
    return res.status(404).json({ error: "Notícia não encontrada" });
  }

  return res.json(news);
});

newsRoutes.put(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  async (req, res) => {
    const { id } = req.params;
    const { title, content, imageUrl, published } = req.body as {
      title?: unknown;
      content?: unknown;
      imageUrl?: unknown;
      published?: unknown;
    };

    const data: {
      title?: string;
      slug?: string;
      content?: string;
      imageUrl?: string | null;
      published?: boolean;
    } = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "Campo title inválido" });
      }
      data.title = title.trim();
      data.slug = generateSlug(title);
    }

    if (content !== undefined) {
      if (typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ error: "Campo content inválido" });
      }
      data.content = content.trim();
    }

    if (imageUrl !== undefined) {
      if (imageUrl !== null && typeof imageUrl !== "string") {
        return res.status(400).json({ error: "Campo imageUrl inválido" });
      }
      data.imageUrl = imageUrl === null ? null : imageUrl?.trim() || null;
    }

    if (published !== undefined) {
      if (typeof published !== "boolean") {
        return res.status(400).json({ error: "Campo published deve ser boolean" });
      }
      data.published = published;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "Envie ao menos um campo para atualizar" });
    }

    if (data.slug) {
      const existing = await prisma.news.findFirst({
        where: {
          slug: data.slug,
          NOT: { id },
        },
        select: { id: true },
      });

      if (existing) {
        return res.status(409).json({ error: "Já existe uma notícia com este slug" });
      }
    }

    const updatedNews = await prisma.news.update({
      where: { id },
      data,
    });

    return res.json(updatedNews);
  }
);

newsRoutes.delete(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  async (req, res) => {
    const { id } = req.params;

    await prisma.news.delete({
      where: { id },
    });

    return res.status(204).send();
  }
);
