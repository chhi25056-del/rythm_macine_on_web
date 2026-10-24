"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import type { TutorialStepConfig } from "@/lib/tutorial";

interface TutorialSpotlightProps {
  currentStep: number | null;
  totalSteps: number;
  config: TutorialStepConfig | null;
  isCompleted: boolean;
  onSkip: () => void;
  onDismiss: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: number;
}

export function TutorialSpotlight({
  currentStep,
  totalSteps,
  config,
  isCompleted,
  onSkip,
  onDismiss,
}: TutorialSpotlightProps) {
  const [mounted, setMounted] = useState<boolean>(false);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // ターゲット要素のサイズと位置を測定
  const updateRect = useCallback(() => {
    if (!config) {
      setTargetRect(null);
      return;
    }
    const el = document.getElementById(config.targetId);
    if (!el) {
      setTargetRect(null);
      return;
    }

    const b = el.getBoundingClientRect();
    const padding = 6;
    setTargetRect({
      top: Math.max(0, b.top - padding),
      left: Math.max(0, b.left - padding),
      width: b.width + padding * 2,
      height: b.height + padding * 2,
      borderRadius: 8,
    });
  }, [config]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });

    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      updateRect();
    };

    const handleScroll = () => {
      updateRect();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    // 要素マウント直後および数フレーム遅延して正確に測定
    updateRect();
    const timer = setTimeout(updateRect, 100);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
      clearTimeout(timer);
    };
  }, [updateRect, currentStep]);

  // ターゲット要素およびツールチップ以外へのクリックを遮断（暗転エリアの誤操作防止）
  useEffect(() => {
    if (!config || isCompleted) return;

    const handleGlobalClickCapture = (e: MouseEvent) => {
      const targetNode = e.target as Node;
      if (!targetNode) return;

      // ターゲット要素内部（またはメニュー内部）のクリックなら許可
      const targetEl = document.getElementById(config.targetId);
      if (
        targetEl &&
        (targetEl === targetNode ||
          targetEl.contains(targetNode) ||
          (targetNode instanceof Element && targetNode.closest(`#${config.targetId}`)))
      ) {
        return;
      }

      // ツールチップ内部のクリックなら許可
      const tooltipEl = document.getElementById("tutorial-tooltip-container");
      if (
        tooltipEl &&
        (tooltipEl === targetNode ||
          tooltipEl.contains(targetNode) ||
          (targetNode instanceof Element && targetNode.closest("#tutorial-tooltip-container")))
      ) {
        return;
      }

      // 暗転外枠のクリックはブロックしてチュートリアルの誤動作を防止
      e.stopPropagation();
      e.preventDefault();
    };

    // キャプチャフェーズで登録して確実に判定
    window.addEventListener("click", handleGlobalClickCapture, true);
    window.addEventListener("mousedown", handleGlobalClickCapture, true);

    return () => {
      window.removeEventListener("click", handleGlobalClickCapture, true);
      window.removeEventListener("mousedown", handleGlobalClickCapture, true);
    };
  }, [config, isCompleted]);

  // 紙吹雪パーティクル（完了時用）
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

  if (!mounted) {
    return null;
  }

  // 完了時の祝賀モーダル
  if (isCompleted) {
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
        <div className="relative z-10 max-w-sm w-full bg-zinc-900 border border-amber-400/80 rounded-2xl p-6 text-center shadow-2xl shadow-amber-500/20 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30">
            🎉
          </div>
          <h2 className="text-xl font-extrabold text-white mb-2 tracking-wide">
            おめでとう！
          </h2>
          <p className="text-sm font-bold text-amber-300 mb-2">
            自分だけの変拍子ビートができた！
          </p>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            クイックフィルやポリメーターを活用して、自由自在にリズムを作り出してみましょう。
          </p>
          <button
            type="button"
            onClick={onDismiss}
            className="w-full py-2.5 px-4 rounded-xl font-extrabold text-sm bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            ビート作成をはじめる 🚀
          </button>
        </div>
      </div>,
      document.body
    );
  }

  // チュートリアル非表示またはステップなし
  if (currentStep === null || !config) {
    return null;
  }

  // 吹き出しの位置計算（要素の下、または上に配置）
  const tooltipWidth = 320;
  // Step 4 のときはメニュー展開を考慮して上に配置
  const isBottomPlacement =
    currentStep === 4
      ? false
      : targetRect
      ? targetRect.top + targetRect.height + 180 < windowSize.height
      : true;

  const tooltipStyle: React.CSSProperties = targetRect
    ? {
        position: "fixed",
        width: `${tooltipWidth}px`,
        left: `${Math.max(
          16,
          Math.min(
            windowSize.width - tooltipWidth - 16,
            targetRect.left + targetRect.width / 2 - tooltipWidth / 2
          )
        )}px`,
        top: isBottomPlacement
          ? `${targetRect.top + targetRect.height + 12}px`
          : `${Math.max(16, targetRect.top - 150)}px`,
      }
    : {
        position: "fixed",
        top: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        width: `${tooltipWidth}px`,
      };

  return createPortal(
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* 
        暗転スポットライト:
        くり抜き枠自体に巨大な box-shadow (0 0 0 9999px rgba(0,0,0,0.74)) をかけることで、
        画面全体を暗転させつつ、枠の内側は pointer-events: none により背後のHTML要素
        （PLAYボタン、ステップセル、Fillボタン、ステップ長変更ボタン等）への操作が100%確実に届きます。
      */}
      {targetRect && (
        <div
          className="fixed rounded-lg pointer-events-none z-40 transition-all duration-300 ease-out"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.74)",
          }}
        >
          {/* スポットライト枠のパルス＆グロー演出 */}
          <div className="absolute -inset-0.5 rounded-lg border-2 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.75)] ring-4 ring-amber-400/40 animate-pulse" />
        </div>
      )}

      {/* 吹き出しメッセージ (Tooltip / Popover) */}
      <div
        id="tutorial-tooltip-container"
        style={tooltipStyle}
        className="pointer-events-auto z-50 bg-zinc-900/95 border border-amber-400/70 rounded-xl p-3.5 shadow-2xl shadow-black/90 backdrop-blur-md transition-all duration-300 ease-out animate-in fade-in zoom-in-95"
      >
        <div className="flex items-center justify-between gap-2 mb-1.5 pb-1.5 border-b border-zinc-800">
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-400 text-zinc-950">
              STEP {currentStep} / {totalSteps}
            </span>
            <span className="text-xs font-bold text-zinc-200">
              {config.title}
            </span>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="text-[10px] font-semibold text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 px-1.5 py-0.5 rounded transition-all cursor-pointer"
            title="チュートリアルをスキップ"
          >
            スキップ ✕
          </button>
        </div>

        <p className="text-xs text-zinc-100 font-medium leading-relaxed mb-1">
          {config.message}
        </p>

        <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-400">
          <span className="flex items-center gap-1 text-amber-300 font-semibold">
            <span className="animate-bounce">👉</span> 対象を操作して次へ
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
