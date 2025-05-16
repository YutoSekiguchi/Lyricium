import { generateLyrics } from "@/services/openai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { selectedChemical, style } = await request.json();

  if (!selectedChemical || !style) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const result = await generateLyrics(selectedChemical, style);
  if (!result || !result.lyrics || !result.title) {
    return NextResponse.json({ error: "Failed to generate lyrics." }, { status: 500 });
  }
  console.log("Generated title & lyrics:", result);
  return NextResponse.json(result);
}