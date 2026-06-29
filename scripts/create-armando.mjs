import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import bcrypt from "bcryptjs";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

function luhnGenerate() {
  let digits = "4";
  for (let i = 0; i < 14; i++) digits += Math.floor(Math.random() * 10);
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    alt = !alt;
  }
  const check = (10 - (sum % 10)) % 10;
  return digits + check;
}

async function main() {
  const email = "armando@example.com";
  const password = "armando123";
  const passwordHash = await bcrypt.hash(password, 12);

  await sql`ALTER TABLE "cards" DROP COLUMN IF EXISTS "cvv"`;
  await sql`DELETE FROM cards WHERE user_id IN (SELECT id FROM users WHERE email = ${email})`;
  await sql`DELETE FROM users WHERE email = ${email}`;

  const [user] = await sql`
    INSERT INTO users (email, password_hash, nombre, avatar, direccion, telefono)
    VALUES (${email}, ${passwordHash}, 'Armando', '👤', NULL, NULL)
    RETURNING id
  `;

  const cardNum = luhnGenerate();
  const formatted = `**** **** **** ${cardNum.slice(-4)}`;

  await sql`
    INSERT INTO cards (user_id, numero, titular, expiracion, saldo, limite, activa, banco)
    VALUES (${user.id}, ${formatted}, 'Armando', '12/28', 0, 19000, true, NULL)
  `;

  console.log(`✓ Usuario creado: Armando (${email})`);
  console.log(`  Contraseña: ${password}`);
  console.log(`  Tarjeta: ${formatted}`);
}

main().catch(console.error);
