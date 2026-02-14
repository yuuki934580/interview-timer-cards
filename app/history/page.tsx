'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { SessionLog } from '@/types';

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionLog[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<SessionLog[]>([]);
  const [modeFilter, setModeFilter] = useState<'all' | 'random' | 'real'>('all');
  const [deckFilter, setDeckFilter] = useState<string>('all');
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  useEffect(() => {
    const loaded = storage.getSessions();
    setSessions(loaded.reverse());
    setFilteredSessions(loaded);
  }, []);

  useEffect(() => {
    let filtered = [...sessions];

    if (modeFilter !== 'all') {
      filtered = filtered.filter((s) => s.mode === modeFilter);
    }

    if (deckFilter !== 'all') {
      filtered = filtered.filter((s) => s.deckId === deckFilter);
    }

    setFilteredSessions(filtered);
  }, [modeFilter, deckFilter, sessions]);

  const getWeakQuestions = () => {
    const questionStats: {
      [key: string]: { text: string; overtimeCount: number; totalCount: number };
    } = {};

    sessions.forEach((session) => {
      if (!questionStats[session.questionId]) {
        questionStats[session.questionId] = {
          text: session.questionText,
          overtimeCount: 0,
          totalCount: 0,
        };
      }
      questionStats[session.questionId].totalCount++;
      if (session.isOvertime) {
        questionStats[session.questionId].overtimeCount++;
      }
    });

    return Object.values(questionStats)
      .sort((a, b) => b.overtimeCount - a.overtimeCount)
      .slice(0, 5);
  };

  const uniqueDecks = Array.from(
    new Set(sessions.map((s) => JSON.stringify({ id: s.deckId, name: s.deckName })))
  ).map((s) => JSON.parse(s));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const groupByDate = (sessions: SessionLog[]) => {
    const grouped: { [key: string]: SessionLog[] } = {};
    sessions.forEach((session) => {
      const date = new Date(session.startedAt).toLocaleDateString('ja-JP');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(session);
    });
    return grouped;
  };

  const groupedSessions = groupByDate(filteredSessions);
  const weakQuestions = getWeakQuestions();

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 flex justify-between items-center">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm"
          >
            ← ホーム
          </button>
          <h1 className="text-2xl font-bold text-orange-600">履歴</h1>
          <div className="w-20"></div>
        </div>

        {weakQuestions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              📊 苦手質問ランキング
            </h2>
            <div className="space-y-2">
              {weakQuestions.map((q, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-red-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-red-600">
                        #{index + 1}
                      </span>
                      <span className="text-gray-800">{q.text}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    タイムオーバー: {q.overtimeCount}/{q.totalCount}回
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            フィルター
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                モード
              </label>
              <select
                value={modeFilter}
                onChange={(e) =>
                  setModeFilter(e.target.value as 'all' | 'random' | 'real')
                }
                className="w-full px-3 py-2 border rounded text-gray-800 bg-white"
              >
                <option value="all">すべて</option>
                <option value="random">ランダムモード</option>
                <option value="real">本番モード</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                デッキ
              </label>
              <select
                value={deckFilter}
                onChange={(e) => setDeckFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded text-gray-800 bg-white"
              >
                <option value="all">すべて</option>
                {uniqueDecks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {Object.keys(groupedSessions).length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              まだ履歴がありません
            </div>
          ) : (
            Object.entries(groupedSessions).map(([date, daySessions]) => (
              <div key={date} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-800 mb-4">{date}</h3>
                <div className="space-y-3">
                  {daySessions.map((session) => (
                    <div
                      key={session.id}
                      className={`p-4 rounded-lg ${
                        session.isOvertime ? 'bg-red-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                session.mode === 'random'
                                  ? 'bg-blue-200 text-blue-800'
                                  : 'bg-green-200 text-green-800'
                              }`}
                            >
                              {session.mode === 'random'
                                ? 'ランダム'
                                : '本番'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {session.deckName}
                            </span>
                          </div>
                          <div className="text-gray-800 font-medium mb-1">
                            {session.questionText}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>
                              所要時間: {formatTime(session.elapsedSeconds)}
                            </span>
                            <span>
                              推奨: {formatTime(session.recommendedSeconds)}
                            </span>
                            {session.isOvertime && (
                              <span className="text-red-600 font-semibold">
                                ⏰ タイムオーバー
                              </span>
                            )}
                          </div>
                          {session.memo && (
                            <div className="mt-2 text-sm text-gray-700 bg-white p-2 rounded">
                              💭 {session.memo}
                            </div>
                          )}
                          {session.hasRecording && session.recordingData && (
                            <div className="mt-2">
                              <button
                                onClick={() =>
                                  setPlayingAudio(
                                    playingAudio === session.id
                                      ? null
                                      : session.id
                                  )
                                }
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {playingAudio === session.id
                                  ? '🔊 再生中...'
                                  : '🎤 録音を再生'}
                              </button>
                              {playingAudio === session.id && (
                                <audio
                                  controls
                                  autoPlay
                                  src={session.recordingData}
                                  className="w-full mt-2"
                                  onEnded={() => setPlayingAudio(null)}
                                />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 ml-4">
                          {formatDate(session.startedAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
