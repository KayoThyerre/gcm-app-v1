import "dotenv/config";
import path from "path";
import express from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler";
import { usersRoutes } from "./routes/users.routes";
import { authRoutes } from "./routes/auth.routes";
import { profileRoutes } from "./routes/profile.routes";
import { uploadRoutes } from "./routes/upload.routes";
import { uploadNewsRoutes } from "./routes/uploadNews.routes";
import { uploadApproachRoutes } from "./routes/uploadApproach.routes";
import { newsRoutes } from "./routes/news.routes";
import approachRoutes from "./routes/approach.routes";
import scaleRoutes from "./routes/scale.routes";
import scaleTeamConfigRoutes from "./routes/scaleTeamConfig.routes";
import scaleOverrideRoutes from "./routes/scaleOverride.routes";

const app = express();
const uploadsPath = path.resolve(process.cwd(), "uploads");
const newsUploadsPath = path.join(uploadsPath, "news");
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
const PORT = Number(process.env.PORT) || 3333;

app.use(
  cors({
    origin: corsOrigin,
  })
);
app.use(express.json());
app.use("/uploads/news", express.static(newsUploadsPath));
app.get("/uploads/:filename", (req, res) => {
  const { filename } = req.params;

  if (!filename.startsWith("avatar-") || filename !== path.basename(filename)) {
    return res.status(404).json({ error: "Arquivo nao encontrado" });
  }

  return res.sendFile(path.join(uploadsPath, filename), (error) => {
    if (error && !res.headersSent) {
      return res.status(404).json({ error: "Arquivo nao encontrado" });
    }
  });
});

app.get("/health", (req, res) => {
  return res.json({
    status: "ok",
    uptime: process.uptime(),
  });
});

app.use("/users", usersRoutes);
app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/upload", uploadRoutes);
app.use("/upload/news", uploadNewsRoutes);
app.use("/upload/approach", uploadApproachRoutes);
app.use("/news", newsRoutes);
app.use("/approaches", approachRoutes);
app.use("/scales", scaleRoutes);
app.use("/scales", scaleTeamConfigRoutes);
app.use("/scales", scaleOverrideRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
