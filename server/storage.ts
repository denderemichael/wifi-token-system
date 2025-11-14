import { db } from "./db";
import { tokens, type Token, type InsertToken } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";

export interface IStorage {
  createToken(token: InsertToken): Promise<Token>;
  getTokenByCode(code: string): Promise<Token | undefined>;
  getActiveTokens(): Promise<Token[]>;
  getAllTokens(): Promise<Token[]>;
  markTokenAsUsed(id: string): Promise<void>;
  revokeToken(id: string): Promise<void>;
  updateTokenSmsStatus(id: string, delivered: boolean, error?: string): Promise<void>;
}

export class DbStorage implements IStorage {
  async createToken(insertToken: InsertToken): Promise<Token> {
    const [token] = await db.insert(tokens).values(insertToken).returning();
    return token;
  }

  async getTokenByCode(code: string): Promise<Token | undefined> {
    const [token] = await db
      .select()
      .from(tokens)
      .where(eq(tokens.token, code))
      .limit(1);
    return token;
  }

  async getActiveTokens(): Promise<Token[]> {
    const now = new Date();
    return db
      .select()
      .from(tokens)
      .where(
        and(
          eq(tokens.isRevoked, false),
          gt(tokens.expiresAt, now)
        )
      )
      .orderBy(tokens.createdAt);
  }

  async getAllTokens(): Promise<Token[]> {
    return db.select().from(tokens).orderBy(tokens.createdAt);
  }

  async markTokenAsUsed(id: string): Promise<void> {
    await db
      .update(tokens)
      .set({ usedAt: new Date() })
      .where(eq(tokens.id, id));
  }

  async revokeToken(id: string): Promise<void> {
    await db
      .update(tokens)
      .set({ isRevoked: true })
      .where(eq(tokens.id, id));
  }

  async updateTokenSmsStatus(id: string, delivered: boolean, error?: string): Promise<void> {
    await db
      .update(tokens)
      .set({ 
        smsDelivered: delivered,
        smsError: error || null 
      })
      .where(eq(tokens.id, id));
  }
}

export const storage = new DbStorage();
