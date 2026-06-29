import { SITES, SITE_LIST } from "@/lib/integration/sites";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const hostname = searchParams.get("hostname");

  if (hostname) {
    for (const key of Object.keys(SITES)) {
      if (hostname.includes(key)) {
        return NextResponse.json({ supported: true, site: SITES[key] });
      }
    }
    return NextResponse.json({ supported: false, site: null });
  }

  return NextResponse.json({
    sites: SITE_LIST,
    total: SITE_LIST.length,
  });
}
