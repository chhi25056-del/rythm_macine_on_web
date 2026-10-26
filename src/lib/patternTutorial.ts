/**
 * リズムパターン学習チュートリアル（4つ打ち・8ビート・16ビート）の定義と純粋関数
 */

import type { TrackId, Pattern } from "@/lib/sequencer";

export type PatternTutorialType = "fourOnTheFloor" | "eightBeat" | "sixteenBeat";

export interface PatternTutorialStep {
  step: number;
  title: string;
  description: string;
  trivia?: string;
  actionType: "placeSteps" | "play";
  trackId?: TrackId;
  targetSteps?: number[]; // 0〜15のステップインデックス
}

export interface SuggestedTrack {
  title: string;
  artist: string;
  youtubeUrl: string;
  comment: string;
}

export interface PatternTutorialConfig {
  id: PatternTutorialType;
  name: string;
  englishName: string;
  badge: string;
  genre: string;
  description: string;
  recommendedBpm: number;
  steps: PatternTutorialStep[];
  suggestedTracks: SuggestedTrack[];
}

export const PATTERN_TUTORIAL_CONFIGS: Record<PatternTutorialType, PatternTutorialConfig> = {
  fourOnTheFloor: {
    id: "fourOnTheFloor",
    name: "4つ打ち",
    englishName: "Four on the floor",
    badge: "EDM / House",
    genre: "クラブミュージック・ダンス",
    description: "心臓の鼓動のように鳴り続けるバスドラムと裏拍のハイハットが生み出す、ダンスミュージックの王道ビート！",
    recommendedBpm: 126,
    steps: [
      {
        step: 1,
        title: "Kickで4拍のビートを刻む",
        description: "バスドラム(Kick)を1拍ごと（1, 5, 9, 13マス目）に打ち込み、フロアを揺らす力強い土台を作ろう！",
        trivia: "1小節の4拍すべてに均等にバスドラムを鳴らすことから「4つ打ち」と呼ばれ、EDMやハウス、ディスコの象徴です。",
        actionType: "placeSteps",
        trackId: "kick",
        targetSteps: [0, 4, 8, 12],
      },
      {
        step: 2,
        title: "Snareでアクセントを加える",
        description: "スネア(Snare)を2拍目と4拍目（5, 13マス目）に打ち込んで、リズムにキレと推進力を加えよう！",
        trivia: "2拍目・4拍目にスネアを重ねることで、キックの単調さを解消し、聴き手がノリやすくなります。",
        actionType: "placeSteps",
        trackId: "snare",
        targetSteps: [4, 12],
      },
      {
        step: 3,
        title: "Hi-Hatを裏拍(オフビート)に入れる",
        description: "キックとキックの間（3, 7, 11, 15マス目）にOpen Hi-Hatを打ち込もう！体が浮き上がるようなグルーヴが生まれるよ！",
        trivia: "裏拍でハイハットを開く（オープン）演奏は「裏打ち」と呼ばれ、ダンスフロアを沸かせる最大の秘密です。",
        actionType: "placeSteps",
        trackId: "hihatOpen",
        targetSteps: [2, 6, 10, 14],
      },
      {
        step: 4,
        title: "4つ打ちビートを再生してみよう！",
        description: "PLAYボタンを押して、完成したダンスグルーヴを聴いてみよう！BPM126前後の疾走感を味わおう！",
        actionType: "play",
      },
    ],
    suggestedTracks: [
      {
        title: "One More Time",
        artist: "Daft Punk",
        youtubeUrl: "https://www.youtube.com/watch?v=FGBhQbmPwH8",
        comment: "世界中を踊らせたフレンチ・ハウスの金字塔。力強い4つ打ちキックと裏打ちハイハットのお手本です。",
      },
      {
        title: "Wake Me Up",
        artist: "Avicii",
        youtubeUrl: "https://www.youtube.com/watch?v=IcrbM1l_BoI",
        comment: "アコースティックギターから一気にEDMの4つ打ちドロップへと突入するカタルシスが最高の名曲。",
      },
      {
        title: "Don't Start Now",
        artist: "Dua Lipa",
        youtubeUrl: "https://www.youtube.com/watch?v=oygrmJFKYZY",
        comment: "現代のニューディスコ・ダンスポップ。弾むような裏拍ハイハットとタイトな4つ打ちビートが特徴。",
      },
    ],
  },

  eightBeat: {
    id: "eightBeat",
    name: "8ビート",
    englishName: "8 Beat",
    badge: "Rock / Pop",
    genre: "ロック・J-POP・ポップス",
    description: "1小節を8分割したハイハットの刻みが特徴。世界中のポップス・ロックで最も愛されている基本のリズム！",
    recommendedBpm: 120,
    steps: [
      {
        step: 1,
        title: "Closed Hi-Hatで8分音符を刻む",
        description: "クローズドハイハット(Closed HH)を1マスおき（奇数マス 1, 3, 5, 7, 9, 11, 13, 15）に打ち込もう！（Fillメニューの『8分音符』も使えるよ！）",
        trivia: "ハイハットを8分音符（1小節に8回）で均等に刻むことが「8ビート」の名前の由来です。",
        actionType: "placeSteps",
        trackId: "hihatClosed",
        targetSteps: [0, 2, 4, 6, 8, 10, 12, 14],
      },
      {
        step: 2,
        title: "Snareでバックビートを鳴らす",
        description: "スネア(Snare)を2拍目・4拍目（5, 13マス目）に打ち込もう！",
        trivia: "2拍目と4拍目の強い打撃音は「バックビート」と呼ばれ、ロックのノリの背骨となります。",
        actionType: "placeSteps",
        trackId: "snare",
        targetSteps: [4, 12],
      },
      {
        step: 3,
        title: "Kickでドラムの骨格を完成させる",
        description: "バスドラム(Kick)を1, 9, 11マス目に打ち込もう！『ドン・パン・ドド・パン』という王道の8ビートが完成するよ！",
        trivia: "3拍目の裏（11マス目）にキックを入れることで、次のスネアに向かって前進する力強いノリが生まれます。",
        actionType: "placeSteps",
        trackId: "kick",
        targetSteps: [0, 8, 10],
      },
      {
        step: 4,
        title: "8ビートを再生してみよう！",
        description: "PLAYボタンを押して、バンドサウンドの要となる王道8ビートを体感してみよう！",
        actionType: "play",
      },
    ],
    suggestedTracks: [
      {
        title: "Billie Jean",
        artist: "Michael Jackson",
        youtubeUrl: "https://www.youtube.com/watch?v=Zi_XLOBDo_Y",
        comment: "冒頭のドラムソロから始まる、ポピュラー音楽史上最も有名で無駄のない究極の8ビート。",
      },
      {
        title: "Smells Like Teen Spirit",
        artist: "Nirvana",
        youtubeUrl: "https://www.youtube.com/watch?v=hTWKbfoikeg",
        comment: "グランジ・ロックの伝説的アンセム。力強い8ビートとスネアのバックビートが爆音ギターを支えます。",
      },
      {
        title: "Pretender",
        artist: "Official髭男dism",
        youtubeUrl: "https://www.youtube.com/watch?v=TQ8WlA2GXbk",
        comment: "J-POP王道の8ビート。メロディの切なさを引き立てる安定感抜群のドラミングが聴きどころ。",
      },
    ],
  },

  sixteenBeat: {
    id: "sixteenBeat",
    name: "16ビート",
    englishName: "16 Beat",
    badge: "Funk / R&B",
    genre: "ファンク・R&B・洗練ポップス",
    description: "16分音符の細かな刻みと、拍頭をずらしたシンコペーションが生み出す、うねるような洗練されたグルーヴ！",
    recommendedBpm: 96,
    steps: [
      {
        step: 1,
        title: "Closed Hi-Hatを16分音符で敷き詰める",
        description: "クローズドハイハットを16マスすべてに打ち込もう！（Fillメニューの『16分音符』を使うと一瞬で埋められるよ！）",
        trivia: "16分音符で細かく刻むことで、8ビートよりも滑らかで疾走感のある細やかなビートのキャンバスができます。",
        actionType: "placeSteps",
        trackId: "hihatClosed",
        targetSteps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      },
      {
        step: 2,
        title: "Snareで中心軸を定める",
        description: "スネア(Snare)を2拍目・4拍目（5, 13マス目）に打ち込み、ビートの芯を固定しよう！",
        trivia: "細かいハイハットの中でも、2拍・4拍のスネアがしっかり鳴ることでリズムの迷子にならずに済みます。",
        actionType: "placeSteps",
        trackId: "snare",
        targetSteps: [4, 12],
      },
      {
        step: 3,
        title: "Kickでシンコペーションを生み出す",
        description: "バスドラム(Kick)を1, 7, 11マス目に打ち込もう！7マス目のキックが独特の『タメ』とうねりを生み出すよ！",
        trivia: "拍の頭を外して少し早いタイミングで音を入れることを「シンコペーション」と呼び、ファンク特有の粘り強いグルーヴを生みます。",
        actionType: "placeSteps",
        trackId: "kick",
        targetSteps: [0, 6, 10],
      },
      {
        step: 4,
        title: "16ビートを再生してみよう！",
        description: "PLAYボタンを押して、ファンキーで洗練された16ビートのグルーヴを味わってみよう！BPMは96前後が心地よいよ！",
        actionType: "play",
      },
    ],
    suggestedTracks: [
      {
        title: "Superstition (迷信)",
        artist: "Stevie Wonder",
        youtubeUrl: "https://www.youtube.com/watch?v=ftdZ363MTmM",
        comment: "16ビートのファンクグルーヴを決定づけた歴史的名曲。細かいハイハットとシンコペーションの宝庫。",
      },
      {
        title: "24K Magic",
        artist: "Bruno Mars",
        youtubeUrl: "https://www.youtube.com/watch?v=UqyT8IEBkvY",
        comment: "80sファンク/R&Bを現代に蘇らせたキレ味鋭い16ビート。タイトなスネアとうねるベースラインが魅力。",
      },
      {
        title: "September",
        artist: "Earth, Wind & Fire",
        youtubeUrl: "https://www.youtube.com/watch?v=Gs069dndIYk",
        comment: "16分音符のグルーヴが心地よいディスコ/ファンクの定番。身体が自然と動き出すリズムです。",
      },
    ],
  },
};

