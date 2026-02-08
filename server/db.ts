import mongoose from "mongoose";

import dotenv from "dotenv";
dotenv.config();

if (!process.env.MONGODB_URI) {
  console.warn("MONGODB_URI is not set. Please set it in Secrets.");
}

export const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.log("Skipping MongoDB connection: No URI");
      return;
    }
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};
