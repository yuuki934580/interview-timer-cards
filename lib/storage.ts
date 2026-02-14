import {
  Deck,
  SessionLog,
  AppSettings,
  AppStats,
  Question,
} from '@/types';

const KEYS = {
  DECKS: 'interview_decks',
  SESSIONS: 'interview_sessions',
  SETTINGS: 'interview_settings',
  STATS: 'interview_stats',
  LOGIN_STAMPS: 'login_stamps',
  PRACTICE_SESSIONS: 'practice_sessions',
};

// デフォルトデッキ
const DEFAULT_DECK: Deck = {
  id: 'default',
  name: 'よくある面接質問',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  questions: [
    { id: '1', text: '自己紹介をお願いします', recommendedSeconds: 60, createdAt: new Date().toISOString() },
    { id: '2', text: '志望動機を教えてください', recommendedSeconds: 90, createdAt: new Date().toISOString() },
    { id: '3', text: 'なぜ当社を選んだのですか', recommendedSeconds: 60, createdAt: new Date().toISOString() },
    { id: '4', text: 'あなたの強みは何ですか', recommendedSeconds: 60, createdAt: new Date().toISOString() },
    { id: '5', text: 'あなたの弱みは何ですか', recommendedSeconds: 60, createdAt: new Date().toISOString() },
    { id: '6', text: '学生時代に最も力を入れたことは何ですか', recommendedSeconds: 90, createdAt: new Date().toISOString() },
    { id: '7', text: '入社後にやりたいことは何ですか', recommendedSeconds: 90, createdAt: new Date().toISOString() },
    { id: '8', text: '5年後、10年後のキャリアビジョンを教えてください', recommendedSeconds: 90, createdAt: new Date().toISOString() },
    { id: '9', text: '最近気になるニュースはありますか', recommendedSeconds: 60, createdAt: new Date().toISOString() },
    { id: '10', text: 'チームで働いた経験について教えてください', recommendedSeconds: 90, createdAt: new Date().toISOString() },
    { id: '11', text: '失敗した経験とそこから学んだことを教えてください', recommendedSeconds: 90, createdAt: new Date().toISOString() },
    { id: '12', text: 'リーダーシップを発揮した経験はありますか', recommendedSeconds: 90, createdAt: new Date().toISOString() },
    { id: '13', text: '困難を乗り越えた経験を教えてください', recommendedSeconds: 90, createdAt: new Date().toISOString() },
    { id: '14', text: 'あなたにとって仕事とは何ですか', recommendedSeconds: 60, createdAt: new Date().toISOString() },
    { id: '15', text: '当社の事業内容について知っていることを教えてください', recommendedSeconds: 60, createdAt: new Date().toISOString() },
    { id: '16', text: '他社の選考状況を教えてください', recommendedSeconds: 60, createdAt: new Date().toISOString() },
    { id: '17', text: '希望する配属先や職種はありますか', recommendedSeconds: 60, createdAt: new Date().toISOString() },
    { id: '18', text: '転勤は可能ですか', recommendedSeconds: 30, createdAt: new Date().toISOString() },
    { id: '19', text: '残業についてどう考えますか', recommendedSeconds: 60, createdAt: new Date().toISOString() },
    { id: '20', text: '尊敬する人物はいますか', recommendedSeconds: 60, createdAt: new Date().toISOString() },
    { id: '21', text: '趣味や特技について教えてください', recommendedSeconds: 60, createdAt: new Date().toISOString() },
    { id: '22', text: '最後に質問はありますか', recommendedSeconds: 60, createdAt: new Date().toISOString() },
    { id: '23', text: 'ストレス解消法は何ですか', recommendedSeconds: 60, createdAt: new Date().toISOString() },
    { id: '24', text: '周りからどんな人だと言われますか', recommendedSeconds: 60, createdAt: new Date().toISOString() },
    { id: '25', text: '大学で学んだことをどう活かしますか', recommendedSeconds: 90, createdAt: new Date().toISOString() },
    { id: '26', text: '当社で実現したいことは何ですか', recommendedSeconds: 90, createdAt: new Date().toISOString() },
    { id: '27', text: 'あなたを採用するメリットは何ですか', recommendedSeconds: 90, createdAt: new Date().toISOString() },
    { id: '28', text: '最近読んだ本について教えてください', recommendedSeconds: 60, createdAt: new Date().toISOString() },
    { id: '29', text: '自分を一言で表すと何ですか', recommendedSeconds: 60, createdAt: new Date().toISOString() },
    { id: '30', text: '当社に入社したら何をしたいですか', recommendedSeconds: 90, createdAt: new Date().toISOString() },
  ],
};

const DEFAULT_SETTINGS: AppSettings = {
  preparationTimeEnabled: false,
  preparationSeconds: 5,
  realModeOrder: 'fixed',
  defaultSeconds: 60,
  recordingLimit: 20,
};

