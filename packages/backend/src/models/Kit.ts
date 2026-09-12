import mongoose, { Schema, Document } from "mongoose";
import { Kit } from "@ai-interview-prep/shared";

export interface IKitDocument extends Omit<Kit, "id">, Document {
  userId?: string;
}

const KitSchema: Schema = new Schema(
  {
    userId: { type: String, required: false },
    source: { type: Object, required: true },
    company_brief: { type: Object, required: true },
    role: { type: Object, required: true },
    questions: { type: Array, default: [] },
    flashcards: { type: Array, default: [] },
    schedule: { type: Object, required: true },
    coverage: { type: Object, required: true },
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

export const KitModel = mongoose.models.Kit || mongoose.model<IKitDocument>("Kit", KitSchema);
