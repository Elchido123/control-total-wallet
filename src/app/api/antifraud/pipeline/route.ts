import { auth } from "@/lib/auth";
import { FraudPipeline } from "@/lib/anti-fraud/pipeline";
import { NextResponse } from "next/server";
import { safeUserId } from "@/lib/utils/format";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const { monto, cardId, storeId } = body as { monto?: number; cardId?: number; storeId?: string };

  if (typeof monto !== "number" || monto <= 0) {
    return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
  }

  const userId = safeUserId(session.user.id);
  if (!userId) {
    return NextResponse.json({ error: "ID de usuario inválido" }, { status: 400 });
  }

  const pipeline = new FraudPipeline();
  const result = await pipeline.validate({
    userId,
    cardId,
    monto,
    storeId,
  });

  return NextResponse.json(result);
}
