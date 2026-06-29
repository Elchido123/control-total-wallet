import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { FraudPipeline } from "@/lib/anti-fraud/pipeline";
import { findSiteByHostname } from "@/lib/integration/sites";
import { NextResponse } from "next/server";
import { safeUserId } from "@/lib/utils/format";

export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json();
  const { site, monto, url, action } = body;

  if (action === "validate") {
    const siteConfig = findSiteByHostname(site ?? "");
    return NextResponse.json({
      supported: !!siteConfig,
      site: siteConfig ?? null,
    });
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!monto || !site) {
    return NextResponse.json(
      { error: "Faltan datos requeridos (monto, site)" },
      { status: 400 }
    );
  }

  const montoNum = parseFloat(monto);
  if (isNaN(montoNum) || montoNum <= 0) {
    return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
  }

  if (montoNum > 19000) {
    return NextResponse.json(
      { error: "Monto excede el límite de $19,000 MXN" },
      { status: 400 }
    );
  }

  const userId = safeUserId(session.user.id);
  if (!userId) return NextResponse.json({ error: "ID de usuario inválido" }, { status: 400 });

  const pipeline = new FraudPipeline();
  const validation = await pipeline.validate({
    userId,
    monto: montoNum,
    storeId: site,
  });

  if (!validation.canProceed) {
    const errorCheck = validation.checks.find(
      (c) => !c.passed && c.severity === "error"
    );
    return NextResponse.json(
      {
        success: false,
        error: errorCheck?.message ?? "Validación anti-fraud fallida",
        checks: validation.checks,
      },
      { status: 400 }
    );
  }

  const [result] = await db
    .insert(transactions)
    .values({
      userId,
      monto: montoNum,
      concepto: `Pago vía integración en ${site}`,
      estado: "pending",
      tipo: "gasto",
      metadata: JSON.stringify({ site, url, integrationType: "api" }),
    })
    .returning();

  return NextResponse.json({
    success: true,
    transactionId: result.id,
    transaction: result,
    fraudChecks: validation.checks,
    proxyAssigned: validation.proxyAssigned,
  });
}

export async function GET() {
  const sites = [
    { id: "mercadolibre", name: "Mercado Libre", type: "ecommerce" },
    { id: "paypal", name: "PayPal", type: "payments" },
    { id: "amazon", name: "Amazon", type: "ecommerce" },
    { id: "shein", name: "Shein", type: "ecommerce" },
    { id: "liverpool", name: "Liverpool", type: "ecommerce" },
    { id: "walmart", name: "Walmart", type: "ecommerce" },
    { id: "uber", name: "Uber", type: "services" },
    { id: "rappi", name: "Rappi", type: "services" },
    { id: "didi", name: "Didi", type: "services" },
  ];

  return NextResponse.json({ sites, total: sites.length });
}
