import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createHash, randomUUID } from "crypto";

const BCRYPT_SALT_ROUNDS = 12;

const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function checkRateLimit(email: string): { allowed: boolean; remainingMs: number } {
  const now = Date.now();
  const record = loginAttempts.get(email.toLowerCase().trim());
  if (!record) return { allowed: true, remainingMs: 0 };
  if (now - record.firstAttempt > LOCKOUT_MS) {
    loginAttempts.delete(email.toLowerCase().trim());
    return { allowed: true, remainingMs: 0 };
  }
  return { allowed: record.count < MAX_ATTEMPTS, remainingMs: LOCKOUT_MS - (now - record.firstAttempt) };
}

function recordAttempt(email: string, success: boolean): void {
  const key = email.toLowerCase().trim();
  if (success) {
    loginAttempts.delete(key);
    return;
  }
  const now = Date.now();
  const existing = loginAttempts.get(key);
  if (!existing || now - existing.firstAttempt > LOCKOUT_MS) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
  } else {
    existing.count++;
  }
}

declare module "next-auth" {
  interface Session {
    jti?: string;
    lastRefresh?: number;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const rateCheck = checkRateLimit(email);
        if (!rateCheck.allowed) {
          const mins = Math.ceil(rateCheck.remainingMs / 60000);
          throw new Error(`Demasiados intentos. Intenta de nuevo en ${mins} minuto(s).`);
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email));

        if (!user) {
          recordAttempt(email, false);
          return null;
        }

        const hash = user.passwordHash;
        const isBcrypt = hash.startsWith("$2a$") || hash.startsWith("$2b$");

        let isValid: boolean;
        if (isBcrypt) {
          isValid = await bcrypt.compare(password, hash);
        } else {
          isValid = createHash("sha256").update(password).digest("hex") === hash;
        }

        if (!isValid) {
          recordAttempt(email, false);
          return null;
        }

        recordAttempt(email, true);

        if (!isBcrypt) {
          const newHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
          await db.update(users)
            .set({ passwordHash: newHash })
            .where(eq(users.id, user.id));
        }

        return {
          id: String(user.id),
          email: user.email,
          name: user.nombre,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60,
    updateAge: 60 * 5,
  },
  jwt: {
    maxAge: 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.jti = randomUUID();
        token.lastRefresh = Date.now();
      }
      if (trigger === "update") {
        token.jti = randomUUID();
        token.lastRefresh = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.jti = token.jti as string;
        session.lastRefresh = token.lastRefresh as number;
      }
      return session;
    },
  },
});
