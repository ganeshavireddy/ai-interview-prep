import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "ai-prep-kit-jwt-secret-key-2026";

export async function register(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: "Email and password (min 6 chars) are required." });
    }

    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "User already exists with this email." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({ email: email.toLowerCase(), passwordHash });

    const token = jwt.sign({ userId: user._id.toString(), email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(201).json({ token, user: { id: user._id, email: user.email } });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to register user." });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required." });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign({ userId: user._id.toString(), email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({ token, user: { id: user._id, email: user.email } });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Login failed." });
  }
}
