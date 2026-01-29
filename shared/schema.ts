// === Users Table ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "user"] }).notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === Contacts Table ===
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(), // Prevent duplicates at DB level
  source: text("source").notNull(), // 'pdf:filename.pdf' or 'manual'
  status: text("status", { enum: ['pending', 'sent', 'failed', 'skipped'] }).notNull().default('pending'),
  failureReason: text("failure_reason"),
  sentAt: timestamp("sent_at"),
  resumePath: text("resume_path"), // Path to uploaded resume
  createdAt: timestamp("created_at").defaultNow(),
});

// === Settings Table ===
// Stores global configuration (SMTP, limits, switch)
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  smtpHost: text("smtp_host").default(''),
  smtpPort: integer("smtp_port").default(587),
  smtpUser: text("smtp_user").default(''),
  smtpPass: text("smtp_pass").default(''), // Encrypted in app logic
  smtpSecure: boolean("smtp_secure").default(false),
  emailSubject: text("email_subject").default('Job Application'),
  emailBody: text("email_body").default(''),
  delayMin: integer("delay_min").default(180), // seconds
  delayMax: integer("delay_max").default(240), // seconds
  isActive: boolean("is_active").default(false), // Global kill switch
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === Schemas ===
export const insertContactSchema = createInsertSchema(contacts).omit({ 
  id: true, 
  createdAt: true, 
  sentAt: true, 
  status: true,
  failureReason: true
});

export const insertSettingsSchema = createInsertSchema(settings).omit({ 
  id: true, 
  updatedAt: true 
});

// === Types ===
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

// === API Types ===
export type ContactResponse = Contact;
export type SettingsResponse = Settings;
export type StatsResponse = {
  total: number;
  pending: number;
  sent: number;
  failed: number;
  skipped: number;
};
