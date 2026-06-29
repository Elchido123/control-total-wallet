import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL);

async function main() {
  // Check Armando
  const users = await sql`SELECT id, email, nombre, avatar, direccion, telefono FROM users WHERE email = 'armando@example.com'`;
  console.log("User:", JSON.stringify(users, null, 2));
  const cards = await sql`SELECT * FROM cards WHERE user_id = ${users[0].id}`;
  console.log("Card:", JSON.stringify(cards, null, 2));
  const txs = await sql`SELECT count(*) as cnt FROM transactions WHERE user_id = ${users[0].id}`;
  console.log("Transactions:", txs);
}

main().catch(console.error);
