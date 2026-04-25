import fs from "fs";
import path from "path";
import { Router } from "express";
import multer from "multer";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { ensureRole } from "../middlewares/ensureRole";

export const uploadApproachRoutes = Router();
const UPLOAD_APPROACH_ROLES = ["USER", "SUPERVISOR", "ADMIN", "DEV"] as const;

const approachUploadsPath = path.resolve(process.cwd(), "uploads", "approaches");
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const extensionMap: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      fs.mkdirSync(approachUploadsPath, { recursive: true });
      callback(null, approachUploadsPath);
    },
    filename: (req, file, callback) => {
      const ext = extensionMap[file.mimetype] || "png";
      callback(null, `approach-${req.user.id}-${Date.now()}.${ext}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new Error("Apenas arquivos JPG, PNG e WEBP sao permitidos."));
      return;
    }

    callback(null, true);
  },
});

uploadApproachRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole([...UPLOAD_APPROACH_ROLES]),
  (req, res) => {
    upload.single("image")(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: "Arquivo muito grande. Tamanho maximo de 5MB.",
          });
        }

        return res.status(400).json({
          error: "Falha no upload do arquivo.",
        });
      }

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado." });
      }

      const url = `approaches/${req.file.filename}`;

      return res.json({ url });
    });
  }
);
