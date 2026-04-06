import fs from "fs";
import path from "path";
import { Router } from "express";
import multer from "multer";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { prisma } from "../prisma/client";

export const uploadRoutes = Router();

const uploadsPath = path.resolve(process.cwd(), "uploads");
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      fs.mkdirSync(uploadsPath, { recursive: true });
      callback(null, uploadsPath);
    },
    filename: (req, _file, callback) => {
      callback(null, `avatar-${req.user.id}-${Date.now()}.png`);
    },
  }),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new Error("Apenas arquivos JPG, PNG e WEBP sao permitidos."));
      return;
    }

    callback(null, true);
  },
});

uploadRoutes.post("/avatar", ensureAuthenticated, (req, res) => {
  upload.single("avatar")(req, res, async (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          error: "Arquivo muito grande. Tamanho maximo de 2MB.",
        });
      }

      return res.status(400).json({
        error: "Falha no upload do arquivo.",
      });
    }

    if (error) {
      return res.status(400).json({
        error: error.message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "Nenhum arquivo enviado.",
      });
    }

    const avatarUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl },
    });

    return res.json({
      avatarUrl,
    });
  });
});
