/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Camera, 
  Upload, 
  RefreshCw, 
  Palette, 
  Type, 
  Check, 
  Sparkles, 
  AlertCircle, 
  Sparkle, 
  Heart, 
  Smartphone, 
  Layers, 
  Grid,
  Image as ImageIcon,
  CheckCircle2,
  Tv
} from "lucide-react";

interface InteractiveFrameProps {
  onApplyToInquiry: (frameText: string, colors: { bg: string; text: string; border: string }, logoText: string) => void;
}

const PRESET_PICS = [
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=400", // 밝게 장난치는 연인
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=400", // 장난스런 포즈의 행복한 절친들
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=400", // 한데 모여 웃고 떠드는 동아리 친구들
  "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=400"  // 까르르 무지개 미소 유치원 아이들
];

const PRESET_THEMES = [
  {
    name: "리얼 화이트 (대세 기본)",
    bg: "#FFFFFF",
    text: "#1F2937",
    border: "#E5E7EB",
    sticker: "minimal"
  },
  {
    name: "성수 힙스터 빈티지 블랙",
    bg: "#111827",
    text: "#F9FAFB",
    border: "#374151",
    sticker: "minimal"
  },
  {
    name: "달콤 로맨틱 파스텔 핑크",
    bg: "#FFF5F5",
    text: "#E53E3E",
    border: "#FED7D7",
    sticker: "hearts"
  },
  {
    name: "싱그러운 포레스트 그린",
    bg: "#F0FDF4",
    text: "#15803D",
    border: "#DCFCE7",
    sticker: "flowers"
  },
  {
    name: "레트로 마가린 플라워 노랑",
    bg: "#FFFDF2",
    text: "#D97706",
    border: "#FDE68A",
    sticker: "stars"
  },
  {
    name: "빈티지 인디고 네이비",
    bg: "#1E293B",
    text: "#F1F5F9",
    border: "#334155",
    sticker: "bubbles"
  }
];

