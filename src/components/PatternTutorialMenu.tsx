"use client";

import { useState, useRef, useEffect } from "react";
import {
  PATTERN_TUTORIAL_CONFIGS,
  type PatternTutorialType,
} from "@/lib/patternTutorial";

interface PatternTutorialMenuProps {
  activeType: PatternTutorialType | null;
  onSelectPattern: (type: PatternTutorialType) => void;
  onStopPattern: () => void;
}

export function PatternTutorialMenu({
  activeType,
  onSelectPattern,
  onStopPattern,
}: PatternTutorialMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeConfig = activeType ? PATTERN_TUTORIAL_CONFIGS[activeType] : null;

  return (
    <div className="relative" ref={menuRef}>
      {activeType ? (
        <div className="flex items-center gap-1 bg-amber-400 text-zinc-950 font-bold px-2 py-1 rounded-lg text-xs shadow-md border border-amber-300 animate-pulse">
          <span className="flex items-center gap-1">
            <span>🥁</span>
            <span className="truncate max-w-[90px] sm:max-w-none">
              学習中: {activeConfig?.name}
            </span>
          </span>
          <button
            type="button"
            onClick={onStopPattern}
            className="ml-1 p-0.5 hover:bg-amber-500 rounded text-zinc-900 transition-colors cursor-pointer"
            title="パターン学習を終了"
            aria-label="パターン学習を終了"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border bg-zinc-950 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-amber-400"
          title="リズムパターン学習メニューを開く"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span>🥁</span>
          <span className="hidden sm:inline">リズムパターン学習</span>
          <span className="sm:hidden">パターン</span>
          <span className="text-[9px] opacity-70">▾</span>
        </button>
      )}

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-xl p-2 shadow-2xl shadow-black/80 min-w-[260px] flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 border-b border-zinc-800/80">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              リズムパターン学習 (任意)
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              打ち込みの基本とグルーヴの仕組みを学ぼう
            </p>
          </div>

          <div className="flex flex-col gap-1">
            {(Object.keys(PATTERN_TUTORIAL_CONFIGS) as PatternTutorialType[]).map((type) => {
              const cfg = PATTERN_TUTORIAL_CONFIGS[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onSelectPattern(type);
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-zinc-800/90 border border-transparent hover:border-zinc-700 transition-all flex flex-col gap-0.5 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-100 group-hover:text-amber-400 transition-colors">
                      {cfg.name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60 font-mono">
                      {cfg.badge}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400 line-clamp-1">
                    {cfg.genre}（推奨 BPM {cfg.recommendedBpm}）
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
