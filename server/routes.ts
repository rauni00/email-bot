import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import multer from "multer";
import { parse } from "csv-parse/sync";
import * as nodemailer from "nodemailer";
import { api } from "@shared/routes";
import { z } from "zod";
import fs from "fs";
import path from "path";

// Multer setup for uploads
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Email Engine background process
  let isProcessing = false;

  async function processEmailQueue() {
    if (isProcessing) return;

    // Indian Standard Time is UTC + 5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const hours = istTime.getUTCHours();

    // Check if within working hours (9 AM to 9 PM IST)
    if (hours < 9 || hours >= 21) {
      console.log(`[Engine] Outside working hours (9AM-9PM IST). Current IST hour: ${hours}`);
      return;
    }

    const settings = await storage.getSettings();
    if (!settings.isActive) return;

    const pending = await storage.getPendingContacts();
    if (pending.length === 0) {
      await storage.updateSettings({ isActive: false });
      return;
    }

    isProcessing = true;
    console.log(
      `[Engine] Starting processing ${pending.length} pending contacts`,
    );

    const transporter = createTransporter(settings);

    for (const contact of pending) {
      // Re-check isActive between each email
      const currentSettings = await storage.getSettings();
      if (!currentSettings.isActive) {
        console.log("[Engine] Stop signal received, pausing queue");
        break;
      }

      try {
        console.log(`[Engine] Sending email to ${contact.email}`);
        const mailOptions: any = {
          from: settings.smtpUser || "",
          to: contact.email,
          subject: settings.emailSubject || "No Subject",
          html: settings.emailBody || "",
        };

        if (settings.resumeFilename) {
          const filePath = path.join(process.cwd(), "uploads", settings.resumeFilename);
          if (fs.existsSync(filePath)) {
            mailOptions.attachments = [
              {
                filename: "Resume.pdf",
                path: filePath,
              },
            ];
          }
        }

        await transporter.sendMail(mailOptions);
        await storage.updateContactStatus(contact.id, "sent");
        console.log(`[Engine] Success: ${contact.email}`);
      } catch (err: any) {
        console.error(`[Engine] Failed: ${contact.email}`, err);
        await storage.updateContactStatus(contact.id, "failed", err.message);
      }

      // Random delay
      const delay = Math.floor(
        Math.random() *
          ((settings.delayMax || 240) - (settings.delayMin || 180) + 1) +
          (settings.delayMin || 180),
      );
      console.log(`[Engine] Waiting ${delay}s before next email`);
      await new Promise((resolve) => setTimeout(resolve, delay * 1000));
    }

    isProcessing = false;
    console.log("[Engine] Queue processing finished or paused");
  }

  // Poll for active engine
  setInterval(processEmailQueue, 10000);

  // API Routes

  // Contacts List
  app.get(api.contacts.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const { contacts, total } = await storage.getContacts({
      status: status !== "all" ? status : undefined,
      search,
      limit,
      offset,
    });

    res.json({
      contacts,
      total,
      pages: Math.ceil(total / limit),
    });
  });

  // Update Status
  app.patch("/api/contacts/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const id = req.params.id; // Removed parseInt for MongoDB ObjectId
      const { status } = z
        .object({ status: z.enum(["pending", "sent", "failed", "skipped"]) })
        .parse(req.body);
      const updated = await storage.updateContactStatus(id, status);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // Manual Create
  app.post(api.contacts.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      try {
        const input = api.contacts.create.input.parse(req.body);
        const existing = await storage.getContactByEmail(input.email.toLowerCase());

        if (existing) {
          if (existing.status === "sent") {
            return res.status(400).json({ message: "Contact already sent an email." });
          }
          if (existing.status === "failed") {
            // Update to pending to allow retry
            const updated = await storage.updateContactStatus(existing.id, "pending");
            return res.json(updated);
          }
          return res.status(400).json({ message: "Contact already exists in queue." });
        }

        const contact = await storage.createContact({
          ...input,
          email: input.email.toLowerCase(),
        });
        res.status(201).json(contact);
      } catch (err) {
        res.status(400).json({ message: "Invalid input" });
      }
  });

  // Upload CSV
  app.post(
    api.contacts.upload.path,
    upload.single("file"),
    async (req, res) => {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });

      try {
        const fileContent = fs.readFileSync(req.file.path, "utf-8");
        const records = parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        });

        let processed = 0;
        let duplicates = 0;

        for (const record of records as any[]) {
          const email = (record.email || record.Email || "").toLowerCase().trim();
          const name = record.name || record.Name || "HR Contact";

          if (!email) continue;

          const existing = await storage.getContactByEmail(email);
          if (existing) {
            if (existing.status === "failed") {
              // Reset failed contact to pending
              await storage.updateContactStatus(existing.id, "pending");
              processed++;
            } else {
              duplicates++;
            }
            continue;
          }

          await storage.createContact({
            name,
            email,
            source: `csv:${req.file.originalname}`,
          });

          processed++;
        }

        fs.unlinkSync(req.file.path);

        res.json({
          message: "CSV processed successfully",
          processed,
          duplicates,
        });
      } catch (err) {
        console.error("CSV parsing failed:", err);
        res.status(500).json({ message: "Failed to parse CSV" });
      }
    },
  );

  // Stats
  app.get(api.contacts.stats.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const stats = await storage.getStats();
    res.json(stats);
  });

  // Quick Send
  app.post("/api/contacts/quick-send", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const { name, email } = z.object({
        name: z.string(),
        email: z.string().email(),
      }).parse(req.body);

      const settings = await storage.getSettings();
      
      // 1. Create/Update Contact
      let contact = await storage.getContactByEmail(email.toLowerCase());
      if (contact) {
        if (contact.status === "sent") {
          return res.status(400).json({ message: "You have already sent an email to this contact." });
        }
        await storage.updateContactStatus(contact.id, "pending");
      } else {
        contact = await storage.createContact({
          name,
          email: email.toLowerCase(),
          source: "quick-send",
        });
      }

      // 2. Send Email Immediately
      const transporter = createTransporter(settings);
      const mailOptions: any = {
        from: settings.smtpUser || "",
        to: email,
        subject: settings.emailSubject || "Job Application",
        html: settings.emailBody || "",
      };

      if (settings.resumeFilename) {
        const filePath = path.join(process.cwd(), "uploads", settings.resumeFilename);
        if (fs.existsSync(filePath)) {
          mailOptions.attachments = [
            {
              filename: "Resume.pdf",
              path: filePath,
            },
          ];
        }
      }

      await transporter.sendMail(mailOptions);
      await storage.updateContactStatus(contact.id, "sent");

      res.json({ message: "Email sent successfully" });
    } catch (err: any) {
      console.error("[QuickSend] Error:", err);
      res.status(400).json({ message: err.message || "Failed to send email" });
    }
  });

  // Settings GET
  app.get(api.settings.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const settings = await storage.getSettings();
    res.json(settings);
  });

  // Settings Update
  app.patch(api.settings.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const updated = await storage.updateSettings(req.body);
    res.json(updated);
  });

  // Engine Toggle
  app.post(api.settings.toggle.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
      const updated = await storage.updateSettings({ isActive });

      if (isActive) {
        processEmailQueue(); // Trigger immediate start
      }

      res.json({
        isActive: updated.isActive,
        message: `Engine ${updated.isActive ? "started" : "stopped"}`,
      });
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // Resume Upload
  app.post("/api/settings/resume", upload.single("file"), async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    try {
      await storage.updateSettings({ resumeFilename: req.file.filename });
      res.json({ filename: req.file.filename });
    } catch (err) {
      res.status(500).json({ message: "Failed to save resume" });
    }
  });

  function createTransporter(setting: any) {
    // For Gmail/Google Workspace, we can use the 'gmail' service shortcut
    // or ensure settings are explicitly correct.
    const config: any = {
      host: setting?.smtpHost,
      port: setting?.smtpPort || 587,
      secure: !!setting?.smtpSecure,
      auth: {
        user: setting?.smtpUser,
        pass: setting?.smtpPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    };

    // Special handling for Gmail to avoid common connection issues
    if (
      setting?.smtpHost?.includes("gmail.com") ||
      setting?.smtpHost?.includes("googlemail.com")
    ) {
      config.service = "gmail";
      // When using 'service', host and port are handled by nodemailer
      delete config.host;
      delete config.port;
    }

    return nodemailer.createTransport(config);
  }
  // Test Email
  app.post(api.settings.testEmail.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const { email } = api.settings.testEmail.input.parse(req.body);
      const settings = await storage.getSettings();

      const transporter = createTransporter(settings);

      const mailOptions = {
        from: settings.smtpUser || "",
        to: email,
        subject: "Test email",
        html: `
              <h3>Test Email</h3>
              <p>Your SMTP configuration is working!</p>
              <hr />
              ${settings.emailBody || ""}
            `,
        headers: {
          "X-Priority": "1",
          "X-MSMail-Priority": "High",
          Importance: "high",
        },
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent: ${info.messageId}`);
      res.json({ success: true, message: "Test email sent successfully" });
    } catch (err: any) {
      console.log(err);
      res
        .status(400)
        .json({ message: err.message || "Failed to send test email" });
    }
  });

  return httpServer;
}
