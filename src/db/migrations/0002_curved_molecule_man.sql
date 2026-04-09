CREATE TYPE "public"."tiktok_account_status" AS ENUM('pending', 'processed');--> statement-breakpoint
CREATE TABLE "tiktok_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_url" text NOT NULL,
	"status" "tiktok_account_status" DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "tiktok_accounts" ADD CONSTRAINT "tiktok_accounts_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
