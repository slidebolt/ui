CREATE TABLE "app_state" (
"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
"name" text NOT NULL,
"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
"updated_at" timestamp DEFAULT now()
);
