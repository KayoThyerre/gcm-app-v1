import fs from "fs";
import path from "path";
import { Router } from "express";
import multer from "multer";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";

export const uploadNewsRoutes = Router();

const newsUploadsPath = path.resolve(process.cwd(), "uploads", "news");
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const extensionMap: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      fs.mkdirSync(newsUploadsPath, { recursive: true });
      callback(null, newsUploadsPath);
    },
    filename: (req, file, callback) => {
      const ext = extensionMap[file.mimetype] || "png";
      callback(null, `news-${req.user.id}-${Date.now()}.${ext}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new Error("Apenas arquivos JPG, PNG e WEBP são permitidos."));
      return;
    }

    callback(null, true);
  },
});

uploadNewsRoutes.post(
  "/",
  ensureAuthenticated,
  (req, res) => {
    upload.single("image")(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "Arquivo muito grande. Tamanho máximo de 5MB." });
        }

        return res.status(400).json({ error: "Falha no upload do arquivo." });
      }

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado." });
      }

      const url = `${req.protocol}://${req.get("host")}/uploads/news/${req.file.filename}`;

      return res.json({ url });
    });
  }
);
