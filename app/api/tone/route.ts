import { NextRequest, NextResponse } from "next/server";
import demo from "@/lib/fixtures/demo.json";
import { isFixtureMode, pollTask, submitTask, uploadImageBytes } from "@/lib/youcam";

// POST { imageBase64 } (face crop) -> { mode, tone }
export async function POST(req: NextRequest) {
  const { imageBase64 } = (await req.json().catch(() => ({}))) as { imageBase64?: string };
  if (!imageBase64 && isFixtureMode()) {
    return NextResponse.json({ mode: "fixture", tone: { skinHex: demo.skin.skinHex, undertone: demo.skin.undertone } });
  }
  if (!imageBase64) return NextResponse.json({ error: "imageBase64 required" }, { status: 400 });
  if (isFixtureMode()) {
    return NextResponse.json({ mode: "fixture", tone: { skinHex: demo.skin.skinHex, undertone: demo.skin.undertone } });
  }
  try {
    const bytes = Buffer.from(imageBase64.split(",").pop() || "", "base64");
    const fileId = await uploadImageBytes("skin-tone-analysis", bytes);
    const taskId = await submitTask("/s2s/v2.0/task/skin-tone-analysis", { src_file_id: fileId });
    const result = await pollTask<unknown>((id) => `/s2s/v2.0/task/skin-tone-analysis/${id}`, taskId);
    return NextResponse.json({ mode: "live", tone: result });
  } catch (e) {
    return NextResponse.json({
      mode: "fixture-fallback",
      warning: String(e).slice(0, 300),
      tone: { skinHex: demo.skin.skinHex, undertone: demo.skin.undertone },
    });
  }
}
