import { z } from "zod";

// === Schemas ===
export const insertContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  source: z.string().min(1, "Source is required"),
  resumePath: z.string().optional(),
  status: z.enum(['pending', 'sent', 'failed', 'skipped']).optional(),
  failureReason: z.string().optional(),
  sentAt: z.coerce.date().optional(),
});

export const insertSettingsSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.coerce.number().optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  smtpSecure: z.boolean().optional(),
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),
  delayMin: z.coerce.number().optional(),
  delayMax: z.coerce.number().optional(),
  isActive: z.boolean().optional(),
  resumeFilename: z.string().optional(),
});

// === Types ===
export type Contact = z.infer<typeof insertContactSchema> & {
  id: string; 
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  failureReason?: string | null;
  sentAt?: Date | null;
  createdAt: Date;
};

export type InsertContact = z.infer<typeof insertContactSchema>;

export type Settings = z.infer<typeof insertSettingsSchema> & {
  id: string;
  updatedAt: Date;
};

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
