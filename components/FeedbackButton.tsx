'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const pathname = usePathname();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== フィードバック送信開始 ===');
    
    if (!message.trim()) {
      console.log('エラー: メッセージが空です');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('API /api/feedback にPOST中...');
      
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          email: email.trim() || null,
          page: pathname,
          user_agent: navigator.userAgent,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        console.error('❌ API送信エラー:', result);
        
        let errorMessage = 'フィードバックの送信に失敗しました。\n\n';
        errorMessage += `エラー: ${result.error}\n`;
        if (result.hint) {
          errorMessage += `ヒント: ${result.hint}\n`;
        }
        errorMessage += '\n管理者に連絡してください。';
        
        alert(errorMessage);
        return;
      }

      console.log('✅ フィードバック送信成功:', result);

      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setMessage('');
        setEmail('');
        setSubmitted(false);
      }, 2000);
    } catch (error: any) {
      console.error('❌ 送信失敗:', error);
      alert(`送信に失敗しました。\n\nエラー: ${error.message}\n\nコンソールで詳細を確認してください。`);
    } finally {
      setIsSubmitting(false);
      console.log('=== フィードバック送信終了 ===');
    }
  };

  return (
    <>
      {/* フィードバックボタン */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105 z-50"
        title="フィードバックを送る"
      >
        💬 フィードバック
      </button>

      {/* モーダル */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            {submitted ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-green-600 mb-2">
                  送信完了！
                </h3>
                <p className="text-gray-600">
                  貴重なご意見ありがとうございます
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      フィードバック
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      データはSupabaseに保存されます
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm text-gray-700 mb-2">
                      メッセージ <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full border rounded-lg p-3 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                      placeholder="改善要望、バグ報告、感想など何でもお気軽に..."
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm text-gray-700 mb-2">
                      メールアドレス（任意）
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                      placeholder="返信が必要な場合のみ"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !message.trim()}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? '送信中...' : '送信'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
