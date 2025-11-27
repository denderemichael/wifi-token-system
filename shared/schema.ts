import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tokens = pgTable("tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: varchar("token", { length: 8 }).notNull().unique(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method").notNull(),
  paymentIntentId: varchar("payment_intent_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  isRevoked: boolean("is_revoked").notNull().default(false),
  smsDelivered: boolean("sms_delivered").notNull().default(false),
  smsError: text("sms_error"),
});

export const insertTokenSchema = createInsertSchema(tokens).omit({
  id: true,
  createdAt: true,
});

export type InsertToken = z.infer<typeof insertTokenSchema>;
export type Token = typeof tokens.$inferSelect;

// Purchase token request from user
export const purchaseTokenSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  amount: z.union([z.number(), z.string()]).transform(val => 
    typeof val === 'string' ? parseFloat(val) : val
  ).pipe(z.number().min(0, "Amount must be at least $0")),
});

export type PurchaseTokenRequest = z.infer<typeof purchaseTokenSchema>;

// Settings table for configurable values
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;

// Networks table for multiple WiFi networks with different pricing
export const networks = pgTable("networks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  ssid: varchar("ssid", { length: 32 }).notNull().unique(),
  tokenPrice: decimal("token_price", { precision: 10, scale: 2 }).notNull(),
  tokenDuration: varchar("token_duration").notNull(), // Store as string like "12h", "1d", etc.
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertNetworkSchema = createInsertSchema(networks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertNetwork = z.infer<typeof insertNetworkSchema>;
export type Network = typeof networks.$inferSelect;
