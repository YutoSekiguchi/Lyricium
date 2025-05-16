"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import Cookies from "js-cookie"
import { Sparkles, Music, ChevronRight, Search, Zap, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAllSongs, getSongByUserId } from "@/services/song";
import { getUserByEmail, getAllUsers } from "@/services/user";

type Song = {
  id: number;
  title: string;
  style: string;
  chemical_name: string;
  color: string;
  image?: string;
  lyrics?: string;
  url?: string;
  user_id: number;
  created_at: string;
};

export default function HomeMain() {
  const router = useRouter();
  const handleGenerateClick = () => {
    router.push("/generate");
  };

  // データごとに分けて管理
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);
  const [styleSongs, setStyleSongs] = useState<{ [style: string]: Song[] }>({});
  const [chemSongs, setChemSongs] = useState<{ [chem: string]: Song[] }>({});
  const [mySongs, setMySongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  // 展開状態
  const [expandRecent, setExpandRecent] = useState(false);
  const [expandMy, setExpandMy] = useState(false);
  const [expandChems, setExpandChems] = useState<{ [chem: string]: boolean }>({});
  const [expandStyles, setExpandStyles] = useState<{ [style: string]: boolean }>({});
  const [usersMap, setUsersMap] = useState<{ [id: number]: string }>({});

  // 代表的なスタイル・ケミカル名をここで列挙して使う
  const styles = ["ポップ", "ロック", "バラード", "EDM", "和風", "子ども向け"];
  const chemicals = ["リチウム", "ナトリウム", "カリウム", "カルシウム", "銅"];

  useEffect(() => {
    async function fetchAll() {
      try {
        const allSongs = await getAllSongs();

        setRecentSongs(
          allSongs
            .slice()
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 10)
        );

        const styleResults: { [style: string]: Song[] } = {};
        styles.forEach((style) => {
          styleResults[style] = allSongs.filter((song) => song.style === style);
        });
        setStyleSongs(styleResults);

        const chemResults: { [chem: string]: Song[] } = {};
        chemicals.forEach((chem) => {
          chemResults[chem] = allSongs.filter((song) => song.chemical_name === chem);
        });
        setChemSongs(chemResults);
      } catch (e) {
        console.error(e);
      }
      // fetch all users and build map
      try {
        const allUsers = await getAllUsers();
        const map: { [id: number]: string } = {};
        allUsers.forEach(u => {
          map[u.id] = u.name || "Unknown";
        });
        setUsersMap(map);
      } catch(e) {
        console.error(e);
      }
      try {
        const user = await getUserByEmail(Cookies.get("user_email") || "");
        if (!user) {
          return;
        }
        const my = await getSongByUserId(user.id);
        setMySongs(my);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // ランダムカテゴリ生成
  const availableStyles = Object.keys(styleSongs).filter(s => styleSongs[s]?.length > 0);
  const randomStyles = availableStyles.sort(() => 0.5 - Math.random()).slice(0, 3);

  const availableChems = Object.keys(chemSongs).filter(c => chemSongs[c]?.length > 0);
  const randomChems = availableChems.sort(() => 0.5 - Math.random()).slice(0, 3);

  // 化学元素の色マッピング
  const chemColors: { [key: string]: string } = {
    "リチウム": "from-red-500 to-pink-500",
    "ナトリウム": "from-yellow-400 to-orange-500",
    "カリウム": "from-purple-500 to-indigo-600",
    "カルシウム": "from-green-400 to-teal-500",
    "銅": "from-blue-500 to-cyan-400",
    "バリウム": "from-green-600 to-yellow-500",
  };

  // スタイルの色マッピング
  const styleColors: { [key: string]: string } = {
    "ポップ": "from-pink-500 to-purple-600",
    "ロック": "from-red-600 to-orange-500",
    "バラード": "from-blue-400 to-indigo-600",
    "EDM": "from-cyan-400 to-green-500",
    "和風": "from-rose-400 to-red-600",
    "子ども向け": "from-yellow-400 to-amber-500",
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">

      <section className="w-full bg-gradient-to-br from-gray-800 to-black py-20">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center text-center">
          <div className="mb-6 p-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Lyricium</h1>
          <p className="text-gray-200 text-lg max-w-xl mb-8">
            AIと一緒に、化学の色を知ろう。
          </p>
          <div className="flex gap-4 mt-2">
            <Button onClick={handleGenerateClick} className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 text-lg px-8 py-6 font-medium shadow-md shadow-blue-200 cursor-pointer">
            <Sparkles size={18} className="" />
              歌詞を生成する
            </Button>
            <Button 
              onClick={() => document.getElementById('recent-songs')?.scrollIntoView({ behavior: 'smooth' })} 
              className="rounded-full bg-gradient-to-r from-gray-800 to-gray-900 text-white border border-gray-700/50 hover:from-gray-700 hover:to-gray-800 text-lg px-8 py-6 font-medium shadow-lg shadow-black/40 backdrop-blur-sm transition-all duration-300 hover:scale-105 cursor-pointer"
            >
              <Eye size={18} className="" />
              作品を見る
            </Button>
          </div>
        </div>
      </section>

      {/* データ表示 */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-gray-600 to-gray-800 mb-4"></div>
            <div className="h-4 w-32 bg-gray-700 rounded"></div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900">
          {/* 最近の歌詞 */}
          <section id="recent-songs" className="max-w-6xl mx-auto px-6 py-16 bg-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-medium text-white">新着作品</h2>
              <Button
                variant="ghost"
                onClick={() => setExpandRecent(prev => !prev)}
                className="text-blue-400 hover:bg-gray-700 font-medium"
              >
                {expandRecent ? '閉じる' : 'すべて見る'} <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(expandRecent ? recentSongs : recentSongs.slice(0, 3)).map((song) => (
                <Card 
                  key={song.id} 
                  onClick={() => router.push(`/play/${song.id}`)} 
                  className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm group transform transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer overflow-hidden"
                >
                  <div className={`h-3 w-full bg-gradient-to-r ${song.chemical_name && chemColors[song.chemical_name] ? chemColors[song.chemical_name] : 'from-blue-500 to-purple-500'}`}></div>
                  {song.image ? (
                    <img src={song.image} alt={song.title} className="w-full h-40 object-cover" />
                  ) : (
                    <div className={`w-full h-40 bg-gradient-to-br ${song.chemical_name && chemColors[song.chemical_name] ? chemColors[song.chemical_name] : 'from-blue-500 to-purple-500'} opacity-20 flex items-center justify-center`}>
                      <Music size={32} className="text-gray-200 opacity-60" />
                    </div>
                  )}
                  <CardContent className="p-6 space-y-2">
                    <CardTitle className="text-white font-medium">{song.title}</CardTitle>
                    <div className="flex gap-2 items-center">
                      <span className={`inline-block w-3 h-3 rounded-full bg-gradient-to-r ${song.chemical_name && chemColors[song.chemical_name] ? chemColors[song.chemical_name] : 'from-blue-500 to-purple-500'}`}></span>
                      <p className="text-sm text-gray-200">{song.chemical_name} - {song.color}</p>
                    </div>
                    <p className="text-xs text-gray-400">
                      作成者: {song.user_id === 0 ? "ゲスト" : usersMap[song.user_id] || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-400">{new Date(song.created_at).toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* 自分の曲 */}
          {mySongs.length > 0 && (
            <section id="my-songs" className="max-w-6xl mx-auto px-6 py-16 bg-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-medium text-white">あなたの作品</h2>
                <Button
                  variant="ghost"
                  onClick={() => setExpandMy(prev => !prev)}
                  className="text-blue-400 hover:bg-gray-600 font-medium"
                >
                  {expandMy ? '閉じる' : 'すべて見る'} <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(expandMy ? mySongs : mySongs.slice(0, 3)).map((song) => (
                  <Card 
                    key={song.id} 
                    onClick={() => router.push(`/play/${song.id}`)} 
                    className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm group transform transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer overflow-hidden"
                  >
                    <div className={`h-3 w-full bg-gradient-to-r ${song.chemical_name && chemColors[song.chemical_name] ? chemColors[song.chemical_name] : 'from-blue-500 to-purple-500'}`}></div>
                    {song.image ? (
                      <img src={song.image} alt={song.title} className="w-full h-40 object-cover" />
                    ) : (
                      <div className={`w-full h-40 bg-gradient-to-br ${song.chemical_name && chemColors[song.chemical_name] ? chemColors[song.chemical_name] : 'from-blue-500 to-purple-500'} opacity-20 flex items-center justify-center`}>
                        <Music size={32} className="text-gray-200 opacity-60" />
                      </div>
                    )}
                    <CardContent className="p-6 space-y-2">
                      <CardTitle className="text-white font-medium">{song.title}</CardTitle>
                      <div className="flex gap-2 items-center">
                        <span className={`inline-block w-3 h-3 rounded-full bg-gradient-to-r ${song.chemical_name && chemColors[song.chemical_name] ? chemColors[song.chemical_name] : 'from-blue-500 to-purple-500'}`}></span>
                        <p className="text-sm text-gray-200">{song.chemical_name} - {song.color}</p>
                      </div>
                      <p className="text-xs text-gray-400">
                        作成者: {song.user_id === 0 ? "ゲスト" : usersMap[song.user_id] || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-400">{new Date(song.created_at).toLocaleDateString()}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* 化学元素カテゴリ */}
          {randomChems.map((chem, index) => (
            <section key={chem} className={`max-w-6xl mx-auto px-6 py-16 ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'}`}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-4 h-4 rounded-full bg-gradient-to-r ${chemColors[chem] || 'from-blue-500 to-purple-500'}`}></span>
                  <h2 className="text-2xl font-medium text-white">{chem}</h2>
                </div>
                <Button
                  variant="ghost"
                  onClick={() =>
                    setExpandChems(prev => ({ ...prev, [chem]: !prev[chem] }))
                  }
                  className="text-blue-400 hover:bg-gray-600 font-medium"
                >
                  {expandChems[chem] ? '閉じる' : 'すべて見る'} <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(expandChems[chem] ? chemSongs[chem] : chemSongs[chem]?.slice(0, 3))?.map((song) => (
                  <Card 
                    key={song.id} 
                    onClick={() => router.push(`/play/${song.id}`)} 
                    className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm group transform transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer overflow-hidden"
                  >
                    <div className={`h-3 w-full bg-gradient-to-r ${chemColors[chem] || 'from-blue-500 to-purple-500'}`}></div>
                    {song.image ? (
                      <img src={song.image} alt={song.title} className="w-full h-40 object-cover" />
                    ) : (
                      <div className={`w-full h-40 bg-gradient-to-br ${chemColors[chem] || 'from-blue-500 to-purple-500'} opacity-20 flex items-center justify-center`}>
                        <Music size={32} className="text-gray-200 opacity-60" />
                      </div>
                    )}
                    <CardContent className="p-6 space-y-2">
                      <CardTitle className="text-white font-medium">{song.title}</CardTitle>
                      <div className="flex gap-2 items-center">
                        <span className={`inline-block w-3 h-3 rounded-full bg-gradient-to-r ${chemColors[chem] || 'from-blue-500 to-purple-500'}`}></span>
                        <p className="text-sm text-gray-200">{song.chemical_name} - {song.color}</p>
                      </div>
                      <p className="text-xs text-gray-400">
                        作成者: {song.user_id === 0 ? "ゲスト" : usersMap[song.user_id] || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-400">{new Date(song.created_at).toLocaleDateString()}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}

          {/* スタイルカテゴリ */}
          {randomStyles.map((style, index) => (
            <section key={style} className={`max-w-6xl mx-auto px-6 py-16 ${((index + randomChems.length) % 2 === 0) ? 'bg-gray-800' : 'bg-gray-700'}`}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-4 h-4 rounded-full bg-gradient-to-r ${styleColors[style] || 'from-blue-500 to-purple-500'}`}></span>
                  <h2 className="text-2xl font-medium text-white">{style}</h2>
                </div>
                <Button
                  variant="ghost"
                  onClick={() =>
                    setExpandStyles(prev => ({ ...prev, [style]: !prev[style] }))
                  }
                  className="text-blue-400 hover:bg-gray-600 font-medium"
                >
                  {expandStyles[style] ? '閉じる' : 'すべて見る'} <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(expandStyles[style] ? styleSongs[style] : styleSongs[style]?.slice(0, 3))?.map((song) => (
                  <Card 
                    key={song.id} 
                    onClick={() => router.push(`/play/${song.id}`)} 
                    className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm group transform transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer overflow-hidden"
                  >
                    <div className={`h-3 w-full bg-gradient-to-r ${styleColors[style] || 'from-blue-500 to-purple-500'}`}></div>
                    {song.image ? (
                      <img src={song.image} alt={song.title} className="w-full h-40 object-cover" />
                    ) : (
                      <div className={`w-full h-40 bg-gradient-to-br ${styleColors[style] || 'from-blue-500 to-purple-500'} opacity-20 flex items-center justify-center`}>
                        <Music size={32} className="text-gray-200 opacity-60" />
                      </div>
                    )}
                    <CardContent className="p-6 space-y-2">
                      <CardTitle className="text-white font-medium">{song.title}</CardTitle>
                      <div className="flex gap-2 items-center">
                        <span className={`inline-block w-3 h-3 rounded-full bg-gradient-to-r ${song.chemical_name && chemColors[song.chemical_name] ? chemColors[song.chemical_name] : 'from-blue-500 to-purple-500'}`}></span>
                        <p className="text-sm text-gray-200">{song.chemical_name} - {song.color}</p>
                      </div>
                      <p className="text-xs text-gray-400">
                        作成者: {song.user_id === 0 ? "ゲスト" : usersMap[song.user_id] || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-400">{new Date(song.created_at).toLocaleDateString()}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}

        </div>
      )}
    </div>
  );
}