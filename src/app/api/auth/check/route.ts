import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { valid: false, error: "No autorizado" },
      { status: 401 }
    );
  }

  const elapsed = session.lastRefresh
    ? Date.now() - session.lastRefresh
    : 0;
  const isExpired = elapsed > 60 * 60 * 1000;

  return NextResponse.json({
    valid: !isExpired,
    userId: session.user.id,
    jti: session.jti,
    lastRefresh: session.lastRefresh,
    expiresIn: Math.max(0, 60 * 60 * 1000 - elapsed),
  });
}
