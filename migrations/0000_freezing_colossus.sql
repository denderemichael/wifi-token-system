CREATE TABLE "networks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"ssid" varchar(32) NOT NULL,
	"token_price" numeric(10, 2) NOT NULL,
	"token_duration" varchar NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "networks_name_unique" UNIQUE("name"),
	CONSTRAINT "networks_ssid_unique" UNIQUE("ssid")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar(8) NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" varchar NOT NULL,
	"payment_intent_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"sms_delivered" boolean DEFAULT false NOT NULL,
	"sms_error" text,
	CONSTRAINT "tokens_token_unique" UNIQUE("token")
);
