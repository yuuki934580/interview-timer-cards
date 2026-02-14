'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { SessionLog } from '@/types';

export default function MemosPage() {
  const router = useRouter();
  const [memos, setMemos] = useState<SessionLog[]>([]);

  useEffect(() => {
    loadMemos();
  }, []);

  const loadMemos = () => {
    const sessions = storage.getSessions();
    // pinnedがtrueで、メモが空でないログのみ、新しい順
    const pinnedMemos = sessions
      .filter(s => s.pinned && s.memo && s.memo.trim())
      .reverse();
    setMemos(pinnedMemos);
  };

  const handleTogglePin = (sessionId: string) => {
    storage.togglePinSession(sessionId);
    loadMemos();
  };

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

  const formatTime = (sec: number): string => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4 flex justify-between items-center">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm"
          >
            ← ホーム
          </button>
          <h1 className="text-2xl font-bold text-yellow-600">メモ一覧</h1>
          <div className="w-20"></div>
        </div>

        {/* メモ一覧 */}
        <div className="space-y-4">
          {memos.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500 mb-2">
                保存されたメモはありません
              </p>
              <p className="text-sm text-gray-400">
                完了画面でメモの星ボタンを押すと、ここに保存されます
              </p>
            </div>
          ) : (
            memos.map((memo) => (
              <div key={memo.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500">
                        {formatDate(memo.startedAt)}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          memo.mode === 'random'
                            ? 'bg-blue-200 text-blue-800'
                            : 'bg-green-200 text-green-800'
                        }`}
                      >
                        {memo.mode === 'random' ? 'ランダム' : '本番'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {memo.deckName}
                      </span>
                    </div>
                    <div className="font-medium text-gray-800 mb-2">
                      {memo.questionText}
                    </div>
                    <div className="text-sm text-gray-600">
                      回答時間: {formatTime(memo.elapsedSeconds)}
                      {memo.isOvertime && (
                        <span className="ml-2 text-red-600 font-semibold">
                          (タイムオーバー)
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleTogglePin(memo.id)}
                    className="text-2xl transition-transform hover:scale-125"
                    title="保存解除"
                  >
                    ⭐
                  </button>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-3">
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {memo.memo}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
