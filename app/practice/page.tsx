'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { storage } from '@/lib/storage';
import { Deck, Question, SessionLog, AppSettings } from '@/types';

function PracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') as 'random' | 'real' || 'random';

  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isPreparation, setIsPreparation] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [memo, setMemo] = useState('');
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingEnabled, setRecordingEnabled] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  
  // 問題数設定用のstate
  const [showQuestionCountSelector, setShowQuestionCountSelector] = useState(false);
  const [selectedCount, setSelectedCount] = useState(10);
  const [totalQuestions, setTotalQuestions] = useState(0);
  
  // 練習時間計測用
  const [practiceStartTime, setPracticeStartTime] = useState<Date | null>(null);
  const [totalPracticeTime, setTotalPracticeTime] = useState(0);
  
  // セッション管理
  const [sessionId, setSessionId] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const practiceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadedDecks = storage.getDecks();
    const loadedSettings = storage.getSettings();
    setDecks(loadedDecks);
    setSettings(loadedSettings);

    if (loadedDecks.length > 0) {
      setSelectedDeck(loadedDecks[0]);
    }
  }, []);

  useEffect(() => {
    if (selectedDeck) {
      // 両モード共通で問題数選択画面を表示
      setShowQuestionCountSelector(true);
      // デフォルトの問題数を設定
      setSelectedCount(Math.min(10, selectedDeck.questions.length));
    }
  }, [selectedDeck, mode, settings]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]);

  // 練習時間の計測
  useEffect(() => {
    if (practiceStartTime) {
      practiceIntervalRef.current = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - practiceStartTime.getTime()) / 1000);
        setTotalPracticeTime(diff);
      }, 1000);
    } else {
      if (practiceIntervalRef.current) {
        clearInterval(practiceIntervalRef.current);
      }
    }
    return () => {
      if (practiceIntervalRef.current) {
        clearInterval(practiceIntervalRef.current);
      }
    };
  }, [practiceStartTime]);

  // ショートカットキー
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 入力欄にフォーカス中は無効化
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        return;
      }

      // Enterキー: 保存して次へ
      if (e.key === 'Enter' && isFinished) {
        e.preventDefault();
        handleSave();
      }

      // Spaceキー: 録音トグル（問題数選択画面でのみ有効）
      if (e.key === ' ' && showQuestionCountSelector) {
        e.preventDefault();
        setRecordingEnabled(!recordingEnabled);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFinished, recordingEnabled, showQuestionCountSelector]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const handlePracticeStart = async () => {
    if (!selectedDeck || !selectedCount) return;
    
    const maxCount = selectedDeck.questions.length;
    const actualCount = Math.min(selectedCount, maxCount);
    
    let qs = [...selectedDeck.questions];
    
    if (mode === 'random') {
      // ランダムモード: シャッフルしてから先頭X件
      qs = shuffleArray(qs);
    } else {
      // 本番モード: 既存設定に従って並べる
      if (settings?.realModeOrder === 'shuffle') {
        qs = shuffleArray(qs);
      }
    }
    
    // 先頭X件を取得
    const selected = qs.slice(0, actualCount);
    
    setQuestions(selected);
    setTotalQuestions(actualCount);
    setQuestionIndex(0);
    setCurrentQuestion(selected[0]);
    setShowQuestionCountSelector(false);
    
    // 練習開始時間を記録
    setPracticeStartTime(new Date());
    
    // セッションIDを生成
    const newSessionId = `session-${Date.now()}-${Math.random()}`;
    setSessionId(newSessionId);
    
    // 録音が有効な場合、セッション全体の録音を開始
    if (recordingEnabled) {
      await startRecording();
    }
    
    // localStorageに保存
    storage.savePracticeSession({
      mode,
      deckId: selectedDeck.id,
      questionCount: actualCount,
      startTime: new Date().toISOString(),
    });
  };

  const handleStart = async () => {
    if (isPreparation || isRunning) return;

    startTimeRef.current = new Date().toISOString();
    
    // 最初の問題開始時に練習時間計測を開始
    if (!practiceStartTime) {
      setPracticeStartTime(new Date());
    }

    if (settings?.preparationTimeEnabled) {
      setIsPreparation(true);
      setSeconds(settings.preparationSeconds);
      setIsRunning(true);
      
      const prepInterval = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(prepInterval);
            setIsPreparation(false);
            setSeconds(0);
            startMainTimer();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      startMainTimer();
    }
  };

  const startMainTimer = async () => {
    setIsRunning(true);
    setSeconds(0);
    // 録音はセッション開始時に既に開始されているのでここでは何もしない
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
      alert('録音を開始できませんでした。マイクの許可を確認してください。');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleEnd = () => {
    setIsRunning(false);
    setIsFinished(true);
    stopRecording();
    
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
  };

  const handleSave = async () => {
    if (!currentQuestion || !selectedDeck) return;

    // 最後の問題の場合、録音を停止
    const isLastQuestion = questionIndex >= questions.length - 1;
    if (isLastQuestion && recordingEnabled && isRecording) {
      stopRecording();
      // 録音停止後、少し待ってからデータを取得
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    let recordingData: string | undefined = undefined;
    if (audioBlob) {
      const reader = new FileReader();
      recordingData = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(audioBlob);
      });
    }

    const recommendedSeconds = currentQuestion.recommendedSeconds || settings?.defaultSeconds || 60;
    const isOvertime = seconds > recommendedSeconds;

    const session: SessionLog = {
      id: `${Date.now()}-${Math.random()}`,
      sessionId, // セッションIDを追加
      deckId: selectedDeck.id,
      deckName: selectedDeck.name,
      questionId: currentQuestion.id,
      questionText: currentQuestion.text,
      mode,
      startedAt: startTimeRef.current,
      endedAt: new Date().toISOString(),
      elapsedSeconds: seconds,
      recommendedSeconds,
      isOvertime,
      memo: memo.trim() || undefined,
      hasRecording: isLastQuestion && !!audioBlob, // 最後の問題のみ録音データを保持
      recordingData: isLastQuestion ? recordingData : undefined,
    };

    storage.saveSession(session);

    // 次の質問へ
    if (questionIndex < questions.length - 1) {
      handleNext();
    } else {
      // 全問題終了 - 完了画面を表示
      setIsCompleted(true);
    }
  };

  const handleNext = () => {
    setIsRunning(false);
    setIsPaused(false);
    setIsFinished(false);
    setSeconds(0);
    setMemo('');
    setAudioBlob(null);
    setAudioURL(null);
    setIsRecording(false);

    const nextIndex = questionIndex + 1;
    if (nextIndex < questions.length) {
      setQuestionIndex(nextIndex);
      setCurrentQuestion(questions[nextIndex]);
    }
  };

  const formatTime = (sec: number): string => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRetry = () => {
    // 同じ設定でもう一回
    setIsCompleted(false);
    setQuestionIndex(0);
    setIsRunning(false);
    setIsPaused(false);
    setIsFinished(false);
    setSeconds(0);
    setMemo('');
    setAudioBlob(null);
    setAudioURL(null);
    setIsRecording(false);
    
    // 新しいセッションIDを生成
    const newSessionId = `session-${Date.now()}-${Math.random()}`;
    setSessionId(newSessionId);
    
    // 同じ設定で問題を再生成
    if (selectedDeck) {
      let qs = [...selectedDeck.questions];
      
      if (mode === 'random') {
        qs = shuffleArray(qs);
      } else {
        if (settings?.realModeOrder === 'shuffle') {
          qs = shuffleArray(qs);
        }
      }
      
      const selected = qs.slice(0, totalQuestions);
      setQuestions(selected);
      setCurrentQuestion(selected[0]);
    }
    
    // 練習時間をリセット
    setPracticeStartTime(new Date());
    setTotalPracticeTime(0);
  };

  // 完了画面
  if (isCompleted) {
    const sessionLogs = storage.getSessions().filter(log => log.sessionId === sessionId);
    
    const handleTogglePin = (logId: string) => {
      storage.togglePinSession(logId);
      // 再レンダリングのため強制更新
      setIsCompleted(false);
      setTimeout(() => setIsCompleted(true), 0);
    };
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-6 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-green-600 mb-4">
                お疲れさまでした！
              </h1>
              <div className="bg-green-50 rounded-lg p-4 inline-block">
                <div className="text-sm text-gray-600 mb-1">今回の練習時間</div>
                <div className="text-4xl font-bold text-green-600">
                  {formatTime(totalPracticeTime)}
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                振り返りメモ一覧
              </h2>
              
              {sessionLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  記録がありません
                </p>
              ) : (
                <div className="space-y-4">
                  {sessionLogs.map((log, index) => (
                    <div key={log.id} className="bg-gray-50 rounded-lg p-4 relative">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="text-sm text-gray-500 mb-1">
                            問題 {index + 1}
                          </div>
                          <div className="font-medium text-gray-800 mb-2">
                            {log.questionText}
                          </div>
                          <div className="text-sm text-gray-600">
                            回答時間: {formatTime(log.elapsedSeconds)} 
                            {log.isOvertime && (
                              <span className="ml-2 text-red-600 font-semibold">
                                (タイムオーバー)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {log.memo && (
                        <div className="mt-3 p-3 bg-white rounded border-l-4 border-blue-500">
                          <div className="flex items-start justify-between mb-1">
                            <div className="text-xs text-gray-500">メモ</div>
                            {/* 星ボタンをメモラベルと同じ行に配置 */}
                            <button
                              onClick={() => handleTogglePin(log.id)}
                              className="text-2xl transition-transform hover:scale-110 -mt-1"
                              style={{
                                filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))',
                                WebkitTextStroke: '1px black',
                                color: log.pinned ? '#FCD34D' : 'white'
                              }}
                              title={log.pinned ? 'メモ一覧から削除' : 'メモ一覧に保存'}
                            >
                              ★
                            </button>
                          </div>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap">
                            {log.memo}
                          </div>
                        </div>
                      )}
                      
                      {log.hasRecording && log.recordingData && (
                        <div className="mt-3">
                          <div className="text-xs text-gray-500 mb-1">録音</div>
                          <audio controls src={log.recordingData} className="w-full" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleRetry}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 rounded-lg transition-colors"
            >
              もう一回
            </button>
            <button
              onClick={() => router.push('/memos')}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-4 rounded-lg transition-colors"
            >
              ⭐ メモ一覧
            </button>
            <button
              onClick={() => router.push('/')}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-4 rounded-lg transition-colors"
            >
              ホームへ戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 問題数選択画面
  if (showQuestionCountSelector && selectedDeck) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm"
            >
              ← 戻る
            </button>
          </div>

          {/* デッキ選択 */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              デッキを選択
            </h2>
            <select
              value={selectedDeck.id}
              onChange={(e) => {
                const deck = decks.find((d) => d.id === e.target.value);
                if (deck) {
                  setSelectedDeck(deck);
                  setSelectedCount(Math.min(selectedCount, deck.questions.length));
                }
              }}
              className="w-full px-4 py-3 border rounded-lg text-gray-800 bg-white text-lg"
            >
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name}
                </option>
              ))}
            </select>
          </div>

          {/* 問題数選択 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              問題数を選択
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setSelectedCount(5)}
                className={`font-semibold py-3 rounded-lg transition-colors ${
                  selectedCount === 5
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                5問
              </button>
              <button
                onClick={() => setSelectedCount(10)}
                className={`font-semibold py-3 rounded-lg transition-colors ${
                  selectedCount === 10
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                10問
              </button>
              <button
                onClick={() => setSelectedCount(20)}
                className={`font-semibold py-3 rounded-lg transition-colors ${
                  selectedCount === 20
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                20問
              </button>
              <button
                onClick={() => setSelectedCount(selectedDeck.questions.length)}
                className={`font-semibold py-3 rounded-lg transition-colors ${
                  selectedCount === selectedDeck.questions.length
                    ? 'bg-green-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                全問 ({selectedDeck.questions.length})
              </button>
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm text-gray-700 mb-2">
                カスタム（任意の数）
              </label>
              <input
                type="number"
                value={selectedCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setSelectedCount(Math.max(1, Math.min(val, selectedDeck.questions.length)));
                }}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                min="1"
                max={selectedDeck.questions.length}
                className="w-full px-3 py-2 border rounded-lg text-gray-800 bg-white"
              />
              <p className="text-xs text-gray-500 mt-2">
                1〜{selectedDeck.questions.length}問の範囲で指定できます
              </p>
            </div>
          </div>

          {/* 開始前の情報表示 */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
            <p className="text-blue-800 font-semibold">
              {mode === 'random' ? 'ランダムモード' : '本番モード'} 問題数 {selectedCount}問
            </p>
          </div>

          {/* 録音チェックボックス */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={recordingEnabled}
                onChange={(e) => setRecordingEnabled(e.target.checked)}
                className="w-5 h-5"
              />
              <span className="text-gray-700 font-medium">
                セッション全体を録音する
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-2 ml-8">
              チェックONで開始すると、全問題を通して1本の録音を行います
            </p>
          </div>

          {/* 開始ボタン */}
          <button
            onClick={handlePracticeStart}
            disabled={!selectedDeck || !selectedCount}
            className={`w-full font-bold py-4 rounded-lg transition-colors text-lg ${
              selectedDeck && selectedCount
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            開始
          </button>
        </div>
      </div>
    );
  }

  if (!selectedDeck || !currentQuestion || !settings) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <select
              className="px-4 py-2 border rounded-lg text-gray-800 bg-white"
              onChange={(e) => {
                const deck = decks.find((d) => d.id === e.target.value);
                if (deck) setSelectedDeck(deck);
              }}
            >
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name}
                </option>
              ))}
            </select>
          </div>
          {selectedDeck && (
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg"
            >
              戻る
            </button>
          )}
        </div>
      </div>
    );
  }

  const recommendedSeconds = currentQuestion.recommendedSeconds || settings.defaultSeconds;
  const isOvertime = seconds > recommendedSeconds;
  const remainingQuestions = totalQuestions - questionIndex;

  return (
    <div className={`min-h-screen p-6 transition-colors ${
      isOvertime && isRunning ? 'bg-red-100' : 'bg-gradient-to-b from-blue-50 to-white'
    }`}>
      <div className="max-w-md mx-auto">
        <div className="mb-4 flex justify-between items-center">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm"
          >
            ← 戻る
          </button>
          <div className="text-sm font-semibold text-gray-700">
            {mode === 'random' ? 'ランダムモード' : '本番モード'}
          </div>
        </div>

        {/* 練習時間表示 */}
        {practiceStartTime && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">練習時間</span>
              <span className="text-lg font-bold text-blue-600">
                {formatTime(totalPracticeTime)}
              </span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="text-center mb-6">
            <div className="text-sm text-gray-500 mb-2">
              {isPreparation ? '準備時間' : '回答時間'}
            </div>
            <div className={`text-6xl font-bold ${
              isOvertime && !isPreparation ? 'text-red-600' : 'text-blue-600'
            }`}>
              {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              推奨: {Math.floor(recommendedSeconds / 60)}:{(recommendedSeconds % 60).toString().padStart(2, '0')}
            </div>
            
            {/* 進捗表示 */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm text-gray-600">
                <span>問題 {questionIndex + 1} / {totalQuestions}</span>
                <span>残り: あと{remainingQuestions}問</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 mb-6 min-h-32 flex items-center justify-center">
            <p className="text-xl text-center text-gray-800 font-medium">
              {currentQuestion.text}
            </p>
          </div>

          {isRecording && (
            <div className="mb-4 text-center text-red-600 font-semibold">
              🔴 録音中...
            </div>
          )}

          <div className="space-y-3">
            {!isRunning && !isFinished && (
              <button
                onClick={handleStart}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-lg transition-colors"
              >
                開始
              </button>
            )}

            {isRunning && !isPreparation && (
              <>
                <button
                  onClick={handlePause}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-4 rounded-lg transition-colors"
                >
                  {isPaused ? '再開' : '一時停止'}
                </button>
                <button
                  onClick={handleEnd}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-4 rounded-lg transition-colors"
                >
                  終了
                </button>
              </>
            )}

            {isFinished && (
              <>
                {audioURL && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-700 mb-2">録音を再生:</div>
                    <audio controls src={audioURL} className="w-full" />
                  </div>
                )}
                
                <div className="mb-4">
                  <label className="block text-sm text-gray-700 mb-2">
                    振り返りメモ（任意）
                  </label>
                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="w-full border rounded-lg p-3 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                    placeholder="気づいたことや改善点をメモ..."
                    disabled={false}
                    readOnly={false}
                  />
                </div>

                {/* スペーサー（stickyボタン用） */}
                <div className="h-20"></div>
              </>
            )}
          </div>
        </div>

        {/* Stickyボタン */}
        {isFinished && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
            <div className="max-w-md mx-auto">
              <button
                onClick={handleSave}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 rounded-lg transition-colors"
              >
                保存して次へ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    }>
      <PracticeContent />
    </Suspense>
  );
}
