'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Feedback {
  id: string;
  message: string;
  email: string | null;
  page: string | null;
  user_agent: string | null;
  created_at: string;
}

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        loadFeedbacks();
      } else {
        setError('パスワードが正しくありません');
      }
    } catch (err) {
      setError('ログインに失敗しました');
    }
  };

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/feedbacks');
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data);
      }
    } catch (err) {
      console.error('Error loading feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            管理画面ログイン
          </h1>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-2">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                required
                autoFocus
              />
            </div>
            {error && (
              <div className="mb-4 text-red-600 text-sm">{error}</div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              ログイン
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            フィードバック一覧
          </h1>
          <div className="flex gap-3">
            <button
              onClick={loadFeedbacks}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              更新
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              ホームへ
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">読み込み中...</div>
        ) : feedbacks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            フィードバックはまだありません
          </div>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <div key={feedback.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-2">
                      {formatDate(feedback.created_at)}
                    </div>
                    {feedback.page && (
                      <div className="text-xs text-gray-400 mb-2">
                        ページ: {feedback.page}
                      </div>
                    )}
                  </div>
                  {feedback.email && (
                    <a
                      href={`mailto:${feedback.email}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {feedback.email}
                    </a>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-3">
                  <div className="text-gray-800 whitespace-pre-wrap">
                    {feedback.message}
                  </div>
                </div>

                {feedback.user_agent && (
                  <div className="text-xs text-gray-400 border-t pt-2">
                    {feedback.user_agent}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