/**
 * 現在のステップの打ち込み条件が満たされているかどうかを判定します
 */
export function isPatternStepComplete(
  stepConfig: PatternTutorialStep,
  pattern: Pattern,
  isPlaying: boolean
): boolean {
  if (stepConfig.actionType === "play") {
    return isPlaying;
  }

  if (stepConfig.actionType === "placeSteps") {
    if (!stepConfig.trackId || !stepConfig.targetSteps) {
      return true;
    }
    const trackPattern = pattern[stepConfig.trackId];
    if (!trackPattern) return false;

    // 指定されたすべてのステップが ON になっているか
    return stepConfig.targetSteps.every((stepIdx) => Boolean(trackPattern[stepIdx]));
  }

  return false;
}

/**
 * 現在のステップで新しく打ち込むべき未入力のステップ番号一覧を返します
 */
export function getRemainingTargetSteps(
  stepConfig: PatternTutorialStep,
  pattern: Pattern
): number[] {
  if (stepConfig.actionType !== "placeSteps" || !stepConfig.trackId || !stepConfig.targetSteps) {
    return [];
  }
  const trackPattern = pattern[stepConfig.trackId];
  if (!trackPattern) return [...stepConfig.targetSteps];

  return stepConfig.targetSteps.filter((stepIdx) => !trackPattern[stepIdx]);
}

/**
 * チュートリアル対象のステップかどうかを判定します（UIのゴーストハイライト用）
 */
export function isStepHighlightedInTutorial(
  stepConfig: PatternTutorialStep | null,
  trackId: TrackId,
  stepIndex: number
): boolean {
  if (!stepConfig || stepConfig.actionType !== "placeSteps") return false;
  if (stepConfig.trackId !== trackId) return false;
  return Boolean(stepConfig.targetSteps?.includes(stepIndex));
}
