import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL no definida");

const sql = neon(DATABASE_URL);
export const db = drizzle(sql);
