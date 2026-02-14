export interface Question {
  id: string;
  text: string;
  recommendedSeconds: number;
  createdAt: string;
}

export interface Deck {
  id: string;
  name: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionLog {
  id: string;
  sessionId: string; // 追加: 同じ練習セッションをグループ化
  deckId: string;
  deckName: string;
  questionId: string;
  questionText: string;
  mode: 'random' | 'real';
  startedAt: string;
  endedAt: string;
  elapsedSeconds: number;
  recommendedSeconds: number;
  isOvertime: boolean;
  memo?: string;
  hasRecording: boolean;
  recordingData?: string; // base64
  pinned?: boolean; // 追加: ピン留め機能
}

export interface AppSettings {
  preparationTimeEnabled: boolean;
  preparationSeconds: number;
  realModeOrder: 'fixed' | 'shuffle';
  defaultSeconds: number;
  recordingLimit: number;
}

export interface AppStats {
  totalSessions: number;
  todaySessions: number;
  lastSessionDate: string;
}
