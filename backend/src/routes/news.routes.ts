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

    if (typeof title !== "string" || !title.trim() || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    if (imageUrl !== undefined && typeof imageUrl !== "string") {
      return res.status(400).json({ message: "imageUrl must be a string" });
    }

    if (published !== undefined && typeof published !== "boolean") {
      return res.status(400).json({ message: "published must be boolean" });
    }

    const slug = generateSlug(title);

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
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const safePage = page < 1 ? 1 : page;
  const safeLimit = limit < 1 ? 10 : limit;

  const [total, news] = await Promise.all([
    prisma.news.count({ where: { published: true } }),
    prisma.news.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    }),
  ]);

  return res.json({
    total,
    page: safePage,
    limit: safeLimit,
    data: news,
  });
});

newsRoutes.get("/:id", async (req, res) => {
  const { id } = req.params;

  const news = await prisma.news.findUnique({
    where: { id },
  });

  if (!news) {
    return res.status(404).json({ message: "News not found" });
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
        return res.status(400).json({ message: "Title and content are required" });
      }
      data.title = title.trim();
      data.slug = generateSlug(title);
    }

    if (content !== undefined) {
      if (typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ message: "Title and content are required" });
      }
      data.content = content.trim();
    }

    if (imageUrl !== undefined) {
      if (imageUrl !== null && typeof imageUrl !== "string") {
        return res.status(400).json({ message: "imageUrl must be a string or null" });
      }
      data.imageUrl = imageUrl === null ? null : imageUrl?.trim() || null;
    }

    if (published !== undefined) {
      if (typeof published !== "boolean") {
        return res.status(400).json({ message: "published must be boolean" });
      }
      data.published = published;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    try {
      const updatedNews = await prisma.news.update({
        where: { id },
        data,
      });

      return res.json(updatedNews);
    } catch (error) {
      return res.status(404).json({ message: "News not found" });
    }
  }
);

newsRoutes.delete(
  "/:id",
  ensureAuthenticated,
  ensureRole(["ADMIN"]),
  async (req, res) => {
    const { id } = req.params;

    try {
      await prisma.news.delete({
        where: { id },
      });
    } catch (error) {
      return res.status(404).json({ message: "News not found" });
    }

    return res.status(204).send();
  }
);
