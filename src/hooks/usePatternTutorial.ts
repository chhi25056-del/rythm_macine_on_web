"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  PATTERN_TUTORIAL_CONFIGS,
  isPatternStepComplete,
  type PatternTutorialType,
  type PatternTutorialConfig,
  type PatternTutorialStep,
} from "@/lib/patternTutorial";
import type { Pattern } from "@/lib/sequencer";

export function usePatternTutorial() {
  const [activeType, setActiveType] = useState<PatternTutorialType | null>(null);
  const [stepIndex, setStepIndex] = useState<number>(0); // 0-indexed
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isAdvancing, setIsAdvancing] = useState<boolean>(false);

  const advanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeConfig: PatternTutorialConfig | null = activeType
    ? PATTERN_TUTORIAL_CONFIGS[activeType] ?? null
    : null;

  const currentStepConfig: PatternTutorialStep | null =
    activeConfig && stepIndex < activeConfig.steps.length
      ? activeConfig.steps[stepIndex]
      : null;

  const totalSteps = activeConfig?.steps.length ?? 0;

  const clearTimers = useCallback(() => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
      completionTimeoutRef.current = null;
    }
  }, []);

  const stopTutorial = useCallback(() => {
    clearTimers();
    setActiveType(null);
    setStepIndex(0);
    setIsCompleted(false);
    setIsAdvancing(false);
  }, [clearTimers]);

  const startTutorial = useCallback(
    (type: PatternTutorialType) => {
      clearTimers();
      setActiveType(type);
      setStepIndex(0);
      setIsCompleted(false);
      setIsAdvancing(false);
    },
    [clearTimers]
  );

  const nextStep = useCallback(() => {
    if (!activeConfig) return;
    clearTimers();
    setIsAdvancing(false);

    if (stepIndex + 1 >= activeConfig.steps.length) {
      // ユーザーが明示的に閉じるまで修了画面を保持する
      setIsCompleted(true);
    } else {
      setStepIndex((prev) => prev + 1);
    }
  }, [activeConfig, stepIndex, clearTimers]);

  const prevStep = useCallback(() => {
    clearTimers();
    setIsAdvancing(false);
    setStepIndex((prev) => Math.max(0, prev - 1));
  }, [clearTimers]);

  /**
   * 現在のパターン状態および再生状態を評価し、完了していればステップを進行させます
   */
  const checkAndAdvance = useCallback(
    (pattern: Pattern, isPlaying: boolean) => {
      if (!currentStepConfig || isCompleted || isAdvancing) return;

      const complete = isPatternStepComplete(currentStepConfig, pattern, isPlaying);
      if (complete) {
        setIsAdvancing(true);
        // 入力完了後、視覚的フィードバックの余韻を持たせて次のステップへ進行
        const delay = currentStepConfig.actionType === "play" ? 1200 : 650;
        advanceTimeoutRef.current = setTimeout(() => {
          nextStep();
        }, delay);
      }
    },
    [currentStepConfig, isCompleted, isAdvancing, nextStep]
  );

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    activeType,
    activeConfig,
    currentStepConfig,
    stepIndex,
    stepNumber: stepIndex + 1,
    totalSteps,
    isCompleted,
    isAdvancing,
    startTutorial,
    stopTutorial,
    nextStep,
    prevStep,
    checkAndAdvance,
    dismissCompleted: stopTutorial,
  };
}
