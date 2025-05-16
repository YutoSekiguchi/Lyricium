"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useRef } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";
import { toast } from "sonner";
import { uploadAudio } from "@/services/upload";
import { createSong } from "@/services/song";
import { getUserByEmail } from "@/services/user";
import Cookies from "js-cookie";

type ChemColor = {
  name: string;
  symbol: string;
  color: string;
  type: "炎色反応" | "色付き化合物";
  detail?: string;
};

const CHEM_COLORS: ChemColor[] = [
  { name: "リチウム", symbol: "Li", color: "赤", type: "炎色反応" },
  { name: "ナトリウム", symbol: "Na", color: "黄", type: "炎色反応" },
  { name: "カリウム", symbol: "K", color: "赤紫", type: "炎色反応" },
  { name: "カルシウム", symbol: "Ca", color: "橙赤", type: "炎色反応" },
  { name: "ストロンチウム", symbol: "Sr", color: "紅", type: "炎色反応" },
  { name: "バリウム", symbol: "Ba", color: "黄緑", type: "炎色反応" },
  { name: "銅", symbol: "Cu", color: "青緑", type: "炎色反応" },
  { name: "銅（CuSO₄）", symbol: "CuSO₄", color: "青", type: "色付き化合物" },
  {
    name: "鉄（Fe³⁺）",
    symbol: "FeCl₃",
    color: "赤褐色",
    type: "色付き化合物",
  },
  {
    name: "コバルト（CoCl₂）",
    symbol: "CoCl₂",
    color: "桃",
    type: "色付き化合物",
  },
  { name: "塩化銀", symbol: "AgCl", color: "白", type: "色付き化合物" },
  { name: "ヨウ化鉛", symbol: "PbI₂", color: "黄色", type: "色付き化合物" },
];

const STYLES = ["ポップ", "ロック", "バラード", "EDM", "和風", "子ども向け"];

