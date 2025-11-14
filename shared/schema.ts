import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tokens = pgTable("tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: varchar("token", { length: 8 }).notNull().unique(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentIntentId: varchar("payment_intent_id").notNull(),
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
