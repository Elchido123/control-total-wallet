import { auth } from "@/lib/auth";
import { FraudPipeline } from "@/lib/anti-fraud/pipeline";
import { NextResponse } from "next/server";
import { safeUserId } from "@/lib/utils/format";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { monto, cardId, storeId } = body;

  const userId = safeUserId(session.user.id);
  if (!userId) {
    return NextResponse.json({ error: "ID de usuario inválido" }, { status: 400 });
  }

  const pipeline = new FraudPipeline();
  const result = await pipeline.validate({
    userId,
    cardId,
    monto: monto ?? 0,
    storeId,
  });

  return NextResponse.json(result);
}