export default function GenerateMain() {
  const [selectedChemical, setSelectedChemical] = useState<ChemColor | null>(
    null
  );
  const [style, setStyle] = useState<string>("ポップ");
  const [lyrics, setLyrics] = useState("");
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAudioFile(file);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const email = Cookies.get("user_email");
      if (email) {
        const user = await getUserByEmail(email);
        if (user) {
          setUserId(user.id);
        }
      }
    };

    fetchUser();
  }, []);

  const uploadSongAndCreate = async () => {
    console.log("Uploading song...");
    console.log("audioFile", audioFile);
    console.log("lyrics", lyrics);
    console.log("title", title);
    console.log("selectedChemical", selectedChemical);
    console.log("style", style);
    console.log("userId", userId);
    if (
      !audioFile ||
      !lyrics ||
      !title ||
      !selectedChemical ||
      !style
    ) {
      toast("データが足りません", {
        description: "全ての情報を入力してください。",
      });
      return;
    }
    setIsUploading(true);
    try {
      // 1. 音声ファイルをアップロードしてURL取得
      const audioPath = await uploadAudio(audioFile);
      setAudioUrl(audioPath);

      // 2. 楽曲をDBに登録
      await createSong({
        title,
        type: selectedChemical.type,
        color: selectedChemical.color,
        symbol: selectedChemical.symbol,
        chemical_name: selectedChemical.name,
        style: style,
        lyrics,
        image: imageUrl,
        url: audioPath, // ここにアップロードした音声ファイルのパス/URL
        user_id: userId!== null? userId : 1,
      });
      

      toast("アップロード完了！", {
        description: "楽曲がデータベースに保存されました。",
      });
      // 状態クリアなど
      setAudioFile(null);
      fileInputRef.current?.value && (fileInputRef.current.value = "");
      setTitle("");
      setLyrics("");
      setImageUrl("");
      // audioUrlはクリアしない
    } catch (err) {
      toast("楽曲登録に失敗しました", {
        description: "もう一度お試しください。",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const generateContent = async () => {
    if (!selectedChemical || !style || isGenerating) return;
    setIsGenerating(true);
    setLyrics("");
    setImageUrl("");
    try {
      // 1) 歌詞を先に生成
      const resLyrics = await fetch("/openai/api/response/lyric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedChemical, style }),
      });
      const dataLyrics = await resLyrics.json();
      console.log(dataLyrics);
      setTitle(dataLyrics.title || "");
      setLyrics(dataLyrics.lyrics || "生成に失敗しました。");

      // 2) ジャケ写生成開始
      setIsImageLoading(true);
      const resImg = await fetch("/openai/api/response/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedChemical, style }),
      });
      const dataImg = await resImg.json();
      if (dataImg.imageUrl) setImageUrl(dataImg.imageUrl);
    } finally {
      setIsGenerating(false);
      setIsImageLoading(false);
    }
  };

  const selectChemical = (item: ChemColor) => {
    setSelectedChemical((prev) => (prev?.symbol === item.symbol ? null : item));
  };

  const groupByType = (type: ChemColor["type"]) =>
    CHEM_COLORS.filter((item) => item.type === type);

  return (
    <div className="min-h-screen bg-black text-white px-6 py-2">
      <div className="max-w-full mx-auto space-y-4">
        <h1 className="text-md font-bold">作曲</h1>
        {/* === Two‑column layout starts === */}
        <div className="mt-2 flex flex-col md:flex-row md:space-x-8 space-y-2 md:space-y-0">
          {/* === LEFT column === */}
          <div className="w-full md:w-1/2 space-y-4">
            <div className="max-w-5xl mx-auto space-y-4">
              <Carousel
                className="mb-4 max-w-3xl mx-auto"
                plugins={[Autoplay({ delay: 6000, stopOnInteraction: false })]}
                opts={{ loop: true }}
              >
                <CarouselContent>
                  <CarouselItem>
                    <div className="p-6 text-center text-white bg-zinc-800 rounded-lg">
                      <Image
                        src="/use1.png"
                        alt="化学色×音楽"
                        width={300}
                        height={150}
                        onClick={() => setModalImageUrl("/use1.png")}
                        className="cursor-pointer rounded-lg border mx-auto"
                      />
                      ① 化学物質と曲調を選択して歌詞を生成する。
                    </div>
                  </CarouselItem>
                  <CarouselItem>
                    <div className="p-6 text-center text-white bg-zinc-800 rounded-lg">
                      <Image
                        src="/use2.png"
                        alt="化学色×音楽"
                        width={300}
                        height={150}
                        onClick={() => setModalImageUrl("/use2.png")}
                        className="cursor-pointer rounded-lg border mx-auto"
                      />
                      ②
                      歌詞が生成されたら「sunoでミュージックを作成する」をクリック。
                    </div>
                  </CarouselItem>
                  <CarouselItem>
                    <div className="p-6 text-center text-white bg-zinc-800 rounded-lg">
                      <Image
                        src="/use3.png"
                        alt="化学色×音楽"
                        width={300}
                        height={150}
                        onClick={() => setModalImageUrl("/use3.png")}
                        className="cursor-pointer rounded-lg border mx-auto"
                      />
                      ③ 右上のSigninからログインする。
                    </div>
                  </CarouselItem>
                  <CarouselItem>
                    <div className="p-6 text-center text-white bg-zinc-800 rounded-lg">
                      <Image
                        src="/use4.png"
                        alt="化学色×音楽"
                        width={300}
                        height={150}
                        onClick={() => setModalImageUrl("/use4.png")}
                        className="cursor-pointer rounded-lg border mx-auto"
                      />
                      ④ ログインしたら画面上にあるCustomを選択。
                    </div>
                  </CarouselItem>
                  <CarouselItem>
                    <div className="p-6 text-center text-white bg-zinc-800 rounded-lg">
                      <Image
                        src="/use5.png"
                        alt="化学色×音楽"
                        width={300}
                        height={150}
                        onClick={() => setModalImageUrl("/use5.png")}
                        className="cursor-pointer rounded-lg border mx-auto"
                      />
                      ⑤ 歌詞を左上にペースト。
                    </div>
                  </CarouselItem>
                  <CarouselItem>
                    <div className="p-6 text-center text-white bg-zinc-800 rounded-lg">
                      <Image
                        src="/use6.png"
                        alt="化学色×音楽"
                        width={300}
                        height={150}
                        onClick={() => setModalImageUrl("/use6.png")}
                        className="cursor-pointer rounded-lg border mx-auto"
                      />
                      ⑥ 曲が生成されたらその曲をダウンロード。
                    </div>
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>

              {modalImageUrl && (
                <div
                  className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
                  onClick={() => setModalImageUrl(null)}
                >
                  <div onClick={e => e.stopPropagation()} className="relative">
                    <img src={modalImageUrl} alt="拡大画像" className="max-w-[90vw] max-h-[80vh] rounded-lg shadow-2xl" />
                    <button
                      onClick={() => setModalImageUrl(null)}
                      className="absolute top-2 right-2 bg-white/70 rounded-full p-2 hover:bg-white"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              <Card className="bg-zinc-900 border-none">
                <CardContent>
                  <h2 className="text-lg text-white font-bold -mt-2">
                    化学物質を選ぶ
                  </h2>
                </CardContent>
                <CardContent className="space-y-4 text-white">
                  <div>
                    <h3 className="text-sm font-medium mb-3">
                      🔥 炎色反応で色が見える元素
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      {groupByType("炎色反応").map(
                        ({ symbol, name, color, type }) => (
                          <div
                            key={symbol}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={symbol}
                              checked={selectedChemical?.symbol === symbol}
                              onCheckedChange={() =>
                                selectChemical({ symbol, name, color, type })
                              }
                            />
                            <Label htmlFor={symbol}>
                              {name}（{color}）
                            </Label>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-3">
                      🎨 色が特徴的な化合物
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      {groupByType("色付き化合物").map(
                        ({ symbol, name, color, type }) => (
                          <div
                            key={symbol}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={symbol}
                              checked={selectedChemical?.symbol === symbol}
                              onCheckedChange={() =>
                                selectChemical({ symbol, name, color, type })
                              }
                            />
                            <Label htmlFor={symbol}>
                              {name}（{color}）
                            </Label>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-none">
                <CardHeader>
                  <CardTitle className="text-white">🎼 曲調を選ぶ</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={style}
                    onValueChange={(val) => setStyle(val)}
                    className="grid grid-cols-2 gap-3"
                  >
                    {STYLES.map((s) => (
                      <div
                        key={s}
                        className="flex items-center space-x-2 text-white"
                      >
                        <RadioGroupItem value={s} id={`${s}-style`} />
                        <Label htmlFor={`${s}-style`}>{s}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

              <div className="w-full text-center">
                <Button
                  onClick={generateContent}
                  disabled={!selectedChemical || isGenerating}
                  className="w-30% text-black bg-yellow-400 disabled:opacity-50 hover:bg-yellow-300 text-lg font-bold py-6 px-4 cursor-pointer"
                >
                  {isGenerating ? "生成中..." : "歌詞を生成する"}
                </Button>
              </div>
            </div>
          </div>{" "}
          {/* end LEFT column */}
          {/* === RIGHT column === */}
          <div className="w-full md:w-1/2 space-y-6 py-6 px-4 border rounded-2xl border-gray-400">
            {title && (
              <h2 className="mb-4 text-2xl font-bold text-center">{title}</h2>
            )}
            <div className="relative">
              <Textarea
                className="bg-zinc-800 text-white h-48"
                placeholder="ここに歌詞が表示されます"
                readOnly
                value={lyrics}
              />
              {lyrics && (
                <Button
                  onClick={async () => {
                    await navigator.clipboard.writeText(lyrics);
                    const btn = document.activeElement as HTMLButtonElement;
                    const originalText = btn.textContent;
                    btn.textContent = "コピーしました！";
                    setTimeout(() => {
                      btn.textContent = originalText;
                    }, 1000);
                  }}
                  className="absolute top-2 right-2 bg-zinc-700 hover:bg-zinc-600 text-white cursor-pointer"
                  size="sm"
                >
                  コピー
                </Button>
              )}
            </div>

            {lyrics && (
              <a
                href="https://suno.com/create"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center mt-6 mb-2 py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-colors duration-200"
              >
                🎵 suno でミュージックを生成する
              </a>
            )}

            {lyrics && !imageUrl && (
              <div className="mt-4 text-center">
                {isImageLoading ? (
                  <p className="text-gray-400">ジャケ写を生成しています...</p>
                ) : (
                  <></>
                )}
              </div>
            )}

            {imageUrl && (
              <div className="mt-6 flex justify-center">
                <img
                  src={imageUrl}
                  alt="ジャケット画像"
                  className="w-full max-w-md rounded-lg shadow-lg"
                />
              </div>
            )}

            {/* ===== アップロード UI ===== */}
            {lyrics && (
              <div className="mt-6 space-y-4">
                <div className="flex justify-center items-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="block text-white font-bold py-2 pl-2 rounded-lg bg-orange-400 hover:bg-orange-300 w-1/2 cursor-pointer"
                  />
                  <Label className="ml-4 text-white font-bold">
                    ※ 音声ファイルを選択
                  </Label>
                </div>

                <Button
                  onClick={uploadSongAndCreate}
                  disabled={!audioFile || isUploading}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded disabled:opacity-50"
                >
                  {isUploading
                    ? "アップロード中..."
                    : "音声ファイルをアップロード"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
