import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import apiRoutes from "./routes/api";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api", apiRoutes);

// Дозволяємо фронтенду завантажувати картинки з папки assets
app.use("/assets", express.static(path.join(process.cwd(), "assets")));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Bun-сервер полетів на порту ${PORT}`);
});
