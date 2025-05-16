import { generatePhoto } from "@/services/openai";
import { NextResponse } from "next/server";

/**
 * POST /openai/api/response/photo
 * body: { selectedChemical: { name, color, type }, style: string }
 * → DALL·E (gpt-image-1) でジャケット画像を生成して URL を返す
 */
export async function POST(request: Request) {
  try {
    const { selectedChemical, style } = await request.json();

    if (!selectedChemical || !style) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }

    // 画像生成用プロンプト
    const imageUrl = await generatePhoto({
      selectedChemical,
      style,
    });
    if (!imageUrl) {
      return NextResponse.json(
        { error: "Failed to generate image." },
        { status: 500 },
      );
    }
    console.log("Generated image URL:", imageUrl);
    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error("OpenAI image error:", err);
    return NextResponse.json(
      { error: "Failed to generate image." },
      { status: 500 },
    );
  }
}