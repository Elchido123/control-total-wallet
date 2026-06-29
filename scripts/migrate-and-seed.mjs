import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import bcrypt from "bcryptjs";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("🔄 Aplicando migraciones...");

  try { await sql`ALTER TABLE "cards" DROP CONSTRAINT IF EXISTS "cards_user_id_users_id_fk"`; } catch {}
  try { await sql`ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "sessions_user_id_users_id_fk"`; } catch {}
  try { await sql`ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_user_id_users_id_fk"`; } catch {}
  try { await sql`ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_card_id_cards_id_fk"`; } catch {}

  try { await sql`ALTER TABLE "cards" ALTER COLUMN "user_id" SET NOT NULL`; } catch (e) { console.log("  skip:", e.message.substring(0, 60)); }
  try { await sql`ALTER TABLE "cards" DROP COLUMN IF EXISTS "cvv"`; } catch {}

  try {
    await sql`ALTER TABLE "cards" ALTER COLUMN "bloqueada_hasta" TYPE timestamp USING bloqueada_hasta::timestamp WITHOUT TIME ZONE`;
  } catch { console.log("  skip: bloqueada_hasta type (already timestamp or text)"); }

  try {
    await sql`ALTER TABLE "proxies" ALTER COLUMN "ultimo_uso" TYPE timestamp USING ultimo_uso::timestamp WITHOUT TIME ZONE`;
  } catch {}

  try {
    await sql`ALTER TABLE "sessions" ALTER COLUMN "expires_at" TYPE timestamp USING expires_at::timestamp WITHOUT TIME ZONE`;
  } catch {}

  try { await sql`ALTER TABLE "sessions" ALTER COLUMN "user_id" SET NOT NULL`; } catch {}
  try { await sql`ALTER TABLE "transactions" ALTER COLUMN "user_id" SET NOT NULL`; } catch {}

  try { await sql`ALTER TABLE "cards" ADD CONSTRAINT "cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE`; } catch {}
  try { await sql`ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE`; } catch {}
  try { await sql`ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE`; } catch {}
  try { await sql`ALTER TABLE "transactions" ADD CONSTRAINT "transactions_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE SET NULL`; } catch {}

  try { await sql`CREATE UNIQUE INDEX IF NOT EXISTS "cards_numero_idx" ON "cards" ("numero")`; } catch {}
  try { await sql`CREATE INDEX IF NOT EXISTS "cards_user_id_idx" ON "cards" ("user_id")`; } catch {}
  try { await sql`CREATE INDEX IF NOT EXISTS "proxies_activo_idx" ON "proxies" ("activo")`; } catch {}
  try { await sql`CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions" ("user_id")`; } catch {}
  try { await sql`CREATE INDEX IF NOT EXISTS "transactions_user_id_idx" ON "transactions" ("user_id")`; } catch {}
  try { await sql`CREATE INDEX IF NOT EXISTS "transactions_card_id_idx" ON "transactions" ("card_id")`; } catch {}
  try { await sql`CREATE INDEX IF NOT EXISTS "transactions_store_id_idx" ON "transactions" ("store_id")`; } catch {}
  try { await sql`CREATE INDEX IF NOT EXISTS "transactions_created_at_idx" ON "transactions" ("created_at")`; } catch {}
  try { await sql`CREATE INDEX IF NOT EXISTS "transactions_estado_idx" ON "transactions" ("estado")`; } catch {}
  try { await sql`CREATE INDEX IF NOT EXISTS "transactions_tipo_idx" ON "transactions" ("tipo")`; } catch {}

  try { await sql`ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "cooldown_reason" text`; } catch {}
  try { await sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "temporal_state" text`; } catch {}

  console.log("✅ Migraciones aplicadas");

  console.log("🔄 Sembrando datos...");

  const users = [
    { email: "armando@example.com", password: "armando123", nombre: "Armando" },
    { email: "juan@example.com", password: "1234", nombre: "Juan Pérez" },
    { email: "maria@example.com", password: "password456", nombre: "María López" },
    { email: "carlos@example.com", password: "password789", nombre: "Carlos García" },
  ];

  for (const u of users) {
    const [existing] = await sql`SELECT id FROM users WHERE email = ${u.email}`;
    if (existing) {
      console.log(`  ✓ ${u.nombre} ya existe`);
      continue;
    }
    const passwordHash = await bcrypt.hash(u.password, 12);
    const [user] = await sql`
      INSERT INTO users (email, password_hash, nombre, avatar) VALUES (${u.email}, ${passwordHash}, ${u.nombre}, '👤') RETURNING id
    `;
    const cardNum = "**** **** **** " + String(1000 + Math.floor(Math.random() * 9000));
    await sql`
      INSERT INTO cards (user_id, numero, titular, expiracion, saldo, limite, activa, banco)
      VALUES (${user.id}, ${cardNum}, ${u.nombre}, '12/28', 10000, 19000, true, 'BBVA')
    `;
    console.log(`  ✓ Usuario creado: ${u.nombre} (${u.email})`);
  }

  console.log("✅ Seed completado");
}

main().catch(console.error);
