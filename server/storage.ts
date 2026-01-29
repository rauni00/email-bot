import { db } from "./db";
import { contacts, settings, users, type Contact, type InsertContact, type Settings, type InsertSettings, type User, type InsertUser } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Contacts
  getContacts(filters?: { status?: string, search?: string, limit?: number, offset?: number }): Promise<{ contacts: Contact[], total: number }>;
  getContact(id: number): Promise<Contact | undefined>;
  getContactByEmail(email: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContactStatus(id: number, status: string, failureReason?: string): Promise<Contact>;
  getStats(): Promise<{ total: number, pending: number, sent: number, failed: number, skipped: number }>;
  getPendingContacts(): Promise<Contact[]>;

  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getContacts(filters?: { status?: string, search?: string, limit?: number, offset?: number }): Promise<{ contacts: Contact[], total: number }> {
    let query = db.select().from(contacts);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(contacts);

    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(contacts.status, filters.status as any));
    }
    if (filters?.search) {
      conditions.push(sql`${contacts.name} ILIKE ${`%${filters.search}%`} OR ${contacts.email} ILIKE ${`%${filters.search}%`}`);
    }

    if (conditions.length > 0) {
      query = query.where(sql`${sql.join(conditions, sql` AND `)}`) as any;
      countQuery = countQuery.where(sql`${sql.join(conditions, sql` AND `)}`) as any;
    }

    const [{ count }] = await countQuery;
    
    if (filters?.limit !== undefined && filters?.offset !== undefined) {
      query = query.limit(filters.limit).offset(filters.offset) as any;
    }

    const results = await query.orderBy(contacts.id);
    return { contacts: results, total: Number(count) };
  }

  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async getContactByEmail(email: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.email, email));
    return contact;
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const [contact] = await db
      .insert(contacts)
      .values(insertContact)
      .onConflictDoNothing({ target: contacts.email })
      .returning();
    
    if (!contact) {
      return (await this.getContactByEmail(insertContact.email))!;
    }
    return contact;
  }

  async updateContactStatus(id: number, status: string, failureReason?: string): Promise<Contact> {
    const [updated] = await db
      .update(contacts)
      .set({ 
        status: status as any, 
        failureReason: failureReason || null,
        sentAt: status === 'sent' ? new Date() : undefined
      })
      .where(eq(contacts.id, id))
      .returning();
    return updated;
  }

  async getStats() {
    const all = await db.select().from(contacts);
    return {
      total: all.length,
      pending: all.filter(c => c.status === 'pending').length,
      sent: all.filter(c => c.status === 'sent').length,
      failed: all.filter(c => c.status === 'failed').length,
      skipped: all.filter(c => c.status === 'skipped').length,
    };
  }

  async getPendingContacts(): Promise<Contact[]> {
    return await db.select().from(contacts).where(eq(contacts.status, 'pending'));
  }

  async getSettings(): Promise<Settings> {
    const [setting] = await db.select().from(settings).limit(1);
    if (!setting) {
      const [newSetting] = await db.insert(settings).values({}).returning();
      return newSetting;
    }
    return setting;
  }

  async updateSettings(updates: Partial<InsertSettings>): Promise<Settings> {
    const current = await this.getSettings();
    const [updated] = await db
      .update(settings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(settings.id, current.id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
