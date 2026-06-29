import { auth } from "@/lib/auth";
import { ProxyRotator } from "@/lib/anti-fraud/proxy-rotator";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const rotator = new ProxyRotator();
  const result = await rotator.rotateForTransaction(session.user.id);

  return NextResponse.json({
    proxy: result.proxy,
    rotated: result.rotated,
    pool: rotator.getPoolStats(),
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const rotator = new ProxyRotator();
  return NextResponse.json(rotator.getPoolStats());
}
