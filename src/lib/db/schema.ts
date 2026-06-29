import { pgTable, serial, text, integer, doublePrecision, boolean, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nombre: text("nombre").notNull(),
  direccion: text("direccion"),
  telefono: text("telefono"),
  avatar: text("avatar").default("👤"),
  deviceFingerprint: text("device_fingerprint"),
  temporalState: text("temporal_state"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  numero: text("numero").notNull(),
  titular: text("titular").notNull(),
  expiracion: text("expiracion").notNull(),
  saldo: doublePrecision("saldo").default(0),
  limite: doublePrecision("limite").default(19000),
  activa: boolean("activa").default(true),
  bloqueada: boolean("bloqueada").default(false),
  bloqueadaHasta: timestamp("bloqueada_hasta"),
  cooldownReason: text("cooldown_reason"),
  banco: text("banco"),
}, (table) => [
  uniqueIndex("cards_numero_idx").on(table.numero),
  index("cards_user_id_idx").on(table.userId),
]);

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cardId: integer("card_id").references(() => cards.id, { onDelete: "set null" }),
  storeId: text("store_id"),
  monto: doublePrecision("monto").notNull(),
  concepto: text("concepto"),
  estado: text("estado").default("pending"),
  tipo: text("tipo"),
  ipUsada: text("ip_usada"),
  fingerprint: text("fingerprint"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("transactions_user_id_idx").on(table.userId),
  index("transactions_card_id_idx").on(table.cardId),
  index("transactions_store_id_idx").on(table.storeId),
  index("transactions_created_at_idx").on(table.createdAt),
  index("transactions_estado_idx").on(table.estado),
  index("transactions_tipo_idx").on(table.tipo),
]);

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  ip: text("ip"),
  fingerprint: text("fingerprint"),
  userAgent: text("user_agent"),
  location: text("location"),
  lastActivity: timestamp("last_activity").defaultNow(),
  expiresAt: timestamp("expires_at"),
}, (table) => [
  index("sessions_user_id_idx").on(table.userId),
]);

export const proxies = pgTable("proxies", {
  id: serial("id").primaryKey(),
  ip: text("ip").notNull(),
  puerto: integer("puerto"),
  tipo: text("tipo"),
  pais: text("pais"),
  activo: boolean("activo").default(true),
  ultimoUso: timestamp("ultimo_uso"),
}, (table) => [
  index("proxies_activo_idx").on(table.activo),
]);
