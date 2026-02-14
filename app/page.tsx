'use client';

import { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';
import { AppStats } from '@/types';
import Link from 'next/link';

export default function Home() {
  const [stats, setStats] = useState<AppStats>({
    totalSessions: 0,
    todaySessions: 0,
    lastSessionDate: '',
  });
  const [loginCount, setLoginCount] = useState(0);
  const [showLoginMessage, setShowLoginMessage] = useState(false);

  useEffect(() => {
    setStats(storage.getStats());
    
    // 連続ログインをチェック
    const loginData = storage.checkAndUpdateLoginStamp();
    setLoginCount(loginData.count);
    
    // 1日目以外または1日目でも連続ログイン中の場合、メッセージを表示
    const isFirstVisitToday = loginData.stamps.length === 1 && loginData.count === 1;
    if (!isFirstVisitToday || loginData.count > 1) {
      setShowLoginMessage(true);
      setTimeout(() => setShowLoginMessage(false), 3000);
    }
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            面接くん
          </h1>
          <p className="text-gray-600">面接練習をサポート</p>
        </div>

        {showLoginMessage && loginCount > 0 && (
          <div className="bg-orange-100 border-l-4 border-orange-500 p-4 mb-6 rounded animate-pulse">
            <p className="text-orange-800 font-semibold">
              🔥 {loginCount}日連続ログイン中！
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            練習記録
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {stats.todaySessions}
              </div>
              <div className="text-sm text-gray-600 mt-1">今日の練習</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats.totalSessions}
              </div>
              <div className="text-sm text-gray-600 mt-1">累計練習</div>
            </div>
          </div>
          
          {loginCount > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">連続ログイン</span>
                <span className="text-lg font-bold text-orange-600">
                  {loginCount}日
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Link
            href="/practice?mode=random"
            className="block bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-4 shadow-md transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">ランダムモード</div>
                <div className="text-sm opacity-90">
                  ランダムに1問ずつ練習
                </div>
              </div>
              <div className="text-2xl">🎲</div>
            </div>
          </Link>

          <Link
            href="/practice?mode=real"
            className="block bg-green-500 hover:bg-green-600 text-white rounded-lg p-4 shadow-md transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">本番モード</div>
                <div className="text-sm opacity-90">順番に全問練習</div>
              </div>
              <div className="text-2xl">📝</div>
            </div>
          </Link>

          <Link
            href="/decks"
            className="block bg-purple-500 hover:bg-purple-600 text-white rounded-lg p-4 shadow-md transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">質問管理</div>
                <div className="text-sm opacity-90">
                  デッキと質問の編集
                </div>
              </div>
              <div className="text-2xl">📚</div>
            </div>
          </Link>

          <Link
            href="/settings"
            className="block bg-gray-500 hover:bg-gray-600 text-white rounded-lg p-4 shadow-md transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">設定</div>
                <div className="text-sm opacity-90">アプリの設定変更</div>
              </div>
              <div className="text-2xl">⚙️</div>
            </div>
          </Link>

          <Link
            href="/memos"
            className="block bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg p-4 shadow-md transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">メモ一覧</div>
                <div className="text-sm opacity-90">振り返りメモを見返す</div>
              </div>
              <div className="text-2xl">📝</div>
            </div>
          </Link>

          <Link
            href="/history"
            className="block bg-orange-500 hover:bg-orange-600 text-white rounded-lg p-4 shadow-md transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">履歴</div>
                <div className="text-sm opacity-90">過去の練習記録</div>
              </div>
              <div className="text-2xl">📊</div>
            </div>
          </Link>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>ホーム画面に追加してアプリとして使えます</p>
        </div>
      </div>
    </main>
  );
}
