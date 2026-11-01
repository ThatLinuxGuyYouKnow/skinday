import { NextRequest, NextResponse } from "next/server";
import demo from "@/lib/fixtures/demo.json";
import { isFixtureMode, pollTask, submitTask, uploadImageBytes } from "@/lib/youcam";

// POST { imageBase64 (FULL frame, shoulders visible), garmentUrl or refBase64, garmentCategory }
// Clothes rejects face-crops with error_no_shoulder — always send full frame here.
export async function POST(req: NextRequest) {
  const { imageBase64, garmentUrl, refBase64, garmentCategory = "upper_body" } = (await req.json().catch(() => ({}))) as {
    imageBase64?: string;
    garmentUrl?: string;
    refBase64?: string;
    garmentCategory?: string;
  };
  if (!imageBase64 && isFixtureMode()) {
    return NextResponse.json({ mode: "fixture", result: demo.images.clothResult, garmentCategory });
  }
  if (!imageBase64) return NextResponse.json({ error: "imageBase64 (full frame) required" }, { status: 400 });
  if (isFixtureMode()) return NextResponse.json({ mode: "fixture", result: demo.images.clothResult, garmentCategory });
  try {
    const bytes = Buffer.from(imageBase64.split(",").pop() || "", "base64");
    const srcId = await uploadImageBytes("cloth-v4", bytes);
    const body: Record<string, unknown> = { src_file_id: srcId, garment_category: garmentCategory };
    if (garmentUrl) body.ref_file_url = garmentUrl;
    else if (refBase64) {
      const refBytes = Buffer.from(refBase64.split(",").pop() || "", "base64");
      body.ref_file_id = await uploadImageBytes("cloth-v4", refBytes);
    } else return NextResponse.json({ error: "garmentUrl or refBase64 required" }, { status: 400 });
    const taskId = await submitTask("/s2s/v2.0/task/cloth-v4", body);
    const result = await pollTask<unknown>((id) => `/s2s/v2.0/task/cloth-v4/${id}`, taskId, { tries: 40, delayMs: 2000 });
    return NextResponse.json({ mode: "live", result });
  } catch (e) {
    return NextResponse.json({ mode: "fixture-fallback", warning: String(e).slice(0, 300), result: demo.images.clothResult });
  }
}
