import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { purchaseTokenSchema } from "@shared/schema";
import { z } from "zod";
import axios from "axios";
import AfricasTalking from 'africastalking';
import jwt from 'jsonwebtoken';

// Africa's Talking client for SMS
let africasTalkingClient: ReturnType<typeof AfricasTalking> | null = null;
if (process.env.AFRICAS_TALKING_USERNAME && process.env.AFRICAS_TALKING_API_KEY) {
  africasTalkingClient = AfricasTalking({
    username: process.env.AFRICAS_TALKING_USERNAME,
    apiKey: process.env.AFRICAS_TALKING_API_KEY
  });
}

// JWT secret for admin authentication
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

// Middleware to verify JWT token for admin routes
function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { admin: boolean };
    if (!decoded.admin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Paynow payment integration
async function initiatePaynowPayment(amount: number, phoneNumber: string, reference: string): Promise<any> {
  if (!process.env.PAYNOW_INTEGRATION_ID || !process.env.PAYNOW_INTEGRATION_KEY) {
    throw new Error('Paynow credentials not configured');
  }

  const paynowUrl = 'https://www.paynow.co.zw/interface/initiatetransaction';
  const data = new URLSearchParams({
    'id': process.env.PAYNOW_INTEGRATION_ID,
    'reference': reference,
    'amount': amount.toString(),
    'additionalinfo': `Wi-Fi Access Token Purchase - ${phoneNumber}`,
    'returnurl': process.env.PAYNOW_RETURN_URL || 'https://yourdomain.com/payment/success',
    'resulturl': process.env.PAYNOW_RESULT_URL || 'https://yourdomain.com/payment/webhook',
    'authemail': 'noreply@yourdomain.com',
    'phone': phoneNumber,
    'method': 'ecocash', // or onemoney based on payment method
    'hash': '' // Will be calculated below
  });

  // Calculate hash
  const hashString = data.toString() + process.env.PAYNOW_INTEGRATION_KEY;
  const crypto = await import('crypto');
  const hash = crypto.createHash('sha512').update(hashString).digest('hex');
  data.set('hash', hash);

  try {
    const response = await axios.post(paynowUrl, data, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (response.data.status !== 'Ok') {
      throw new Error(`Paynow error: ${response.data.status}`);
    }

    return {
      pollUrl: response.data.pollurl,
      paymentUrl: response.data.browserurl || response.data.instructions
    };
  } catch (error: any) {
    console.error('Paynow initiation failed:', error);
    throw error;
  }
}

async function checkPaynowStatus(pollUrl: string): Promise<string> {
  try {
    const response = await axios.post(pollUrl);
    return response.data.status || 'Unknown';
  } catch (error: any) {
    console.error('Paynow status check failed:', error);
    return 'Error';
  }
}


// Generate random token code (uppercase only for consistency)
function generateTokenCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Send SMS with token using Africa's Talking (optimized for Zimbabwe)
async function sendTokenViaSMS(phoneNumber: string, tokenCode: string, tokenId: string, tokenDurationHours: number): Promise<void> {
  if (!africasTalkingClient) {
    console.log(`[DEMO MODE] Would send SMS to ${phoneNumber}: Your Wi-Fi access token is: ${tokenCode}. Valid for ${tokenDurationHours} hours.`);
    await storage.updateTokenSmsStatus(tokenId, true);
    return;
  }

  try {
    const sms = africasTalkingClient.SMS;
    const result = await sms.send({
      to: phoneNumber,
      message: `Your Wi-Fi access token is: ${tokenCode}. Valid for ${tokenDurationHours} hours. Enter this on the Wi-Fi portal to connect.`,
      from: 'WiFiToken' // Sender ID (must be registered with Africa's Talking)
    });
    console.log('SMS sent successfully:', result);
    await storage.updateTokenSmsStatus(tokenId, true);
  } catch (error: any) {
    console.error('SMS sending failed:', error);
    await storage.updateTokenSmsStatus(tokenId, false, error.message);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;

      // Simple password check - in production, use proper authentication
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword || password !== adminPassword) {
        return res.status(401).json({ message: 'Invalid password' });
      }

      const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Purchase token with Paynow payment method
  app.post("/api/purchase-token", async (req, res) => {
    try {
      const { networkId, phoneNumber, paymentMethod } = req.body;

      // Validate required fields
      if (!networkId || !phoneNumber || !paymentMethod) {
        return res.status(400).json({ message: "Network ID, phone number, and payment method are required" });
      }

      // Get network details
      const network = await storage.getNetworkById(networkId);
      if (!network) {
        return res.status(404).json({ message: "Network not found" });
      }

      // Generate unique reference for Paynow
      const reference = `WIFI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Initiate Paynow payment
      const paymentResult = await initiatePaynowPayment(parseFloat(network.tokenPrice), phoneNumber, reference);

      // For now, we'll simulate successful payment and create token immediately
      // In production, you'd wait for webhook confirmation or poll the status
      console.log(`[PAYNOW] Initiated payment for ${paymentMethod} - Reference: ${reference}`);

      // Generate token and save to database
      const tokenCode = generateTokenCode();
      const tokenDurationHours = parseInt(network.tokenDuration);
      const expiresAt = new Date(Date.now() + tokenDurationHours * 60 * 60 * 1000);

      const token = await storage.createToken({
        token: tokenCode,
        phoneNumber,
        amount: network.tokenPrice.toString(),
        paymentMethod,
        paymentIntentId: reference, // Use Paynow reference
        expiresAt,
        usedAt: null,
        isRevoked: false,
        smsDelivered: false,
        smsError: null,
      });

      // Send SMS with token
      try {
        await sendTokenViaSMS(phoneNumber, tokenCode, token.id, tokenDurationHours);
      } catch (error) {
        console.error('Failed to send SMS, but token created:', error);
      }

      res.json({
        success: true,
        token: tokenCode,
        paymentUrl: paymentResult.paymentUrl,
        pollUrl: paymentResult.pollUrl,
        reference
      });
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
  app.get("/api/tokens/active", authenticateAdmin, async (req, res) => {
    try {
      const activeTokens = await storage.getActiveTokens();
      res.json(activeTokens);
    } catch (error: any) {
      console.error('Error fetching active tokens:', error);
      res.status(500).json({ message: "Error fetching tokens" });
    }
  });

  // Get all tokens (admin)
  app.get("/api/tokens", authenticateAdmin, async (req, res) => {
    try {
      const allTokens = await storage.getAllTokens();
      res.json(allTokens);
    } catch (error: any) {
      console.error('Error fetching tokens:', error);
      res.status(500).json({ message: "Error fetching tokens" });
    }
  });

  // Revoke token (admin)
  app.post("/api/tokens/:id/revoke", authenticateAdmin, async (req, res) => {
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
  app.post("/api/tokens/generate", authenticateAdmin, async (req, res) => {
    try {
      const { phoneNumber, networkId } = req.body;

      if (!phoneNumber || !networkId) {
        return res.status(400).json({ message: "Phone number and network ID are required" });
      }

      const network = await storage.getNetworkById(networkId);
      if (!network) {
        return res.status(404).json({ message: "Network not found" });
      }

      const tokenDurationHours = parseInt(network.tokenDuration);
      const tokenCode = generateTokenCode();
      const expiresAt = new Date(Date.now() + tokenDurationHours * 60 * 60 * 1000);

      const token = await storage.createToken({
        token: tokenCode,
        phoneNumber,
        amount: network.tokenPrice.toString(),
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
        await sendTokenViaSMS(phoneNumber, tokenCode, token.id, tokenDurationHours);
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

  // Paynow webhook for payment confirmation
  app.post("/api/payment/webhook", async (req, res) => {
    try {
      const { reference, status, paynowreference } = req.body;

      console.log(`[PAYNOW WEBHOOK] Reference: ${reference}, Status: ${status}, PaynowRef: ${paynowreference}`);

      // Verify the payment status
      if (status === 'Paid' || status === 'Awaiting Delivery') {
        // Payment successful - could update token status or send confirmation
        console.log(`Payment confirmed for reference: ${reference}`);
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Paynow webhook error:', error);
      res.status(500).json({ message: "Webhook processing error" });
    }
  });

  // Send expiration notifications (admin)
  app.post("/api/tokens/send-expiration-notifications", authenticateAdmin, async (req, res) => {
    try {
      const expiredTokens = await storage.getExpiredTokens();

      let sentCount = 0;
      for (const token of expiredTokens) {
        try {
          // Send expiration SMS using Africa's Talking
          if (africasTalkingClient) {
            const sms = africasTalkingClient.SMS;
            await sms.send({
              to: token.phoneNumber,
              message: `Your Wi-Fi access token (${token.token}) has expired. Please purchase a new token to continue accessing the network.`,
              from: 'WiFiToken'
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

  // Get settings (admin)
  app.get("/api/settings", authenticateAdmin, async (req, res) => {
    try {
      const networkName = await storage.getSetting("network_name") || "SecureNet";
      const tokenDuration = parseInt(await storage.getSetting("token_duration") || "12");
      const tokenPrice = parseFloat(await storage.getSetting("token_price") || "5");
      const autoCleanup = (await storage.getSetting("auto_cleanup")) === "true";

      res.json({
        networkName,
        tokenDuration,
        tokenPrice,
        autoCleanup
      });
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ message: "Error fetching settings" });
    }
  });

  // Update settings (admin)
  app.put("/api/settings", authenticateAdmin, async (req, res) => {
    try {
      const { networkName, tokenDuration, tokenPrice, autoCleanup } = req.body;

      if (networkName !== undefined) {
        await storage.setSetting("network_name", networkName);
      }
      if (tokenDuration !== undefined) {
        await storage.setSetting("token_duration", tokenDuration.toString());
      }
      if (tokenPrice !== undefined) {
        await storage.setSetting("token_price", tokenPrice.toString());
      }
      if (autoCleanup !== undefined) {
        await storage.setSetting("auto_cleanup", autoCleanup.toString());
      }

      res.json({ success: true, message: "Settings updated successfully" });
    } catch (error: any) {
      console.error('Error updating settings:', error);
      res.status(500).json({ message: "Error updating settings" });
    }
  });

  // Get all networks (admin)
  app.get("/api/networks", authenticateAdmin, async (req, res) => {
    try {
      const networks = await storage.getAllNetworks();
      res.json(networks);
    } catch (error: any) {
      console.error('Error fetching networks:', error);
      res.status(500).json({ message: "Error fetching networks" });
    }
  });

  // Get active networks (for purchase page)
  app.get("/api/networks/active", async (req, res) => {
    try {
      const networks = await storage.getActiveNetworks();
      res.json(networks);
    } catch (error: any) {
      console.error('Error fetching active networks:', error);
      res.status(500).json({ message: "Error fetching networks" });
    }
  });

  // Create network (admin)
  app.post("/api/networks", authenticateAdmin, async (req, res) => {
    try {
      const { name, ssid, tokenPrice, tokenDuration, isActive } = req.body;

      if (!name || !ssid || tokenPrice == null || !tokenDuration) {
        return res.status(400).json({ message: "Name, SSID, token price, and duration are required" });
      }

      const network = await storage.createNetwork({
        name,
        ssid,
        tokenPrice: tokenPrice.toString(),
        tokenDuration: tokenDuration.toString(),
        isActive: isActive !== false
      });

      res.json(network);
    } catch (error: any) {
      console.error('Error creating network:', error);
      res.status(500).json({ message: "Error creating network" });
    }
  });

  // Update network (admin)
  app.put("/api/networks/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, ssid, tokenPrice, tokenDuration, isActive } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (ssid !== undefined) updateData.ssid = ssid;
      if (tokenPrice !== undefined) updateData.tokenPrice = parseFloat(tokenPrice);
      if (tokenDuration !== undefined) updateData.tokenDuration = tokenDuration.toString();
      if (isActive !== undefined) updateData.isActive = isActive;

      await storage.updateNetwork(id, updateData);

      res.json({ success: true, message: "Network updated successfully" });
    } catch (error: any) {
      console.error('Error updating network:', error);
      res.status(500).json({ message: "Error updating network" });
    }
  });

  // Delete network (admin)
  app.delete("/api/networks/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNetwork(id);
      res.json({ success: true, message: "Network deleted successfully" });
    } catch (error: any) {
      console.error('Error deleting network:', error);
      res.status(500).json({ message: "Error deleting network" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
