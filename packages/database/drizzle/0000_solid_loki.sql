CREATE TABLE "application_info" (
"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
"name" text NOT NULL,
"description" text,
"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session_counters" (
"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
"session_id" text NOT NULL,
"visits" text DEFAULT '1' NOT NULL,
"updated_at" timestamp DEFAULT now(),
CONSTRAINT "session_counters_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
"email" text NOT NULL,
"username" text NOT NULL,
"password" text NOT NULL,
"name" text,
"is_system" boolean DEFAULT false NOT NULL,
"updated_at" timestamp DEFAULT now(),
CONSTRAINT "users_email_unique" UNIQUE("email"),
CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "roles" (
"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
"name" text NOT NULL,
"description" text,
"is_system" boolean DEFAULT false NOT NULL,
"created_at" timestamp DEFAULT now(),
CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
"user_id" uuid NOT NULL,
"role_id" uuid NOT NULL,
CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
"role_id" uuid NOT NULL,
"action" text NOT NULL,
"subject" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
