import "dotenv/config";
import path from "path";
import express from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler";
import { usersRoutes } from "./routes/users.routes";
import { authRoutes } from "./routes/auth.routes";
import { profileRoutes } from "./routes/profile.routes";
import { uploadRoutes } from "./routes/upload.routes";
import { newsRoutes } from "./routes/news.routes";

const app = express();
const uploadsPath = path.resolve(process.cwd(), "uploads");
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
const PORT = Number(process.env.PORT) || 3333;

app.use(
  cors({
    origin: corsOrigin,
  })
);
app.use(express.json());
app.use("/uploads", express.static(uploadsPath));

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
app.use("/news", newsRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
