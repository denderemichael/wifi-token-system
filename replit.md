# Wi-Fi Access Token System

## Overview
A token-based Wi-Fi access control system where users purchase time-limited access tokens via payment, receive them via SMS, and use them to connect to the Wi-Fi network.

## System Architecture

### User Flow
1. User visits captive portal (/)
2. Clicks "Purchase Wi-Fi Access" to go to payment page (/purchase)
3. Enters phone number and pays $5 for 12 hours of access
4. Receives access token via SMS immediately after payment
5. Returns to captive portal and enters token to connect
6. Token is validated and grants Wi-Fi access for 12 hours

### Admin Flow
1. Admin visits admin dashboard (/admin)
2. Can manually generate tokens and send via SMS (/admin/generate)
3. View active tokens with real-time expiry tracking
4. View token history and revoke tokens as needed
5. Configure network settings (/admin/settings)

## Technical Stack

### Frontend
- React with TypeScript
- Wouter for routing
- TanStack Query for data fetching
- Shadcn UI components
- Stripe Elements for payment processing

### Backend
- Express.js
- PostgreSQL database (Neon)
- Stripe for payment processing
- Twilio for SMS delivery
- Drizzle ORM for database management

## Database Schema

### Tokens Table
- `id`: UUID primary key
- `token`: 8-character uppercase alphanumeric code (unique)
- `phoneNumber`: Recipient's phone number
- `amount`: Purchase amount in USD
- `paymentIntentId`: Stripe payment intent ID or "MANUAL_GENERATION"
- `createdAt`: Timestamp when token was created
- `expiresAt`: Timestamp when token expires (12 hours from creation)
- `usedAt`: Timestamp when token was first used (nullable)
- `isRevoked`: Boolean flag for manually revoked tokens
- `smsDelivered`: Boolean flag for SMS delivery status
- `smsError`: Error message if SMS delivery failed (nullable)

## API Endpoints

### Public Endpoints
- `POST /api/create-payment-intent` - Create Stripe payment intent for token purchase
- `POST /api/validate-token` - Validate token for captive portal access
- `POST /api/webhook/stripe` - Stripe webhook for payment confirmation

### Admin Endpoints
- `GET /api/tokens/active` - Get all active tokens
- `GET /api/tokens` - Get all tokens (including expired)
- `POST /api/tokens/generate` - Manually generate and send token via SMS
- `POST /api/tokens/:id/revoke` - Revoke a specific token

## Required Environment Variables

### Stripe (Payment Processing)
- `STRIPE_SECRET_KEY` - Stripe secret key (starts with sk_)
- `VITE_STRIPE_PUBLIC_KEY` - Stripe publishable key (starts with pk_)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (optional, for production)

### Twilio (SMS Delivery)
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_PHONE_NUMBER` - Twilio phone number (format: +1234567890)

### Database (Auto-configured by Replit)
- `DATABASE_URL` - PostgreSQL connection string
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - Individual DB credentials

### Application
- `SESSION_SECRET` - Session encryption key
- `PORT` - Application port (default: 5000)

## Development Notes

### Without Credentials
The system works in "demo mode" without Stripe/Twilio credentials:
- Payment: Shows error message that payment is not configured
- SMS: Logs tokens to console instead of sending actual SMS
- Token validation: Works normally against database

### Token Generation
- Tokens are 8-character uppercase codes using chars: ABCDEFGHJKLMNPQRSTUVWXYZ23456789
- Excludes confusing characters (I, O, 1, 0) for better readability
- Tokens are case-insensitive when validated (auto-uppercased)

### Token Expiry
- All tokens expire exactly 12 hours after creation
- Active tokens show real-time countdown
- Tokens expiring in < 2 hours are flagged as "expiring soon"
- Expired tokens cannot be used but remain in database for history

### Payment Flow
1. User enters phone number and continues to payment
2. Stripe payment intent created with phone number in metadata
3. User completes payment with Stripe Elements
4. Stripe webhook receives `payment_intent.succeeded` event
5. Backend generates token, saves to database, sends SMS
6. User receives token on their phone

## Admin Features

### Dashboard
- Real-time stats: Active tokens, expiring soon, generated today
- Active tokens table with status badges and progress bars
- Copy tokens to clipboard
- Revoke tokens with confirmation dialog

### Manual Token Generation
- Admin can generate tokens without payment
- Requires phone number input
- Token sent via SMS immediately
- Marked with paymentIntentId: "MANUAL_GENERATION"

### Token History
- View all expired and revoked tokens
- Filter by status, date, phone number
- Track SMS delivery status
- View payment information

## Future Enhancements

### Integration Ideas
- RADIUS server integration for actual Wi-Fi authentication
- UniFi/Cisco Meraki network controller integration
- Rate limiting and abuse prevention (IP blocking, attempt limits)
- Usage analytics and network traffic monitoring
- Multi-tier pricing (1hr, 12hr, 24hr, weekly passes)
- Email delivery as alternative to SMS
- QR code generation for easy token entry
- Bulk token generation for events

### Feature Ideas
- User accounts with purchase history
- Subscription plans for recurring access
- Referral/discount codes
- Guest network customization per token
- Bandwidth throttling controls
- Location-based token restrictions
- Automated cleanup of old expired tokens

## Notes for Future Development
- Twilio integration not using Replit connector - credentials stored as manual secrets
- This was a user choice after dismissing the connector setup
- Consider migrating to Replit connector in future for better secret management
