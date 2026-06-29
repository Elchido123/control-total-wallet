CREATE TABLE "cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"numero" text NOT NULL,
	"titular" text NOT NULL,
	"expiracion" text NOT NULL,
	"cvv" text NOT NULL,
	"saldo" double precision DEFAULT 0,
	"limite" double precision DEFAULT 19000,
	"activa" boolean DEFAULT true,
	"bloqueada" boolean DEFAULT false,
	"bloqueada_hasta" text,
	"banco" text
);
--> statement-breakpoint
CREATE TABLE "proxies" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip" text NOT NULL,
	"puerto" integer,
	"tipo" text,
	"pais" text,
	"activo" boolean DEFAULT true,
	"ultimo_uso" text
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"ip" text,
	"fingerprint" text,
	"user_agent" text,
	"location" text,
	"last_activity" timestamp DEFAULT now(),
	"expires_at" text
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"card_id" integer,
	"store_id" text,
	"monto" double precision NOT NULL,
	"concepto" text,
	"estado" text DEFAULT 'pending',
	"tipo" text,
	"ip_usada" text,
	"fingerprint" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"nombre" text NOT NULL,
	"direccion" text,
	"telefono" text,
	"avatar" text DEFAULT '👤',
	"device_fingerprint" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;