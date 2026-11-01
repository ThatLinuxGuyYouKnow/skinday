import { NextResponse } from "next/server";
import { getCredit, getFeatureCost, isFixtureMode } from "@/lib/youcam";

// GET -> { mode, credit, featureCost } — circuit-breaker: check before live runs.
export async function GET() {
  if (isFixtureMode()) return NextResponse.json({ mode: "fixture", credit: null, featureCost: null });
  try {
    const [credit, featureCost] = await Promise.all([getCredit(), getFeatureCost()]);
    return NextResponse.json({ mode: "live", credit, featureCost });
  } catch (e) {
    return NextResponse.json({ mode: "error", error: String(e).slice(0, 300) }, { status: 502 });
  }
}
