import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { safeUserId } from "@/lib/utils/format";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const userId = safeUserId(session.user.id);
  if (!userId) return NextResponse.json({ error: "ID de usuario inválido" }, { status: 400 });
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    avatar: user.avatar,
    direccion: user.direccion,
    telefono: user.telefono,
  });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const userId = safeUserId(session.user.id);
  if (!userId) return NextResponse.json({ error: "ID de usuario inválido" }, { status: 400 });
  const body = await req.json();
  const { nombre, direccion, telefono, avatar } = body;

  const updates: Record<string, unknown> = {};
  if (nombre !== undefined) updates.nombre = nombre;
  if (direccion !== undefined) updates.direccion = direccion;
  if (telefono !== undefined) updates.telefono = telefono;
  if (avatar !== undefined) updates.avatar = avatar;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Sin datos para actualizar" }, { status: 400 });
  }

  await db.update(users).set(updates).where(eq(users.id, userId));

  const [updated] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  return NextResponse.json({
    id: updated?.id,
    email: updated?.email,
    nombre: updated?.nombre,
    avatar: updated?.avatar,
    direccion: updated?.direccion,
    telefono: updated?.telefono,
  });
}
