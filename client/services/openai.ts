import OpenAI from "openai";
import { uploadImage } from "./upload";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


export const generatePhoto = async ({
  selectedChemical,
  style,
}: {
  selectedChemical: { name: string; color: string };
  style: string;
}) => {
  const prompt = `Create an album cover artwork inspired by the chemical substance ${
    selectedChemical.name
  } (${selectedChemical.color}) and the musical style "${style}". 
  The design should be abstract, artistic, and memorable, without any text.`;

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        n: 1,
        size: "1024x1024",
        response_format: "url",
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI image error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const imageUrl = data.data?.[0]?.url;
    if (!imageUrl) throw new Error("No image URL returned");

    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();
    const imageFile = new File([imageBlob], "generated.png", { type: "image/png" });
    const uploadedUrl = await uploadImage(imageFile);
    return uploadedUrl;
  } catch (err) {
    console.error("Error generating jacket image:", err);
    throw err;
  }
};

export const generateLyrics = async (
  selectedChemical: { name: string; color: string; type: string },
  style: string,
): Promise<{ title: string; lyrics: string }> => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "あなたは詩的で創造的な作詞家です。JSON で {\"title\":\"...\",\"lyrics\":\"...\"} の形でだけ返してください。",
        },
        {
          role: "user",
          content: `以下の条件に基づいて曲のタイトルと歌詞を別々に生成してください。
             
- 化学物質: ${selectedChemical.name}（${selectedChemical.color}）
- 特性: ${selectedChemical.type}
- 曲調: ${style}

出力は必ず JSON オブジェクトで:
{
  "title": "タイトルのみ",
  "lyrics": "歌詞全文（Aメロ、Bメロ、サビ等のラベルは含めない）"
}`,
        },
      ],
      temperature: 0.8,
      max_tokens: 1024,
    });

    const raw = completion.choices[0].message.content;
    const parsed = JSON.parse(raw);
    return { title: parsed.title, lyrics: parsed.lyrics };
  } catch (error) {
    console.error("Error generating lyrics & title:", error);
    throw new Error("Failed to generate lyrics");
  }
};