const DEFAULT_STATS: AppStats = {
  totalSessions: 0,
  todaySessions: 0,
  lastSessionDate: '',
};

// Storage helpers
export const storage = {
  // Decks
  getDecks(): Deck[] {
    if (typeof window === 'undefined') return [DEFAULT_DECK];
    const data = localStorage.getItem(KEYS.DECKS);
    if (!data) {
      const decks = [DEFAULT_DECK];
      localStorage.setItem(KEYS.DECKS, JSON.stringify(decks));
      return decks;
    }
    return JSON.parse(data);
  },

  saveDeck(deck: Deck): void {
    const decks = this.getDecks();
    const index = decks.findIndex((d) => d.id === deck.id);
    if (index >= 0) {
      decks[index] = { ...deck, updatedAt: new Date().toISOString() };
    } else {
      decks.push(deck);
    }
    localStorage.setItem(KEYS.DECKS, JSON.stringify(decks));
  },

  deleteDeck(deckId: string): void {
    const decks = this.getDecks().filter((d) => d.id !== deckId);
    localStorage.setItem(KEYS.DECKS, JSON.stringify(decks));
  },

  // Sessions
  getSessions(): SessionLog[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(KEYS.SESSIONS);
    return data ? JSON.parse(data) : [];
  },

  saveSession(session: SessionLog): void {
    const sessions = this.getSessions();
    sessions.push(session);
    
    // 録音データの上限管理
    const settings = this.getSettings();
    const recordingSessions = sessions.filter(s => s.hasRecording);
    if (recordingSessions.length > settings.recordingLimit) {
      const toRemove = recordingSessions.length - settings.recordingLimit;
      for (let i = 0; i < toRemove; i++) {
        recordingSessions[i].recordingData = undefined;
        recordingSessions[i].hasRecording = false;
      }
    }
    
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
    this.updateStats();
  },

  // Settings
  getSettings(): AppSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    const data = localStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  },

  saveSettings(settings: AppSettings): void {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Stats
  getStats(): AppStats {
    if (typeof window === 'undefined') return DEFAULT_STATS;
    const data = localStorage.getItem(KEYS.STATS);
    return data ? JSON.parse(data) : DEFAULT_STATS;
  },

  updateStats(): void {
    const sessions = this.getSessions();
    const today = new Date().toLocaleDateString('ja-JP');
    const todaySessions = sessions.filter(
      (s) => new Date(s.startedAt).toLocaleDateString('ja-JP') === today
    );

    const stats: AppStats = {
      totalSessions: sessions.length,
      todaySessions: todaySessions.length,
      lastSessionDate: sessions.length > 0 ? sessions[sessions.length - 1].startedAt : '',
    };

    localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
  },

  // 連続ログイン機能
  getLoginStamps(): string[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(KEYS.LOGIN_STAMPS);
    return data ? JSON.parse(data) : [];
  },

  checkAndUpdateLoginStamp(): { count: number; stamps: string[] } {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const stamps = this.getLoginStamps();
    
    // 今日の日付が既に配列にあればスキップ
    if (stamps.includes(today)) {
      return { count: this.getConsecutiveLoginCount(stamps), stamps };
    }

    // 昨日の日付を取得
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // 昨日のスタンプがない場合はリセット
    if (stamps.length > 0 && !stamps.includes(yesterdayStr)) {
      const newStamps = [today];
      localStorage.setItem(KEYS.LOGIN_STAMPS, JSON.stringify(newStamps));
      return { count: 1, stamps: newStamps };
    }

    // 今日の日付を追加
    stamps.push(today);
    localStorage.setItem(KEYS.LOGIN_STAMPS, JSON.stringify(stamps));
    
    return { count: this.getConsecutiveLoginCount(stamps), stamps };
  },

  getConsecutiveLoginCount(stamps: string[]): number {
    if (stamps.length === 0) return 0;

    // 日付を降順にソート
    const sorted = [...stamps].sort().reverse();
    let count = 1;
    
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = new Date(sorted[i]);
      const next = new Date(sorted[i + 1]);
      const diffDays = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        count++;
      } else {
        break;
      }
    }
    
    return count;
  },

  // 練習セッション保存（問題数と開始時間）
  savePracticeSession(session: {
    mode: string;
    deckId: string;
    questionCount: number;
    startTime: string;
  }): void {
    const sessions = this.getPracticeSessions();
    sessions.push(session);
    localStorage.setItem(KEYS.PRACTICE_SESSIONS, JSON.stringify(sessions));
  },

  getPracticeSessions(): Array<{
    mode: string;
    deckId: string;
    questionCount: number;
    startTime: string;
  }> {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(KEYS.PRACTICE_SESSIONS);
    return data ? JSON.parse(data) : [];
  },

  // ピン留めトグル
  togglePinSession(sessionId: string): void {
    const sessions = this.getSessions();
    const updated = sessions.map(s => 
      s.id === sessionId ? { ...s, pinned: !s.pinned } : s
    );
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify(updated));
  },
};
