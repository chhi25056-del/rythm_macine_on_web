"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  TUTORIAL_STEPS,
  TOTAL_TUTORIAL_STEPS,
  calculateNextTutorialStep,
  forceNextTutorialStep,
  type TutorialStepConfig,
} from "@/lib/tutorial";

export function useTutorial(initialStep: number | null = 1) {
  const [tutorialStep, setTutorialStep] = useState<number | null>(initialStep);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const completionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentStepConfig: TutorialStepConfig | null =
    tutorialStep !== null
      ? TUTORIAL_STEPS.find((s) => s.step === tutorialStep) ?? null
      : null;

  const dismissCompleted = useCallback(() => {
    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
    setIsCompleted(false);
    setTutorialStep(null);
  }, []);

  /**
   * 特定のアクションが発火した際に、現在のステップ番号と一致していれば次のステップへ進行します。
   * 最終ステップ完了時はお祝い演出（isCompleted: true）を表示後、自動で終了します。
   */
  const triggerStep = useCallback(
    (triggeredStep: number) => {
      setTutorialStep((prev) => {
        const next = calculateNextTutorialStep(prev, triggeredStep);
        if (prev === TOTAL_TUTORIAL_STEPS && next === null) {
          setIsCompleted(true);
          if (completionTimerRef.current) {
            clearTimeout(completionTimerRef.current);
          }
          completionTimerRef.current = setTimeout(() => {
            setIsCompleted(false);
          }, 4500);
        }
        return next;
      });
    },
    []
  );

  /**
   * 強制的に次のステップへ進めます（デバッグ用）
   */
  const nextStep = useCallback(() => {
    setTutorialStep((prev) => {
      const next = forceNextTutorialStep(prev);
      if (prev === TOTAL_TUTORIAL_STEPS && next === null) {
        setIsCompleted(true);
        if (completionTimerRef.current) {
          clearTimeout(completionTimerRef.current);
        }
        completionTimerRef.current = setTimeout(() => {
          setIsCompleted(false);
        }, 4500);
      }
      return next;
    });
  }, []);

  /**
   * チュートリアルを終了（非表示）にします
   */
  const skipTutorial = useCallback(() => {
    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
    setIsCompleted(false);
    setTutorialStep(null);
  }, []);

  /**
   * チュートリアルを最初のステップ（Step 1）から開始・再開します
   */
  const startTutorial = useCallback(() => {
    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
    setIsCompleted(false);
    setTutorialStep(1);
  }, []);

  useEffect(() => {
    return () => {
      if (completionTimerRef.current) {
        clearTimeout(completionTimerRef.current);
      }
    };
  }, []);

  return {
    tutorialStep,
    currentStepConfig,
    totalSteps: TOTAL_TUTORIAL_STEPS,
    isCompleted,
    dismissCompleted,
    triggerStep,
    nextStep,
    skipTutorial,
    startTutorial,
  };
}
