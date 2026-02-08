import { Contact, Settings } from "./models";
import type { Contact as ContactType, InsertContact, Settings as SettingsType, InsertSettings } from "@shared/schema";
import session from "express-session";
import MongoStore from "connect-mongo";

export interface IStorage {
  // Contacts
  getContacts(filters?: { status?: string, search?: string, limit?: number, offset?: number }): Promise<{ contacts: ContactType[], total: number }>;
  getContact(id: string): Promise<ContactType | undefined>;
  getContactByEmail(email: string): Promise<ContactType | undefined>;
  createContact(contact: InsertContact): Promise<ContactType>;
  updateContactStatus(id: string, status: string, failureReason?: string): Promise<ContactType>;
  getStats(): Promise<{ total: number, pending: number, sent: number, failed: number, skipped: number }>;
  getPendingContacts(): Promise<ContactType[]>;

  // Settings
  getSettings(): Promise<SettingsType>;
  updateSettings(settings: Partial<InsertSettings>): Promise<SettingsType>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || "mongodb://localhost:27017/email-bot",
    });
  }

  async getContacts(filters?: { status?: string, search?: string, limit?: number, offset?: number }): Promise<{ contacts: ContactType[], total: number }> {
    const query: any = {};

    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const total = await Contact.countDocuments(query);
    const contacts = await Contact.find(query)
      .sort({ createdAt: 1 }) // Mongoose sort: 1 for ascending
      .skip(filters?.offset || 0)
      .limit(filters?.limit || 50);

    return { contacts: contacts.map(c => c.toJSON() as any), total };
  }

  async getContact(id: string): Promise<ContactType | undefined> {
    try {
        const contact = await Contact.findById(id);
        return contact ? (contact.toJSON() as any) : undefined;
    } catch (e) {
        return undefined;
    }
  }

  async getContactByEmail(email: string): Promise<ContactType | undefined> {
    const contact = await Contact.findOne({ email });
    return contact ? (contact.toJSON() as any) : undefined;
  }

  async createContact(insertContact: InsertContact): Promise<ContactType> {
    // Mongoose handles unique constraint on email
    try {
        const contact = await Contact.create(insertContact);
        return contact.toJSON() as any;
    } catch (error: any) {
        if (error.code === 11000) { // Duplicate key error
            const existing = await this.getContactByEmail(insertContact.email);
            return existing!;
        }
        throw error;
    }
  }

  async updateContactStatus(id: string, status: string, failureReason?: string): Promise<ContactType> {
    const updates: any = { 
        status, 
        failureReason: failureReason || null 
    };
    if (status === 'sent') {
        updates.sentAt = new Date();
    }

    const updated = await Contact.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) throw new Error("Contact not found");
    return updated.toJSON() as any;
  }

  async getStats() {
    const total = await Contact.countDocuments();
    const pending = await Contact.countDocuments({ status: 'pending' });
    const sent = await Contact.countDocuments({ status: 'sent' });
    const failed = await Contact.countDocuments({ status: 'failed' });
    const skipped = await Contact.countDocuments({ status: 'skipped' });

    return { total, pending, sent, failed, skipped };
  }

  async getPendingContacts(): Promise<ContactType[]> {
    const contacts = await Contact.find({ status: 'pending' });
    return contacts.map(c => c.toJSON() as any);
  }

  async getSettings(): Promise<SettingsType> {
    let setting = await Settings.findOne();
    if (!setting) {
      setting = await Settings.create({});
    }
    return setting.toJSON() as any;
  }

  async updateSettings(updates: Partial<InsertSettings>): Promise<SettingsType> {
    const current = await this.getSettings();
    const updated = await Settings.findByIdAndUpdate(current.id, { ...updates, updatedAt: new Date() }, { new: true });
    return updated!.toJSON() as any;
  }
}

export const storage = new DatabaseStorage();
