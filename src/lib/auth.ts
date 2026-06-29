import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";

const BCRYPT_SALT_ROUNDS = 12;

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

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email));

        if (!user) return null;

        const hash = user.passwordHash;
        const isBcrypt = hash.startsWith("$2a$") || hash.startsWith("$2b$");

        let isValid: boolean;
        if (isBcrypt) {
          isValid = await bcrypt.compare(password, hash);
        } else {
          isValid = createHash("sha256").update(password).digest("hex") === hash;
        }

        if (!isValid) return null;

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
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
