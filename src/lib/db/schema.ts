import { pgTable, serial, text, integer, doublePrecision, boolean, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nombre: text("nombre").notNull(),
  direccion: text("direccion"),
  telefono: text("telefono"),
  avatar: text("avatar").default("👤"),
  deviceFingerprint: text("device_fingerprint"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  numero: text("numero").notNull(),
  titular: text("titular").notNull(),
  expiracion: text("expiracion").notNull(),
  cvv: text("cvv").notNull(),
  saldo: doublePrecision("saldo").default(0),
  limite: doublePrecision("limite").default(19000),
  activa: boolean("activa").default(true),
  bloqueada: boolean("bloqueada").default(false),
  bloqueadaHasta: text("bloqueada_hasta"),
  banco: text("banco"),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  cardId: integer("card_id").references(() => cards.id),
  storeId: text("store_id"),
  monto: doublePrecision("monto").notNull(),
  concepto: text("concepto"),
  estado: text("estado").default("pending"),
  tipo: text("tipo"),
  ipUsada: text("ip_usada"),
  fingerprint: text("fingerprint"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  ip: text("ip"),
  fingerprint: text("fingerprint"),
  userAgent: text("user_agent"),
  location: text("location"),
  lastActivity: timestamp("last_activity").defaultNow(),
  expiresAt: text("expires_at"),
});

export const proxies = pgTable("proxies", {
  id: serial("id").primaryKey(),
  ip: text("ip").notNull(),
  puerto: integer("puerto"),
  tipo: text("tipo"),
  pais: text("pais"),
  activo: boolean("activo").default(true),
  ultimoUso: text("ultimo_uso"),
});
