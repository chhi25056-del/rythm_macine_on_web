"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type {
  PatternTutorialConfig,
  PatternTutorialStep,
} from "@/lib/patternTutorial";

interface PatternTutorialGuideProps {
  activeConfig: PatternTutorialConfig | null;
  currentStepConfig: PatternTutorialStep | null;
  stepNumber: number;
  totalSteps: number;
  isCompleted: boolean;
  isAdvancing: boolean;
  remainingStepsCount: number;
  onNext: () => void;
  onPrev: () => void;
  onStop: () => void;
  onDismissCompleted: () => void;
}

export function PatternTutorialGuide({
  activeConfig,
  currentStepConfig,
  stepNumber,
  totalSteps,
  isCompleted,
  isAdvancing,
  remainingStepsCount,
  onNext,
  onPrev,
  onStop,
  onDismissCompleted,
}: PatternTutorialGuideProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // 紙吹雪パーティクル
  const confettiPieces = useMemo(() => {
    const colors = ["#f59e0b", "#ec4899", "#8b5cf6", "#10b981", "#38bdf8", "#fbbf24"];
    return Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      color: colors[i % colors.length],
      left: `${(i * 2.3) % 100}%`,
      delay: `${(i % 10) * 0.15}s`,
      duration: `${2.2 + (i % 5) * 0.4}s`,
      size: `${6 + (i % 6) * 2}px`,
    }));
  }, []);

  // 1. パターン完成時の祝賀モーダル（全画面オーバーレイ）
  if (isCompleted && activeConfig) {
    if (typeof window === "undefined") return null;

    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
        {/* 紙吹雪アニメーション */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {confettiPieces.map((p) => (
            <span
              key={p.id}
              className="absolute -top-4 rounded-sm animate-confetti-fall"
              style={{
                left: p.left,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                animationDelay: p.delay,
                animationDuration: p.duration,
              }}
            />
          ))}
        </div>

        {/* 祝賀カード */}
        <div className="relative z-10 max-w-lg w-full max-h-[90vh] overflow-y-auto bg-zinc-900 border border-amber-400/80 rounded-2xl p-5 sm:p-6 text-center shadow-2xl shadow-amber-500/20 animate-in zoom-in-95 duration-200 flex flex-col gap-3">
          {/* 右上閉じるボタン */}
          <button
            type="button"
            onClick={onDismissCompleted}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer text-sm"
            title="閉じる"
            aria-label="閉じる"
          >
            ✕
          </button>

          <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30">
            🥁
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-wide">
              パターン完成！
            </h2>
            <p className="text-sm font-bold text-amber-300 mt-0.5">
              『{activeConfig.name}』のビートが完成しました！
            </p>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {activeConfig.description}
          </p>

          <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400 text-left">
            💡 <strong className="text-amber-400">ワンポイント:</strong> BPMを
            <strong className="text-zinc-200"> {activeConfig.recommendedBpm} </strong>
            前後に合わせたり、他の楽器の音を足して自分好みのビートに発展させてみよう！
          </div>

          {/* YouTube 楽曲サジェスト */}
          {activeConfig.suggestedTracks && activeConfig.suggestedTracks.length > 0 && (
            <div className="flex flex-col gap-2 text-left pt-2 border-t border-zinc-800/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <span className="text-rose-500">▶</span>
                  <span>このリズムが使われている名曲（YouTube）</span>
                </span>
                <span className="text-[10px] text-zinc-500">クリックして試聴</span>
              </div>

              <div className="flex flex-col gap-1.5">
                {activeConfig.suggestedTracks.map((track, idx) => (
                  <a
                    key={idx}
                    href={track.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-800/90 border border-zinc-800 hover:border-red-500/60 transition-all flex items-start justify-between gap-2 group cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-zinc-100 group-hover:text-red-400 transition-colors">
                          {track.title}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          - {track.artist}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1 leading-snug">
                        {track.comment}
                      </p>
                    </div>

                    <span className="shrink-0 text-[11px] font-bold px-2 py-1 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 group-hover:bg-red-600 group-hover:text-white transition-colors flex items-center gap-1">
                      <span>YouTube</span>
                      <span className="text-[9px]">↗</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onDismissCompleted}
            className="w-full mt-2 py-2.5 px-4 rounded-xl font-bold bg-amber-400 hover:bg-amber-300 text-zinc-950 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            完了して自由に編集する
          </button>
        </div>
      </div>,
      document.body
    );
  }

  // ガイド非表示（チュートリアル非アクティブ時）
  if (!activeConfig || !currentStepConfig) return null;

  // 2. 学習中のインラインガイドカード（ステップを塞がないようシーケンサー枠内にインライン配置）
  return (
    <div className="w-full bg-zinc-950/90 border border-amber-400/80 rounded-xl p-2.5 sm:p-3 shadow-lg shadow-amber-500/10 flex flex-col gap-2 transition-all">
      {/* 上段: パターン名・ステップ・進捗・操作ボタン */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-1.5">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-zinc-950 uppercase tracking-wider">
            {activeConfig.name}
          </span>
          <span className="text-xs font-bold text-zinc-200">
            Step {stepNumber} / {totalSteps}
          </span>
          {isAdvancing ? (
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 animate-pulse">
              <span>✓</span>
              <span>Good!</span>
            </span>
          ) : currentStepConfig.actionType === "placeSteps" ? (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-amber-300 border border-zinc-700">
              {remainingStepsCount === 0 ? "OK!" : `残り ${remainingStepsCount} マス`}
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
              ▶ 再生してみよう
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onPrev}
            disabled={stepNumber <= 1}
            className="px-2 py-0.5 text-[11px] rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="前のステップ"
          >
            ← 前へ
          </button>
          <button
            type="button"
            onClick={onNext}
            className="px-2.5 py-0.5 text-[11px] rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-medium transition-colors cursor-pointer"
            title={stepNumber === totalSteps ? "完了" : "スキップ"}
          >
            {stepNumber === totalSteps ? "完了" : "スキップ →"}
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="px-1.5 py-0.5 text-[10px] rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer border border-zinc-800"
            title={isCollapsed ? "詳細を展開" : "詳細を閉じる"}
          >
            {isCollapsed ? "詳細 ▼" : "縮小 ▲"}
          </button>
          <button
            type="button"
            onClick={onStop}
            className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 text-xs transition-colors cursor-pointer ml-1"
            title="パターン学習を終了"
            aria-label="パターン学習を終了"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 進捗プログレスバー */}
      <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-300"
          style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
        />
      </div>

      {/* 詳細ブロック（折りたたみ対応） */}
      {!isCollapsed && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5 text-xs">
          <div className="flex-1">
            <div className="font-bold text-zinc-100 flex items-center gap-1.5 mb-0.5">
              <span>🎯</span>
              <span>{currentStepConfig.title}</span>
            </div>
            <p className="text-zinc-300 text-[11px] leading-relaxed">
              {currentStepConfig.description}
            </p>
          </div>

          {currentStepConfig.trivia && (
            <div className="sm:max-w-xs p-1.5 sm:p-2 rounded-lg bg-zinc-900 border border-zinc-800/80 text-[10px] text-zinc-400 leading-snug shrink-0">
              <span className="text-amber-400 font-semibold mr-1">💡 豆知識:</span>
              {currentStepConfig.trivia}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
