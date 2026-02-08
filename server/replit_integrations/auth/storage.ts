import { User as UserModel } from "../../models";
import { type User, type UpsertUser } from "@shared/models/auth";

// Interface for auth storage operations
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  registerUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    try {
        const user = await UserModel.findById(id);
        return user ? (user.toJSON() as any) as User : undefined;
    } catch (e) {
        return undefined;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const { id, ...updates } = userData;
    if (id) {
         const user = await UserModel.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true, upsert: true });
         return (user.toJSON() as any) as User;
    } else if (updates.email) {
         const user = await UserModel.findOneAndUpdate({ email: updates.email }, { ...updates, updatedAt: new Date() }, { new: true, upsert: true });
         return (user.toJSON() as any) as User;
    } else {
         const user = await UserModel.create({ ...updates, updatedAt: new Date() });
         return (user.toJSON() as any) as User;
    }
  }

  async registerUser(userData: UpsertUser): Promise<User> {
      const user = await UserModel.create({
          ...userData,
          updatedAt: new Date()
      });
      return (user.toJSON() as any) as User;
  }
}

export const authStorage = new AuthStorage();
