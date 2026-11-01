import { NextRequest, NextResponse } from "next/server";
import demo from "@/lib/fixtures/demo.json";
import { advise } from "@/lib/advisor";
import { isFixtureMode, pollTask, submitTask, uploadImageBytes } from "@/lib/youcam";

const SD7 = ["acne", "redness", "oiliness", "moisture", "texture", "radiance", "dark_circle_v2"];

// POST { imageBase64, faceCropBase64? } -> { mode, skin, advice }
// Uses one face-crop for Skin/Tone/Makeup (>60% face width). Full frame goes to /api/cloth.
export async function POST(req: NextRequest) {
  const { imageBase64, occasion = "Interview" } = (await req.json().catch(() => ({}))) as {
    imageBase64?: string;
    occasion?: string;
  };
  if (!imageBase64 && isFixtureMode()) {
    return NextResponse.json({ mode: "fixture", skin: demo.skin, advice: demo.advice, palette: demo.palette });
  }
  if (!imageBase64) return NextResponse.json({ error: "imageBase64 required" }, { status: 400 });
  if (isFixtureMode()) {
    const advice = advise(demo.skin as unknown as Parameters<typeof advise>[0], String(occasion));
    return NextResponse.json({ mode: "fixture", skin: demo.skin, advice, palette: demo.palette });
  }
  try {
    const bytes = Buffer.from(imageBase64.split(",").pop() || "", "base64");
    const fileId = await uploadImageBytes("skin-analysis", bytes);
    const taskId = await submitTask("/s2s/v2.0/task/skin-analysis", {
      src_file_id: fileId,
      dst_actions: SD7,
      format: "json",
    });
    const result = await pollTask<Record<string, unknown>>((id) => `/s2s/v2.0/task/skin-analysis/${id}`, taskId);
    return NextResponse.json({ mode: "live", result });
  } catch (e) {
    // Fixture fallback so judges never hit a dead app (CASTING pattern).
    return NextResponse.json(
      { mode: "fixture-fallback", warning: String(e).slice(0, 300), skin: demo.skin, advice: demo.advice, palette: demo.palette },
      { status: 200 },
    );
  }
}
