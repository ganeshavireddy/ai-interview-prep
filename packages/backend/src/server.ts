import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import * as authController from "./controllers/authController";
import * as kitController from "./controllers/kitController";
import { authMiddleware } from "./middleware/auth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8099;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ai-interview-prep-kit";

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Auth Routes
app.post("/api/auth/register", authController.register);
app.post("/api/auth/login", authController.login);

// Kit Routes
app.post("/api/kits/generate", kitController.generate);
app.get("/api/kits", kitController.getKits);
app.get("/api/kits/:id", kitController.getKitById);
app.put("/api/kits/:id", kitController.updateKit);
app.post("/api/kits/:id/regenerate-section", kitController.regenerateSection);

// Local ACME mock page for test case 4 testing
app.get("/acme/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Acme Inc - Engineering Culture</title></head>
      <body>
        <h1>Welcome to Acme Inc</h1>
        <p>Acme builds next-generation e-commerce web applications using React Server Components, Next.js, and Node.js.</p>
        <a href="/acme/about">About Us</a>
        <a href="/acme/careers">Careers</a>
      </body>
    </html>
  `);
});

app.get("/acme/about", (req, res) => {
  res.send(`<h1>About Acme Inc</h1><p>Acme processes millions of global store transactions daily.</p>`);
});

app.get("/acme/careers", (req, res) => {
  res.send(`<h1>Careers at Acme</h1><p>We look for problem solvers who value high quality code, clean design, and rapid iteration.</p>`);
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "ai-interview-prep-backend", timestamp: new Date().toISOString() });
});

// Connect DB & start server
async function start() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    console.log(`[MongoDB] Successfully connected to ${MONGODB_URI}`);
  } catch (err: any) {
    console.warn(`[MongoDB] Warning: Could not connect to Mongo (${err.message}). Using in-memory store mode.`);
  }

  app.listen(PORT, () => {
    console.log(`[Server] The AI Interview Prep Kit Backend listening on http://localhost:${PORT}`);
  });
}

if (process.env.NODE_ENV !== "test") {
  start();
}

export default app;
