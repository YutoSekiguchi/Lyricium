"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSongById } from "@/services/song";
import { getNextSongId } from "@/services/song";
import { Button } from "@/components/ui/button";
import { getUserById } from "@/services/user";
import Link from "next/link";

interface Song {
  id: number;
  title: string;
  type: string;
  color: string;
  symbol: string;
  chemical_name: string;
  style: string;
  lyrics: string;
  image: string; // jacket image url
  url: string; // audio url
  user_id: number;
}

interface Props {
  song_id: number;
}

export default function PlayMain({ song_id }: Props) {
  const [currentId, setCurrentId] = useState<number>(song_id);
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lyricsRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const visualizerRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  // 音量の状態管理
  const [volume, setVolume] = useState<number>(0.7);
  // 音響効果の状態
  const [reverbEnabled, setReverbEnabled] = useState<boolean>(true);
  const [bassBoostEnabled, setBassBoostEnabled] = useState<boolean>(true);
  // ビジュアライザーの表示状態
  const [visualizerEnabled, setVisualizerEnabled] = useState<boolean>(true);
  // ビート検出のしきい値と状態
  const [beatDetected, setBeatDetected] = useState<boolean>(false);
  // エフェクトの強さ設定
  const [effectsIntensity, setEffectsIntensity] = useState<number>(1);

  const convolutionRef = useRef<ConvolverNode | null>(null);
  const bassBoostRef = useRef<BiquadFilterNode | null>(null);

  const [nextSongId, setNextSongId] = useState<number | null>(null);

  // 日本語の色名をHEXコードにマッピング
  const colorMap: Record<string, string> = {
    赤: "#ff3b3b",
    黄: "#ffd43b",
    赤紫: "#d726e3",
    橙赤: "#ff703b",
    紅: "#ff3b6f",
    黄緑: "#b4ff3b",
    青緑: "#3be3ff",
    青: "#3b6cff",
    赤褐色: "#b63b2f",
    桃: "#ff6cb3",
    白: "#ffffff",
    黄色: "#ffec3b",
  };

  const getHexColor = useMemo(() => {
    if (!song) return "#ffffff";
    return colorMap[song.color] ?? "#ffffff";
  }, [song]);

  // 歌詞内の色名をハイライト
  const highlightedLyrics = useMemo(() => {
    if (!song) return "";
    const escaped = song.color.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "g");
    return song.lyrics.replace(
      re,
      `<span style="color:${getHexColor};font-weight:bold;">${song.color}</span>`
    );
  }, [song, getHexColor]);

  // オーディオコンテキストの初期化
  useEffect(() => {
    // AudioContextの初期化
    if (!audioContextRef.current && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();
      
      // アナライザーノードの作成
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      // ゲインノードの作成
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = volume;
      
      // ConvolverNode（リバーブ）の作成
      convolutionRef.current = audioContextRef.current.createConvolver();
      
      // BassBoostフィルターの作成
      bassBoostRef.current = audioContextRef.current.createBiquadFilter();
      bassBoostRef.current.type = "lowshelf";
      bassBoostRef.current.frequency.value = 200;
      bassBoostRef.current.gain.value = 0;
      
      // インパルス応答の生成（リバーブエフェクト用）
      createImpulseResponse();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }
      
      if (audioContextRef.current && audioContextRef.current.state === 'running') {
        audioContextRef.current.suspend();
      }
    };
  }, []);

  // リバーブエフェクト用のインパルス応答を生成
  const createImpulseResponse = () => {
    if (!audioContextRef.current || !convolutionRef.current) return;
    
    const sampleRate = audioContextRef.current.sampleRate;
    const length = sampleRate * 2; // 2秒のリバーブ
    const impulse = audioContextRef.current.createBuffer(2, length, sampleRate);
    const leftChannel = impulse.getChannelData(0);
    const rightChannel = impulse.getChannelData(1);
    
    // シンプルな減衰関数
    for (let i = 0; i < length; i++) {
      const decay = Math.pow(1 - i / length, 1.5);
      leftChannel[i] = (Math.random() * 2 - 1) * decay;
      rightChannel[i] = (Math.random() * 2 - 1) * decay;
    }
    
    convolutionRef.current.buffer = impulse;
  };

  // オーディオエフェクトの状態更新
  useEffect(() => {
    if (!gainNodeRef.current) return;
    gainNodeRef.current.gain.value = volume;
  }, [volume]);

  useEffect(() => {
    if (!bassBoostRef.current) return;
    bassBoostRef.current.gain.value = bassBoostEnabled ? 10 * effectsIntensity : 0;
  }, [bassBoostEnabled, effectsIntensity]);

  // オーディオ再生と分析の設定
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioContextRef.current || !analyserRef.current || !gainNodeRef.current) return;
    
    // オーディオ接続関数
    const setupAudioNodes = () => {
      // 既存の接続をクリア
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }
      
      // ソースノードの作成と接続
      sourceNodeRef.current = audioContextRef.current!.createMediaElementSource(audio);
      
      // エフェクトチェーンの構築
      sourceNodeRef.current.connect(gainNodeRef.current!);
      
      // リバーブチェーン
      if (reverbEnabled && convolutionRef.current) {
        gainNodeRef.current!.connect(convolutionRef.current);
        convolutionRef.current.connect(bassBoostRef.current!);
      } else {
        gainNodeRef.current!.connect(bassBoostRef.current!);
      }
      
      // アナライザーへの接続
      bassBoostRef.current!.connect(analyserRef.current!);
      analyserRef.current!.connect(audioContextRef.current!.destination);
    };
    
    const handlePlay = async () => {
      setIsPlaying(true);
      if (audioContextRef.current!.state === 'suspended') {
        await audioContextRef.current!.resume();
      }
      if (!sourceNodeRef.current) {
        setupAudioNodes();
      }
      startVisualizer();
    };
    
    const handlePause = () => {
      setIsPlaying(false);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
    };
    
    const handleVolumeChange = () => {
      setVolume(audio.volume);
    };
    
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("volumechange", handleVolumeChange);
    
    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("volumechange", handleVolumeChange);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [reverbEnabled]);

  // ビジュアライザーの更新
  const startVisualizer = () => {
    if (!visualizerEnabled || !visualizerRef.current || !dataArrayRef.current || !analyserRef.current) {
      return;
    }
    
    const canvas = visualizerRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const renderFrame = () => {
      if (!isPlaying) return;
      
      animationFrameRef.current = requestAnimationFrame(renderFrame);
      analyserRef.current!.getByteFrequencyData(dataArrayRef.current!);
      
      // ビート検出
      const bassSum = dataArrayRef.current!.slice(0, 5).reduce((sum, val) => sum + val, 0) / 5;
      const beatThreshold = 180;
      if (bassSum > beatThreshold && !beatDetected) {
        setBeatDetected(true);
        setTimeout(() => setBeatDetected(false), 100);
      }
      
      // キャンバスのクリア
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // ビジュアライザーの描画
      const barWidth = (canvas.width / dataArrayRef.current!.length) * 2.5;
      let x = 0;
      
      const hexColor = getHexColor;
      
      for (let i = 0; i < dataArrayRef.current!.length; i++) {
        const barHeight = dataArrayRef.current![i] / 2;
        
        // 周波数帯によって色を変える
        const alpha = 0.5 + 0.5 * (barHeight / 128);
        
        ctx.fillStyle = `${hexColor}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
        
        // 左右対称になるよう中央から描画
        const centerX = canvas.width / 2;
        if (i < dataArrayRef.current!.length / 2) {
          ctx.fillRect(centerX - x - barWidth, canvas.height - barHeight, barWidth, barHeight);
        } else {
          ctx.fillRect(centerX + x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth;
        }
      }
      
      // 波形の描画
      ctx.beginPath();
      ctx.strokeStyle = hexColor;
      ctx.lineWidth = 2;
      
      analyserRef.current!.getByteTimeDomainData(dataArrayRef.current!);
      
      const sliceWidth = canvas.width / dataArrayRef.current!.length;
      x = 0;
      
      for (let i = 0; i < dataArrayRef.current!.length; i++) {
        const v = dataArrayRef.current![i] / 128.0;
        const y = (v * canvas.height) / 4 + canvas.height / 2;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      ctx.stroke();
    };
    
    renderFrame();
  };

  // ボタンクリックサウンド・トグルサウンドは不要になったため削除

  // 曲データの取得
  useEffect(() => {
    (async () => {
      try {
        const data = await getSongById(currentId);
        setSong(data as Song);
        const nxt = await getNextSongId();
        setNextSongId(nxt);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentId]);

  useEffect(() => {
    if (!song) return;
    const fetchUser = async () => {
      const user = await getUserById(song.user_id);
      setUsername(user.display_name);
    };
    fetchUser();
  }, [song])

  // 次の曲へ移動する関数
  const goToNextSong = () => {
    if (nextSongId) {
      setCurrentId(nextSongId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-screen text-xl">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="flex items-center justify-center w-full h-screen text-xl">
        Song not found
      </div>
    );
  }

  const SPARKLE_COUNT = 20;

  // 単色だけで表現するためのスタイルと様々なアニメーション
  const monoChromeStyle = `
    /* ベースカラーの透明度バリエーション */
    :root {
      --base-color: ${getHexColor};
      --base-color-10: ${getHexColor}1A;
      --base-color-20: ${getHexColor}33;
      --base-color-30: ${getHexColor}4D;
      --base-color-40: ${getHexColor}66;
      --base-color-60: ${getHexColor}99;
      --base-color-80: ${getHexColor}CC;
    }

    /* ジャケット写真のパルスエフェクト */
    @keyframes jacketPulse {
      0%   { box-shadow: 0 0 5px 0 var(--base-color); transform: scale(1); }
      50%  { box-shadow: 0 0 25px 10px var(--base-color); transform: scale(1.02); }
      100% { box-shadow: 0 0 5px 0 var(--base-color); transform: scale(1); }
    }

    /* リズミカルな境界線アニメーション */
    @keyframes borderDance {
      0%   { border-radius: 12px; }
      25%  { border-radius: 16px 12px 18px 14px; }
      50%  { border-radius: 14px 18px 12px 16px; }
      75%  { border-radius: 18px 14px 16px 12px; }
      100% { border-radius: 12px; }
    }

    /* タイトルのグロー効果 */
    @keyframes titleGlow {
      0%   { text-shadow: 0 0 3px var(--base-color); }
      50%  { text-shadow: 0 0 12px var(--base-color), 0 0 20px var(--base-color); }
      100% { text-shadow: 0 0 3px var(--base-color); }
    }

    /* 歌詞パネルの呼吸アニメーション */
    @keyframes panelBreathing {
      0%   { background-color: rgba(0,0,0,0.7); box-shadow: inset 0 0 15px 0 var(--base-color-20); }
      50%  { background-color: rgba(0,0,0,0.85); box-shadow: inset 0 0 25px 5px var(--base-color-40); }
      100% { background-color: rgba(0,0,0,0.7); box-shadow: inset 0 0 15px 0 var(--base-color-20); }
    }

    /* リズミカルなイコライザーバー (それぞれ異なるタイミングで動く) */
    ${[...Array(10)]
      .map(
        (_, i) => `
      @keyframes eq${i} {
        0%   { height: ${10 + Math.floor(Math.random() * 15)}%; }
        25%  { height: ${40 + Math.floor(Math.random() * 30)}%; }
        50%  { height: ${20 + Math.floor(Math.random() * 20)}%; }
        75%  { height: ${50 + Math.floor(Math.random() * 35)}%; }
        100% { height: ${10 + Math.floor(Math.random() * 15)}%; }
      }
    `
      )
      .join("")}

    /* 背景グラデーションシフト */
    @keyframes bgShift {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    /* コントロールボタンエフェクト */
    audio::-webkit-media-controls-panel {
      background: linear-gradient(45deg, #000000, #111111);
      border: 1px solid var(--base-color-40);
    }
    
    audio::-webkit-media-controls-play-button,
    audio::-webkit-media-controls-volume-slider-container,
    audio::-webkit-media-controls-volume-slider,
    audio::-webkit-media-controls-timeline,
    audio::-webkit-media-controls-current-time-display,
    audio::-webkit-media-controls-time-remaining-display,
    audio::-webkit-media-controls-timeline-container {
      filter: drop-shadow(0 0 2px var(--base-color));
    }

    /* パーティクル効果 */
    @keyframes particle {
      0%   { transform: translateY(0) scale(1); opacity: 0; }
      20%  { opacity: 0.8; }
      100% { transform: translateY(-100px) scale(0); opacity: 0; }
    }

    /* ビート効果 - オーディオ再生中のみ有効 */
    .beat-effect {
      animation: ${isPlaying ? 'beatPulse 0.6s ease-in-out infinite' : 'none'};
    }
    
    @keyframes beatPulse {
      0%   { transform: scale(1); }
      10%  { transform: scale(1.05); }
      20%  { transform: scale(1); }
      100% { transform: scale(1); }
    }

    /* floating background particles */
    @keyframes floatParticle {
      0%   { transform: translateY(0) scale(1); opacity: 0; }
      50%  { opacity: 0.5; }
      100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
    }

    /* twinkling stars */
    @keyframes starTwinkle {
      0%,100% { opacity:0.2; transform: scale(0.8); }
      50%     { opacity:0.8; transform: scale(1.2); }
    }
    
    /* ビート検出時のフラッシュエフェクト */
    @keyframes beatFlash {
      0%   { opacity: 0.5; }
      50%  { opacity: 0; }
      100% { opacity: 0; }
    }
    
    /* サウンド設定パネルのアニメーション */
    @keyframes panelSlideIn {
      0%   { transform: translateY(20px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
    
    /* トグルボタンのアニメーション */
    @keyframes toggleGlow {
      0%   { box-shadow: 0 0 2px var(--base-color); }
      50%  { box-shadow: 0 0 10px var(--base-color); }
      100% { box-shadow: 0 0 2px var(--base-color); }
    }
    
    /* スライダーノブのアニメーション */
    @keyframes sliderPulse {
      0%   { transform: scale(1); }
      50%  { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    
    /* ビジュアライザーの枠線アニメーション */
    @keyframes visualizerBorder {
      0%   { border-color: var(--base-color-40); }
      50%  { border-color: var(--base-color-80); }
      100% { border-color: var(--base-color-40); }
    }
    
    /* 波形のキラキラエフェクト */
    @keyframes waveSparkle {
      0%   { opacity: 0; transform: scale(0.8) rotate(0deg); }
      50%  { opacity: 1; transform: scale(1.2) rotate(180deg); }
      100% { opacity: 0; transform: scale(0.8) rotate(360deg); }
    }
  `;

  return (
    <div
      className="flex flex-col items-center justify-center w-full min-h-screen p-6 text-white"
      style={{
        background: `linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,20,0.9) 40%, rgba(10,10,10,0.95) 100%)`,
        backgroundSize: "200% 200%",
        animation: "bgShift 15s ease infinite",
        overflow: "hidden",
      }}
    >
      <Link
        href="/"
        className="absolute top-20 left-4 text-white hover:text-gray-400 transition duration-300"
        style={{
          textShadow: `0 0 2px ${getHexColor}40`,
        }}
      >←ホームに戻る</Link>
      {/* スタイルの注入 */}
      <style>{monoChromeStyle}</style>

      {/* ビート検出時のフラッシュエフェクト */}
      {beatDetected && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: getHexColor,
            opacity: 0.3,
            animation: "beatFlash 0.3s ease-out",
            zIndex: 5,
          }}
        />
      )}

      {/* background floating particles */}
      {Array.from({ length: 80 }).map((_, i) => (
        <div
          key={`particle-${i}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            backgroundColor: getHexColor,
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `floatParticle ${10 + Math.random() * 10}s linear infinite ${Math.random() * 5}s`,
          }}
        />
      ))}

      {/* background twinkling stars */}
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={`star-${i}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            backgroundColor: getHexColor,
            width: "3px",
            height: "3px",
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `starTwinkle ${2 + Math.random() * 2}s ease-in-out infinite`,
          }}
        />
      ))}

      {/* タイトル */}
      <h1 
        className="text-3xl font-bold mb-6 text-center relative z-10"
        style={{ 
          color: getHexColor,
          animation: "titleGlow 3s ease-in-out infinite",
        }}
      >
        {song.title}
      </h1>

      {/* ジャケット画像 */}
      <div
        className={`relative rounded-lg overflow-hidden mb-8 ${beatDetected ? 'scale-105' : ''} transition-transform`}
        style={{
          animation: "jacketPulse 4s ease-in-out infinite, borderDance 8s ease-in-out infinite",
          transition: "all 0.3s ease",
        }}
      >
        {/* イコライザーバー */}
        <div className="absolute bottom-0 left-0 right-0 h-16 flex justify-evenly items-end px-1 z-10 pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              style={{
                width: "8px",
                backgroundColor: getHexColor,
                opacity: isPlaying ? 0.8 : 0.3,
                animation: isPlaying ? `eq${i} ${1.2 + i * 0.1}s ease-in-out infinite` : "none",
                height: "20%",
                borderRadius: "2px 2px 0 0",
              }}
            />
          ))}
        </div>

        {/* キラキラエフェクト（静的） */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, ${getHexColor}40 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
            mixBlendMode: "overlay",
          }}
        />

        {/* オーバーレイグラデーション */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(225deg, ${getHexColor}10 0%, transparent 50%, ${getHexColor}30 100%)`,
          }}
        />

        {/* ジャケット画像 */}
        <img
          src={song.image}
          alt="jacket"
          className="w-72 h-72 object-cover"
          style={{ 
            filter: `drop-shadow(0 0 8px ${getHexColor}99)`
          }}
        />

        {/* jacket dynamic sparkles */}
        {Array.from({ length: SPARKLE_COUNT }).map((_, i) => (
          <div
            key={`jacket-sparkle-${i}`}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: "4px",
              height: "4px",
              backgroundColor: getHexColor,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `starTwinkle ${1 + Math.random() * 1.5}s ease-in-out infinite ${Math.random() * 2}s`,
            }}
          />
        ))}

        {/* パーティクル効果（再生中のみ） */}
        {isPlaying && [...Array(12)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute bottom-0 pointer-events-none"
            style={{
              left: `${10 + i * 15 + Math.random() * 10}%`,
              width: `${4 + Math.random() * 4}px`,
              height: `${4 + Math.random() * 4}px`,
              borderRadius: "50%",
              backgroundColor: getHexColor,
              opacity: 0,
              animation: `particle ${2 + Math.random() * 2}s ease-out ${Math.random() * 2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* ビジュアライザー */}
      {visualizerEnabled && (
        <div 
          className="relative w-full max-w-md mb-6 overflow-hidden "
          style={{
            height: "0px",
            border: `1px solid ${getHexColor}40`,
            borderRadius: "8px",
            animation: isPlaying ? "visualizerBorder 4s ease-in-out infinite" : "none",
          }}
        >
          <canvas
            ref={visualizerRef}
            width={800}
            height={120}
            className="w-full h-full"
          />
          
          {/* ビジュアライザー上に浮かぶ音符パーティクル */}
          {isPlaying && [...Array(8)].map((_, i) => (
            <div
              key={`note-${i}`}
              className="absolute pointer-events-none"
              style={{
                width: "12px",
                height: "12px",
                top: `${50 + Math.random() * 40}%`,
                left: `${10 + i * 10 + Math.random() * 5}%`,
                color: getHexColor,
                opacity: 0,
                fontSize: "12px",
                animation: `waveSparkle ${3 + Math.random() * 2}s linear ${Math.random() * 2}s infinite`,
              }}
            >
              {['♪', '♫', '♬', '♩'][Math.floor(Math.random() * 4)]}
            </div>
          ))}
        </div>
      )}

      {/* オーディオコントロール */}
      <div className="w-full max-w-md mb-6">
        <audio
          ref={audioRef}
          src={`${process.env.API_URL}/${song.url}`}
          controls
          className="w-full"
          style={{ 
            filter: `drop-shadow(0 0 2px ${getHexColor}80)`,
          }}
        />
      </div>

      {/* 次の曲へボタン */}
      <div className="mb-6 flex justify-center space-x-4">
        <Button
          onClick={goToNextSong}
          disabled={!nextSongId}
          className="bg-gray-800 hover:bg-gray-600 text-white cursor-pointer"
          style={{
            borderColor: getHexColor,
            boxShadow: `0 0 5px ${getHexColor}60`,
            animation: "toggleGlow 2s infinite",
          }}
        >
          次の曲へ
        </Button>
      </div>


      {/* 歌詞 */}
      <div
        ref={lyricsRef}
        className="w-full max-w-xl h-60 overflow-y-auto rounded-lg p-6"
        style={{ 
          animation: "panelSlideIn 0.3s ease-out, panelBreathing 6s ease-in-out infinite",
          border: `1px solid ${getHexColor}40`,
        }}
      >
        <pre
          className="whitespace-pre-wrap leading-relaxed"
          style={{ 
            color: `${getHexColor}CC`,
            textShadow: `0 0 2px ${getHexColor}40`,
          }}
          dangerouslySetInnerHTML={{ __html: highlightedLyrics }}
        />
      </div>

      {/* ユーザー名 */}
      <div className="text-sm text-gray-400 mt-4">
        {username ? `Uploaded by: ${username}` : "Loading user..."}
      </div>

      {/* 音楽の波紋効果（プレイヤー全体に広がる円） */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={`ripple-${i}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: "20px",
            height: "20px",
            border: `2px solid ${getHexColor}30`,
            animation: `ripple ${6 + i * 2}s linear ${i * 2}s infinite`,
            opacity: 0,
          }}
        />
      ))}

      {/* Web Audio API が有効でない環境用の警告 */}
      <div className="fixed bottom-4 right-4 text-xs opacity-50">
        {!audioContextRef.current && (
          <div className="p-2 bg-black rounded border border-red-500">
            サウンドエフェクトがサポートされていません
          </div>
        )}
      </div>

      <style>{`
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(50); opacity: 0; }
        }
        
        /* スライダー用のスタイル */
        input[type=range] {
          -webkit-appearance: none;
          height: 5px;
          border-radius: 5px;
          background: #333;
          outline: none;
        }
        
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: ${getHexColor};
          cursor: pointer;
          transition: all 0.2s;
        }
        
        input[type=range]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 10px ${getHexColor};
          animation: sliderPulse 1s infinite;
        }
        
        input[type=range]::-moz-range-thumb {
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: ${getHexColor};
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        
        input[type=range]::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 10px ${getHexColor};
        }
      `}</style>
    </div>
  );
}