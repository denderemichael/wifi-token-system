import type { Express } from "express";
import { createServer, type Server } from "http";
import twilio from "twilio";
import { storage } from "./storage";
import { purchaseTokenSchema } from "@shared/schema";
import { z } from "zod";

// Twilio client - optional if credentials not provided
let twilioClient: any = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

// Generate random token code (uppercase only for consistency)
function generateTokenCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Send SMS with token
async function sendTokenViaSMS(phoneNumber: string, tokenCode: string, tokenId: string): Promise<void> {
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
    console.log(`[DEMO MODE] Would send SMS to ${phoneNumber}: Your Wi-Fi access token is: ${tokenCode}. Valid for 12 hours.`);
    await storage.updateTokenSmsStatus(tokenId, true);
    return;
  }

  try {
    await twilioClient.messages.create({
      body: `Your Wi-Fi access token is: ${tokenCode}. Valid for 12 hours. Enter this on the Wi-Fi portal to connect.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
    await storage.updateTokenSmsStatus(tokenId, true);
  } catch (error: any) {
    console.error('SMS sending failed:', error);
    await storage.updateTokenSmsStatus(tokenId, false, error.message);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Purchase token with Zimbabwean payment method
  app.post("/api/purchase-token", async (req, res) => {
    try {
      const { amount, phoneNumber, paymentMethod } = req.body;

      // Validate required fields
      if (!phoneNumber || !paymentMethod || amount == null) {
        return res.status(400).json({ message: "Phone number, payment method, and amount are required" });
      }

      // Simulate payment processing (in real implementation, integrate with actual payment APIs)
      console.log(`[PAYMENT SIMULATION] Processing ${paymentMethod} payment of $${amount} for ${phoneNumber}`);

      // Generate token and save to database
      const tokenCode = generateTokenCode();
      const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours

      const token = await storage.createToken({
        token: tokenCode,
        phoneNumber,
        amount: amount.toString(),
        paymentMethod,
        paymentIntentId: null, // Not using Stripe anymore
        expiresAt,
        usedAt: null,
        isRevoked: false,
        smsDelivered: false,
        smsError: null,
      });

      // Send SMS with token
      try {
        await sendTokenViaSMS(phoneNumber, tokenCode, token.id);
      } catch (error) {
        console.error('Failed to send SMS, but token created:', error);
      }

      res.json({ success: true, token: tokenCode });
    } catch (error: any) {
      console.error('Token purchase error:', error);
      res.status(500).json({ message: "Error processing payment: " + error.message });
    }
  });

  // Validate token (used by captive portal)
  app.post("/api/validate-token", async (req, res) => {
    try {
      const { token: tokenCode } = req.body;

      if (!tokenCode) {
        return res.status(400).json({ 
          valid: false, 
          message: "Token is required" 
        });
      }

      const token = await storage.getTokenByCode(tokenCode.toUpperCase());

      if (!token) {
        return res.status(404).json({ 
          valid: false, 
          message: "Invalid token" 
        });
      }

      if (token.isRevoked) {
        return res.status(403).json({ 
          valid: false, 
          message: "Token has been revoked" 
        });
      }

      const now = new Date();
      if (token.expiresAt < now) {
        return res.status(403).json({ 
          valid: false, 
          message: "Token has expired" 
        });
      }

      // Mark as used if first time
      if (!token.usedAt) {
        await storage.markTokenAsUsed(token.id);
      }

      res.json({ 
        valid: true, 
        message: "Access granted",
        expiresAt: token.expiresAt,
      });
    } catch (error: any) {
      console.error('Token validation error:', error);
      res.status(500).json({ 
        valid: false, 
        message: "Error validating token" 
      });
    }
  });

  // Get active tokens (admin)
  app.get("/api/tokens/active", async (req, res) => {
    try {
      const activeTokens = await storage.getActiveTokens();
      res.json(activeTokens);
    } catch (error: any) {
      console.error('Error fetching active tokens:', error);
      res.status(500).json({ message: "Error fetching tokens" });
    }
  });

  // Get all tokens (admin)
  app.get("/api/tokens", async (req, res) => {
    try {
      const allTokens = await storage.getAllTokens();
      res.json(allTokens);
    } catch (error: any) {
      console.error('Error fetching tokens:', error);
      res.status(500).json({ message: "Error fetching tokens" });
    }
  });

  // Revoke token (admin)
  app.post("/api/tokens/:id/revoke", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.revokeToken(id);
      res.json({ success: true, message: "Token revoked" });
    } catch (error: any) {
      console.error('Error revoking token:', error);
      res.status(500).json({ message: "Error revoking token" });
    }
  });

  // Manual token generation (admin) - generates and sends via SMS
  app.post("/api/tokens/generate", async (req, res) => {
    try {
      const { phoneNumber, amount = "0" } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      const tokenCode = generateTokenCode();
      const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

      const token = await storage.createToken({
        token: tokenCode,
        phoneNumber,
        amount: amount.toString(),
        paymentMethod: "manual",
        paymentIntentId: "MANUAL_GENERATION",
        expiresAt,
        usedAt: null,
        isRevoked: false,
        smsDelivered: false,
        smsError: null,
      });

      // Send SMS
      try {
        await sendTokenViaSMS(phoneNumber, tokenCode, token.id);
      } catch (error) {
        console.error('SMS send failed:', error);
      }

      res.json({
        success: true,
        token: tokenCode,
        smsDelivered: token.smsDelivered
      });
    } catch (error: any) {
      console.error('Token generation error:', error);
      res.status(500).json({ message: "Error generating token" });
    }
  });

  // Send expiration notifications (admin)
  app.post("/api/tokens/send-expiration-notifications", async (req, res) => {
    try {
      const expiredTokens = await storage.getExpiredTokens();

      let sentCount = 0;
      for (const token of expiredTokens) {
        try {
          // Send expiration SMS
          if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
            await twilioClient.messages.create({
              body: `Your Wi-Fi access token (${token.token}) has expired. Please purchase a new token to continue accessing the network.`,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: token.phoneNumber,
            });
          } else {
            console.log(`[DEMO MODE] Would send expiration SMS to ${token.phoneNumber}: Your Wi-Fi access token (${token.token}) has expired.`);
          }
          sentCount++;
        } catch (error) {
          console.error(`Failed to send expiration SMS to ${token.phoneNumber}:`, error);
        }
      }

      res.json({
        success: true,
        message: `Sent expiration notifications to ${sentCount} users`
      });
    } catch (error: any) {
      console.error('Error sending expiration notifications:', error);
      res.status(500).json({ message: "Error sending notifications" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
