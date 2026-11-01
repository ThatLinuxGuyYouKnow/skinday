import { NextRequest, NextResponse } from "next/server";
import demo from "@/lib/fixtures/demo.json";
import { isFixtureMode, pollTask, submitTask, uploadImageBytes } from "@/lib/youcam";

// POST { imageBase64, effects } -> { mode, result }
// Correct shape (verified live 2026-11-01): { version:'1.0', src_file_id, effects:[
//   { category:'foundation', palettes:[{color, colorIntensity, glowIntensity, coverageIntensity}] },
//   { category:'lip_color', shape:{name:'original'}, style:{type:'full'},
//     palettes:[{color, texture:'sheer', colorIntensity, transparencyIntensity}] },
//   { category:'blush', pattern:{name:'1color1'}, palettes:[{color, texture:'matte', colorIntensity}] }
// ]}
// lip_color REQUIRES style; sheer REQUIRES transparencyIntensity. Rejects cost nothing.
export async function POST(req: NextRequest) {
  const { imageBase64, effects } = (await req.json().catch(() => ({}))) as {
    imageBase64?: string;
    effects?: unknown[];
  };
  const defaultEffects = [
    { category: "foundation", palettes: [{ color: "#b0896c", colorIntensity: 60, glowIntensity: 40, coverageIntensity: 60 }] },
    { category: "lip_color", shape: { name: "original" }, style: { type: "full" }, palettes: [{ color: "#8e2f45", texture: "sheer", colorIntensity: 70, transparencyIntensity: 50 }] },
    { category: "blush", pattern: { name: "1color1" }, palettes: [{ color: "#c98a8a", texture: "matte", colorIntensity: 50 }] },
  ];
  if (!imageBase64 && isFixtureMode()) {
    return NextResponse.json({ mode: "fixture", result: demo.images.makeupResult, effects: effects ?? defaultEffects });
  }
  if (!imageBase64) return NextResponse.json({ error: "imageBase64 required" }, { status: 400 });
  if (isFixtureMode()) {
    return NextResponse.json({ mode: "fixture", result: demo.images.makeupResult, effects: effects ?? defaultEffects });
  }
  try {
    const bytes = Buffer.from(imageBase64.split(",").pop() || "", "base64");
    const fileId = await uploadImageBytes("makeup", bytes);
    const taskId = await submitTask("/s2s/v2.0/task/makeup-vto", {
      version: "1.0",
      src_file_id: fileId,
      effects: effects ?? defaultEffects,
    });
    const result = await pollTask<unknown>((id) => `/s2s/v2.0/task/makeup-vto/${id}`, taskId);
    return NextResponse.json({ mode: "live", result });
  } catch (e) {
    return NextResponse.json({ mode: "fixture-fallback", warning: String(e).slice(0, 300), result: demo.images.makeupResult });
  }
}
