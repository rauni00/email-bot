export interface User {
  id: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UpsertUser = Partial<User>;