export default function InteractiveFrame({ onApplyToInquiry }: InteractiveFrameProps) {
  // Config & customization states
  const [theme, setTheme] = useState(PRESET_THEMES[0]);
  const [customBg, setCustomBg] = useState(PRESET_THEMES[0].bg);
  const [customText, setCustomText] = useState(PRESET_THEMES[0].text);
  const [frameTitle, setFrameTitle] = useState("우리 단짝의 소중한 기록");
  const [frameSubTitle, setFrameSubtitle] = useState("2026.10.18 HAPPY MEMORY");
  const [frameLogoText, setFrameLogoText] = useState("LifeMyPhotos ⭐");
  const [fontFamily, setFontFamily] = useState<"font-sans" | "font-serif" | "font-hand">("font-sans");
  const [photos, setPhotos] = useState<string[]>(PRESET_PICS);
  const [dragActiveIndex, setDragActiveIndex] = useState<number | null>(null);
  
  // NEW: Layout Style presets from user images (Heart vs Vintage vs Festival)
  const [layoutStyle, setLayoutStyle] = useState<"heart" | "vintage" | "festival">("vintage");
  // NEW: Mobile Device Simulator View Mode ("iphone" | "galaxy" | "print")
  const [viewDevice, setViewDevice] = useState<"iphone" | "galaxy" | "print">("print");

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePresetTheme = (preset: typeof PRESET_THEMES[0]) => {
    setTheme(preset);
    setCustomBg(preset.bg);
    setCustomText(preset.text);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const files = e.target.files;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newPhotos = [...photos];
          newPhotos[index] = event.target.result as string;
          setPhotos(newPhotos);
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveIndex(index);
    } else if (e.type === "dragleave") {
      setDragActiveIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveIndex(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newPhotos = [...photos];
          newPhotos[index] = event.target.result as string;
          setPhotos(newPhotos);
        }
      };
      reader.readAsDataURL(e.dataTransfer.files[0]);
    }
  };

  const resetPhotos = () => {
    setPhotos(PRESET_PICS);
  };

  return (
    <div id="interactive-frame-main" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Control Panel (7 cols on desktop) */}
      <div id="interactive-controls" className="lg:col-span-7 bg-white/85 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-rose-100/45 shadow-xl space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkle className="w-5 h-5 text-rose-500 animate-pulse" />
            <span className="font-sans font-extrabold text-lg text-neutral-900 tracking-tight">
              실시간 4X6인치 가로 세로형 프레임 커스텀
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            인생네컷 매장에서 대세인 <strong>4X6인치 엽서형 (2열 2줄)</strong> 정식 양식입니다. 보내주신 위버스콘 레터링형, 인생네컷 프로필 하트형 시안까지 실시간 필터링하여 배치 및 모바일(아이폰/갤) 출력 깨짐 방지가 완벽 지원됩니다.
          </p>
        </div>

        {/* NEW Selection: Layout Style Presets based on prompt images */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold text-neutral-400 tracking-wider">📐 프레임 기본 포맷 선택</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Vintage style (first uploaded image reference) */}
            <button
              type="button"
              onClick={() => {
                setLayoutStyle("vintage");
                setFrameLogoText("Photomatic");
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                layoutStyle === "vintage"
                  ? "border-rose-500 bg-rose-50/30 text-neutral-900 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 text-gray-500"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Grid className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="text-xs font-bold font-sans">포토매틱 빈티지형</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                좌우 측면 프레임에 세로 글귀 레이아웃이 박히는 감성 빈티지 네컷
              </p>
            </button>

            {/* Heart style (second uploaded image reference) */}
            <button
              type="button"
              onClick={() => {
                setLayoutStyle("heart");
                setFrameLogoText("Our Memory");
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                layoutStyle === "heart"
                  ? "border-rose-500 bg-rose-50/30 text-neutral-900 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 text-gray-500"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold font-sans">인생네컷 프로필 하트형</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                중앙 상단에 미미하고 이쁜 사랑스러운 시그니처 하트 로고 배치
              </p>
            </button>

            {/* Festival style (vibrant weverse-con style reference) */}
            <button
              type="button"
              onClick={() => {
                setLayoutStyle("festival");
                setFrameLogoText("Weverse Fest");
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                layoutStyle === "festival"
                  ? "border-rose-500 bg-rose-50/30 text-neutral-900 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 text-gray-500"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs font-bold font-sans">위버스 콘 페스티벌</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                하단에 화려한 컬러스티커와 축제 엠블럼을 가미한 스페셜 무드
              </p>
            </button>
          </div>
        </div>

        {/* 1. Presets */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold text-neutral-400 tracking-wider">🎨 추천 테마 컬러셋</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {PRESET_THEMES.map((t, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetTheme(t)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                  customBg === t.bg && customText === t.text
                    ? "border-neutral-950 bg-neutral-950 text-white font-bold"
                    : "border-gray-200 hover:border-gray-300 hover:bg-neutral-50 text-neutral-700"
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full border border-neutral-350 shrink-0"
                  style={{ backgroundColor: t.bg }}
                />
                <span className="text-xs truncate">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Custom Color Pickers */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-bold text-neutral-400">
              <Palette className="w-3.5 h-3.5" /> 프레임 배경 색상
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={customBg}
                onChange={(e) => setCustomBg(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border border-gray-200 shrink-0"
              />
              <input
                type="text"
                value={customBg.toUpperCase()}
                onChange={(e) => setCustomBg(e.target.value)}
                className="w-full px-2.5 py-1 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:border-neutral-805"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-bold text-neutral-400">
              <Palette className="w-3.5 h-3.5" /> 폰트/구분선 색상
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border border-gray-200 shrink-0"
              />
              <input
                type="text"
                value={customText.toUpperCase()}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full px-2.5 py-1 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:border-neutral-805"
              />
            </div>
          </div>
        </div>

        {/* Font Style Customization */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-neutral-400">✒️ 예쁜 글꼴 무드 결정</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "font-sans", name: "단정 깔끔체" },
              { id: "font-serif", name: "감성 명조체" },
              { id: "font-hand", name: "동글 손글씨체" }
            ].map((fItem) => (
              <button
                key={fItem.id}
                type="button"
                onClick={() => setFontFamily(fItem.id as any)}
                className={`py-2 px-3 rounded-xl border text-center text-xs transition-all ${
                  fontFamily === fItem.id
                    ? "border-neutral-900 bg-neutral-900 text-white font-bold"
                    : "border-gray-200 text-gray-500 hover:bg-neutral-50"
                }`}
              >
                <span className={fItem.id}>{fItem.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Text Customizable */}
        <div className="space-y-3">
          <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-400">
            <Type className="w-3.5 h-3.5" /> 프레임 속 글귀 직접 타이핑
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] text-gray-400 block mb-1">큰 글씨 타이틀</span>
              <input
                type="text"
                maxLength={20}
                value={frameTitle}
                onChange={(e) => setFrameTitle(e.target.value)}
                placeholder="결혼, 단짝, 우정 축전"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-neutral-800 text-gray-805 font-medium"
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block mb-1">작은 소개글 (날짜 등)</span>
              <input
                type="text"
                maxLength={30}
                value={frameSubTitle}
                onChange={(e) => setFrameSubtitle(e.target.value)}
                placeholder="2026.10.18 등"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-neutral-800 text-gray-850 font-medium"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400 block mb-1">로고 / 사이드 문구</span>
                <span className="text-[9px] text-emerald-600 font-bold">인기기능🔥</span>
              </div>
              <input
                type="text"
                maxLength={20}
                value={frameLogoText}
                onChange={(e) => setFrameLogoText(e.target.value)}
                placeholder="Photomatic / PP"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-neutral-800 text-gray-850 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* 4. User Photos Instructions/Uploads */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-bold text-neutral-400 font-sans">📸 내 사진으로 바꾸기 (슬롯 클릭)</label>
            <button
              onClick={resetPhotos}
              type="button"
              className="flex items-center gap-1 text-[11px] font-semibold text-gray-450 hover:text-rose-500 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> 원래 예시사진 보기
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {photos.map((ph, idx) => (
              <div
                key={idx}
                onClick={() => fileInputRefs.current[idx]?.click()}
                onDragEnter={(e) => handleDrag(e, idx)}
                onDragOver={(e) => handleDrag(e, idx)}
                onDragLeave={(e) => handleDrag(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                className={`relative aspect-square rounded-xl overflow-hidden border cursor-pointer group transition-all duration-200 ${
                  dragActiveIndex === idx
                    ? "border-dashed border-rose-500 bg-rose-50/20 scale-105"
                    : "border-gray-200 hover:border-neutral-500"
                }`}
              >
                <img
                  src={ph}
                  alt={`Slot ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Upload className="w-4 h-4 text-white" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={(el) => { fileInputRefs.current[idx] = el; }}
                  onChange={(e) => handlePhotoUpload(e, idx)}
                  className="hidden"
                />
              </div>
            ))}
          </div>
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-gray-350 shrink-0" />
            사진을 던지거나 클릭해 올리면 실체감 있게 배치되어 즉각 출력본을 가늠할 수 있습니다.
          </span>
        </div>

        {/* 5. Apply Button to Inquiry Form */}
        <div id="interactive-actions" className="pt-2">
          <button
            onClick={() => onApplyToInquiry(frameTitle, { bg: customBg, text: customText, border: customText }, frameLogoText)}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-sans font-bold text-sm py-4 px-4 rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> 완성한 이 프레임으로 견적산출 & 대여신청 🚀
          </button>
          <span className="text-[10px] text-neutral-400 block text-center mt-2.5 leading-normal">
            💡 버튼 클릭 시 내가 제작한 테마와 프레임 설정이 하단 예약 상담 명세에 자동으로 저장 연동됩니다.
          </span>
        </div>
      </div>

      {/* Frame Visual Mockup (Right Pane) - Now with Device Simulator Mode for iPhone/Galaxy! */}
      <div id="interactive-preview-container" className="lg:col-span-12 xl:col-span-5 flex flex-col items-center justify-center lg:sticky lg:top-24 mt-4 lg:mt-0">
        
        {/* NEW Device Switcher Bar */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-2xl mb-4 text-center">
          <button
            type="button"
            onClick={() => setViewDevice("print")}
            className={`flex items-center gap-1 py-1.5 px-3 rounded-xl text-[11px] font-bold transition-all ${
              viewDevice === "print" 
                ? "bg-white text-neutral-900 shadow-xs" 
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Layers className="w-3 h-3 text-rose-500" />
            <span>실물인화 4X6 엽서</span>
          </button>
          <button
            type="button"
            onClick={() => setViewDevice("iphone")}
            className={`flex items-center gap-1 py-1.5 px-3 rounded-xl text-[11px] font-bold transition-all ${
              viewDevice === "iphone" 
                ? "bg-white text-neutral-900 shadow-xs" 
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Smartphone className="w-3 h-3 text-sky-500" />
            <span>아이폰 15 Pro 모드</span>
          </button>
          <button
            type="button"
            onClick={() => setViewDevice("galaxy")}
            className={`flex items-center gap-1 py-1.5 px-3 rounded-xl text-[11px] font-bold transition-all ${
              viewDevice === "galaxy" 
                ? "bg-white text-neutral-900 shadow-xs" 
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Smartphone className="w-3 h-3 text-emerald-500" />
            <span>갤럭시 S24 Ultra 모드</span>
          </button>
        </div>

        {/* Dynamic Canvas wrapper */}
        <div className="w-full flex items-center justify-center transition-all duration-300">
          
          {/* IPHONE 15 PRO SIMULATOR SHIELD */}
          {viewDevice === "iphone" && (
            <div className="w-[300px] h-[580px] bg-neutral-950 rounded-[44px] border-[10px] border-neutral-900 shadow-2xl relative flex flex-col justify-between overflow-hidden p-3.5 border-t-[12px] border-b-[12px]">
              {/* Dynamic Island */}
              <div className="absolute top-2 w-20 h-5 bg-black rounded-full left-1/2 -translate-x-1/2 z-30 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-neutral-900 absolute right-3" />
              </div>
              
              {/* iOS Status Bar */}
              <div className="flex justify-between items-center px-4 pt-1 pb-2 text-[10px] text-white font-mono z-20">
                <span>09:41</span>
                <span className="flex items-center gap-1">5G 📶 🔋</span>
              </div>

              {/* iOS App Mockup container */}
              <div className="flex-1 bg-neutral-900 rounded-[32px] overflow-hidden p-2 flex flex-col items-center justify-center relative bg-radial-[circle_at_top,rgba(244,63,94,0.15)_0%,transparent_75%]">
                <span className="text-[10px] text-rose-450 font-bold tracking-widest absolute top-2 uppercase font-mono">LifeMyPhotos App Preview</span>
                
                {/* Embedded 4x6 print scaled to fit mobile screen without breakage */}
                <div className="scale-[0.72] origin-center shadow-lg transition-transform hover:scale-[0.75] duration-300">
                  <FourCutPrintFrame 
                    customBg={customBg}
                    customText={customText}
                    photos={photos}
                    theme={theme}
                    layoutStyle={layoutStyle}
                    frameLogoText={frameLogoText}
                    frameTitle={frameTitle}
                    frameSubTitle={frameSubTitle}
                    fontFamily={fontFamily}
                  />
                </div>

                <div className="absolute bottom-2 text-center text-[9px] text-gray-500 flex flex-col items-center">
                  <span className="text-white/80 font-bold bg-white/10 px-2 py-0.5 rounded-full mb-1">모바일 화면 깨짐 안심 방지 스케일링 적용</span>
                  <span>상하좌우 오차범위 0% 마진 홀드</span>
                </div>
              </div>
            </div>
          )}

          {/* GALAXY S24 ULTRA SIMULATOR SHIELD */}
          {viewDevice === "galaxy" && (
            <div className="w-[310px] h-[580px] bg-neutral-950 rounded-2xl border-[10px] border-neutral-850 shadow-2xl relative flex flex-col justify-between overflow-hidden p-3 border-t-[12px] border-b-[12px]">
              {/* Camera punch hole */}
              <div className="absolute top-2.5 w-3 h-3 bg-black rounded-full left-1/2 -translate-x-1/2 z-35" />
              
              {/* Android Status Bar */}
              <div className="flex justify-between items-center px-4 pt-1 pb-2 text-[9.5px] text-white font-mono z-20">
                <span>12:30 PM</span>
                <span className="flex items-center gap-1">LTE 🔋 100%</span>
              </div>

              {/* Android UI container */}
              <div className="flex-1 bg-neutral-900 rounded-lg overflow-hidden p-2 flex flex-col items-center justify-center relative">
                <span className="text-[10px] text-emerald-450 font-bold tracking-widest absolute top-2 uppercase font-mono">SAMSUNG OneUI Photo Studio</span>
                
                {/* Embedded 4x6 print appropriately scaled */}
                <div className="scale-[0.72] origin-center shadow-lg">
                  <FourCutPrintFrame 
                    customBg={customBg}
                    customText={customText}
                    photos={photos}
                    theme={theme}
                    layoutStyle={layoutStyle}
                    frameLogoText={frameLogoText}
                    frameTitle={frameTitle}
                    frameSubTitle={frameSubTitle}
                    fontFamily={fontFamily}
                  />
                </div>

                <div className="absolute bottom-2 text-center text-[9px] text-gray-500">
                  <span className="text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-900/40 mr-1">Galaxy Optimized 🤖</span>
                  <span>2열 격자 그리드 깨짐 제로</span>
                </div>
              </div>
            </div>
          )}

          {/* REAL PRINT SHEET VIEW */}
          {viewDevice === "print" && (
            <div className="bg-neutral-50 p-6 rounded-3xl border border-neutral-200/50 shadow-xl flex items-center justify-center relative overflow-hidden group bg-[url('https://images.unsplash.com/photo-1543269608-bc1532c5a242?auto=format&fit=crop&q=80&w=600')] bg-cover bg-center">
              <div className="absolute inset-0 bg-neutral-950/20 backdrop-blur-xs pointer-events-none" />
              
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0, s: 0.95 }}
                  animate={{ opacity: 1, s: 1 }}
                  exit={{ opacity: 0, s: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="z-10 shadow-2xl skew-x-1 -rotate-1 group-hover:skew-x-0 group-hover:rotate-0 transition-transform duration-350"
                >
                  <FourCutPrintFrame 
                    customBg={customBg}
                    customText={customText}
                    photos={photos}
                    theme={theme}
                    layoutStyle={layoutStyle}
                    frameLogoText={frameLogoText}
                    frameTitle={frameTitle}
                    frameSubTitle={frameSubTitle}
                    fontFamily={fontFamily}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Metadata stats display */}
        <div className="mt-4 flex flex-col items-center justify-center gap-1 text-center font-mono text-[10px] text-gray-400 leading-normal">
          <div className="flex items-center gap-1.5 text-neutral-500 font-sans font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>화면 반응형 완벽 보정 (기기별 해상도 종횡비 깨짐 안심 설계)</span>
          </div>
          <div>실물 인화 규격 : 가로 10cm x 세로 15cm (초고품질 지문 방지 무광 마감 기본)</div>
        </div>
      </div>
    </div>
  );
}

/* 
  Re-usable Subcomponent for the 4-Cut Frame:
  Outputs the exactly modeled, beautiful 2x2 grid with portrait photo slots 
  matching the user's uploaded images.
*/
interface PrintableFrameProps {
  customBg: string;
  customText: string;
  photos: string[];
  theme: typeof PRESET_THEMES[0];
  layoutStyle: "heart" | "vintage" | "festival";
  frameLogoText: string;
  frameTitle: string;
  frameSubTitle: string;
  fontFamily: string;
}

function FourCutPrintFrame({
  customBg,
  customText,
  photos,
  theme,
  layoutStyle,
  frameLogoText,
  frameTitle,
  frameSubTitle,
  fontFamily
}: PrintableFrameProps) {
  return (
    <div
      style={{ backgroundColor: customBg }}
      className="w-[305px] p-4 rounded-xl transition-all duration-300 relative flex flex-col justify-between border select-none h-[450px]"
    >
      {/* Paper texture noise */}
      <div className="absolute inset-0 bg-radial-[circle_at_center,rgba(255,255,255,0.06)_1px,transparent_1px] bg-[size:5px_5px] pointer-events-none rounded-xl" />
      
      {/* Inner fine border line */}
      <div
        className="absolute inset-[4px] pointer-events-none rounded-lg"
        style={{ border: `1px solid ${customText}1C` }}
      />

      {/* HEADER SECTION */}
      {/* Heart Layout Header (Like the second uploaded image) */}
      {layoutStyle === "heart" && (
        <div className="flex flex-col items-center justify-center pt-2 pb-1 z-10">
          <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-xs border border-gray-100">
            <span className="text-rose-500 text-[10px] animate-pulse">❤️</span>
          </div>
          <span 
            className="text-[7.5px] font-mono tracking-widest font-extrabold uppercase mt-1" 
            style={{ color: `${customText}D9` }}
          >
            {frameLogoText || "PP"}
          </span>
        </div>
      )}

      {/* Vintage Layout Header (Like first uploaded images) */}
      {layoutStyle === "vintage" && (
        <div className="flex justify-between items-center px-1.5 pt-1.5 pb-1 z-10 font-mono text-[8px] font-bold tracking-wider">
          <span style={{ color: customText }} className="uppercase">{frameLogoText || "PHOTOMATIC"}</span>
          <span style={{ color: `${customText}CC` }}>2026.06.22</span>
        </div>
      )}

      {/* Festival Layout Header */}
      {layoutStyle === "festival" && (
        <div className="flex items-center justify-between px-2 pt-1 pb-1 z-10">
          <div className="flex items-center gap-1 rotate-[-2deg]">
            <span className="text-amber-500 text-xs">✨</span>
            <span className="font-extrabold text-[8px] uppercase font-mono tracking-tighter" style={{ color: customText }}>
              Special Cut
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          </div>
        </div>
      )}

      {/* MAIN BODY: Photo grid + vertical typography margins */}
      <div className="flex-1 flex items-center justify-center relative py-1">
        
        {/* Left vertical text margin (Vintage / Festival style) */}
        {(layoutStyle === "vintage" || layoutStyle === "festival") && (
          <div className="absolute left-[-2px] inset-y-10 flex flex-col justify-between items-center pointer-events-none select-none z-10 text-[6.5px] font-mono font-black uppercase text-center [writing-mode:vertical-lr] rotate-180">
            <span style={{ color: `${customText}A6` }} className="tracking-[3px]">
              ★ TAKE YOUR MEMORY ★
            </span>
          </div>
        )}

        {/* The 2x2 Grid using Vertical portrait aspect-ratio slots! [aspect-[3/4]] matching the images exactly */}
        <div className="grid grid-cols-2 gap-1.5 px-3.5 z-10 w-full">
          {photos.map((ph, idx) => (
            <div
              key={idx}
              className="bg-neutral-50 aspect-[3/4] rounded shadow-sm overflow-hidden relative"
              style={{
                border: `1.5px solid ${customBg === "#FFFFFF" ? "#1F29373D" : "#ffffff4D"}`
              }}
            >
              <img
                src={ph}
                alt={`Photo cutout ${idx + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              
              {/* Simulated sticker based on selections */}
              {idx === 0 && theme.sticker === "hearts" && (
                <span className="absolute top-1.5 left-1.5 text-rose-550 text-xs drop-shadow-md animate-pulse">❤️</span>
              )}
              {idx === 1 && theme.sticker === "stars" && (
                <span className="absolute bottom-1.5 right-1.5 text-amber-300 text-xs drop-shadow-md animate-bounce">⭐</span>
              )}
              {idx === 2 && theme.sticker === "flowers" && (
                <span className="absolute top-1.5 right-1.5 text-rose-450 text-xs drop-shadow-md">🌸</span>
              )}
              {idx === 3 && theme.sticker === "bubbles" && (
                <span className="absolute bottom-1.5 left-1.5 text-sky-450 text-xs drop-shadow-md opacity-85">🫧</span>
              )}

              {/* Minimal indexing numbers like real film strips */}
              <div className="absolute bottom-0.5 right-1 bg-black/50 text-[6.5px] px-1 text-white/95 font-mono rounded">
                0{idx + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Right vertical text margin (Vintage / Festival style) */}
        {(layoutStyle === "vintage" || layoutStyle === "festival") && (
          <div className="absolute right-[-2px] inset-y-10 flex flex-col justify-between items-center pointer-events-none select-none z-10 text-[6.5px] font-mono font-black uppercase text-center [writing-mode:vertical-lr]">
            <span style={{ color: `${customText}A6` }} className="tracking-[2.5px]">
              PHOTOMATIC CLASSIC
            </span>
          </div>
        )}
      </div>

      {/* BOTTOM FOOTER BRADING PLATE */}
      {layoutStyle === "festival" ? (
        /* Festival layout features a beautiful colorful strip with stylized title overlay */
        <div className="relative pt-1 pb-2 px-1 text-center overflow-hidden z-10 flex flex-col items-center">
          <div className="absolute inset-x-0 bottom-0 top-1 bg-gradient-to-r from-pink-400 via-amber-300 to-sky-400 opacity-20 blur-xs rounded-lg pointer-events-none" />
          <h4
            style={{ color: customText }}
            className={`tracking-tighter text-[11px] font-extrabold text-center relative z-10 leading-none ${fontFamily}`}
          >
            🎉 {frameTitle || "2026 WEVERSE FESTIVAL"}
          </h4>
          <p
            style={{ color: `${customText}E6` }}
            className={`text-[8px] tracking-widest leading-none text-center font-bold opacity-90 mt-1 relative z-10 lowercase font-mono ${fontFamily}`}
          >
            {frameSubTitle || "happy weverse days together"}
          </p>
        </div>
      ) : (
        /* Classic minimalist typography bottom plate */
        <div className="text-center pt-1.5 pb-2.5 px-2 flex flex-col items-center justify-center gap-0.5 z-10">
          <h4
            style={{ color: customText }}
            className={`tracking-tight text-[11.5px] font-black text-center leading-none ${fontFamily}`}
          >
            {frameTitle || "우리 단짝의 소중한 기록"}
          </h4>
          <p
            style={{ color: `${customText}CC` }}
            className={`text-[8px] tracking-wide leading-none text-center opacity-85 mt-0.5 ${fontFamily}`}
          >
            {frameSubTitle || "2026.10.18 HAPPY MEMORY"}
          </p>
        </div>
      )}
    </div>
  );
}
