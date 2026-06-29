import { db } from "@/lib/db";
import { users, cards, transactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const BCRYPT_SALT_ROUNDS = 12;

function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

const SEED_USERS = [
  {
    email: "juan@example.com",
    password: "1234",
    nombre: "Juan Pérez",
    avatar: "👨‍💼",
    saldo: 12450,
    tarjeta: "**** **** **** 4523",
    movimientos: [
      { concepto: "Mercado Libre", monto: -350, tipo: "gasto" },
      { concepto: "PayPal recibido", monto: 500, tipo: "ingreso" },
      { concepto: "Amazon", monto: -1200, tipo: "gasto" },
      { concepto: "Transferencia", monto: 3000, tipo: "ingreso" },
    ],
  },
  {
    email: "maria@example.com",
    password: "password456",
    nombre: "María López",
    avatar: "👩‍💻",
    saldo: 8200.5,
    tarjeta: "**** **** **** 7891",
    movimientos: [
      { concepto: "Shein", monto: -890, tipo: "gasto" },
      { concepto: "Depósito", monto: 2000, tipo: "ingreso" },
      { concepto: "Liverpool", monto: -1500, tipo: "gasto" },
    ],
  },
  {
    email: "carlos@example.com",
    password: "password789",
    nombre: "Carlos García",
    avatar: "👨‍🔧",
    saldo: 15000,
    tarjeta: "**** **** **** 3456",
    movimientos: [
      { concepto: "Uber", monto: -185, tipo: "gasto" },
      { concepto: "Nómina", monto: 15000, tipo: "ingreso" },
    ],
  },
];

async function seed() {
  for (const u of SEED_USERS) {
    const passwordHash = await hashPassword(u.password);

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, u.email));

    if (existing) continue;

    const [result] = await db
      .insert(users)
      .values({
        email: u.email,
        passwordHash,
        nombre: u.nombre,
        avatar: u.avatar,
      })
      .returning();

    await db.insert(cards).values({
      userId: result.id,
      numero: u.tarjeta,
      titular: u.nombre,
      expiracion: "12/28",
      cvv: "123",
      saldo: u.saldo,
    });

    for (const m of u.movimientos) {
      await db.insert(transactions).values({
        userId: result.id,
        cardId: result.id,
        monto: Math.abs(m.monto),
        concepto: m.concepto,
        estado: "approved",
        tipo: m.tipo,
        storeId: m.concepto.toLowerCase().replace(/\s+/g, "-"),
      });
    }

    console.log(`✓ Usuario creado: ${u.nombre} (${u.email})`);
  }

  console.log("✅ Seed completado");
}

seed().catch(console.error);
