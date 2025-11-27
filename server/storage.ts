import { db } from "./db";
import { tokens, settings, networks, type Token, type InsertToken, type Setting, type InsertSetting, type Network, type InsertNetwork } from "@shared/schema";
import { eq, and, gt, lt } from "drizzle-orm";

export interface IStorage {
  createToken(token: InsertToken): Promise<Token>;
  getTokenByCode(code: string): Promise<Token | undefined>;
  getActiveTokens(): Promise<Token[]>;
  getAllTokens(): Promise<Token[]>;
  getExpiredTokens(): Promise<Token[]>;
  markTokenAsUsed(id: string): Promise<void>;
  revokeToken(id: string): Promise<void>;
  updateTokenSmsStatus(id: string, delivered: boolean, error?: string): Promise<void>;
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
  // Network methods
  createNetwork(network: InsertNetwork): Promise<Network>;
  getAllNetworks(): Promise<Network[]>;
  getActiveNetworks(): Promise<Network[]>;
  getNetworkById(id: string): Promise<Network | undefined>;
  getNetworkBySsid(ssid: string): Promise<Network | undefined>;
  updateNetwork(id: string, network: Partial<InsertNetwork>): Promise<void>;
  deleteNetwork(id: string): Promise<void>;
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

  async getExpiredTokens(): Promise<Token[]> {
    const now = new Date();
    return db
      .select()
      .from(tokens)
      .where(
        and(
          eq(tokens.isRevoked, false),
          lt(tokens.expiresAt, now)
        )
      )
      .orderBy(tokens.createdAt);
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

  async getSetting(key: string): Promise<string | null> {
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);
    return setting ? setting.value : null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedAt: new Date() }
      });
  }

  // Network methods
  async createNetwork(insertNetwork: InsertNetwork): Promise<Network> {
    const [network] = await db.insert(networks).values(insertNetwork).returning();
    return network;
  }

  async getAllNetworks(): Promise<Network[]> {
    return db.select().from(networks).orderBy(networks.createdAt);
  }

  async getActiveNetworks(): Promise<Network[]> {
    return db
      .select()
      .from(networks)
      .where(eq(networks.isActive, true))
      .orderBy(networks.createdAt);
  }

  async getNetworkById(id: string): Promise<Network | undefined> {
    const [network] = await db
      .select()
      .from(networks)
      .where(eq(networks.id, id))
      .limit(1);
    return network;
  }

  async getNetworkBySsid(ssid: string): Promise<Network | undefined> {
    const [network] = await db
      .select()
      .from(networks)
      .where(eq(networks.ssid, ssid))
      .limit(1);
    return network;
  }

  async updateNetwork(id: string, updateData: Partial<InsertNetwork>): Promise<void> {
    await db
      .update(networks)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(networks.id, id));
  }

  async deleteNetwork(id: string): Promise<void> {
    await db.delete(networks).where(eq(networks.id, id));
  }
}

export const storage = new DbStorage();
