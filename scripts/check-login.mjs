import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import bcrypt from "bcryptjs";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

async function main() {
  const tests = [
    { email: "maria@example.com", password: "password456" },
    { email: "juan@example.com", password: "1234" },
    { email: "armando@example.com", password: "armando123" },
  ];

  for (const t of tests) {
    const [user] = await sql`SELECT email, password_hash, nombre FROM users WHERE email = ${t.email}`;
    if (!user) {
      console.log(`❌ ${t.email}: usuario no encontrado`);
      continue;
    }
    const match = await bcrypt.compare(t.password, user.password_hash);
    console.log(`${match ? "✅" : "❌"} ${t.email} / ${t.password}: ${match ? "OK" : "CONTRASEÑA INCORRECTA"}`);
  }
}

main().catch(console.error);
