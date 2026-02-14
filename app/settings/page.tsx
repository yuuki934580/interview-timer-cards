'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { AppSettings } from '@/types';

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>({
    preparationTimeEnabled: false,
    preparationSeconds: 5,
    realModeOrder: 'fixed',
    defaultSeconds: 60,
    recordingLimit: 20,
  });

  useEffect(() => {
    setSettings(storage.getSettings());
  }, []);

  const handleSave = () => {
    storage.saveSettings(settings);
    alert('設定を保存しました');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4 flex justify-between items-center">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm"
          >
            ← ホーム
          </button>
          <h1 className="text-2xl font-bold text-gray-800">設定</h1>
          <div className="w-20"></div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div className="border-b pb-4">
            <h2 className="font-semibold text-gray-800 mb-4">準備時間</h2>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.preparationTimeEnabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      preparationTimeEnabled: e.target.checked,
                    })
                  }
                  className="w-5 h-5"
                />
                <span className="text-gray-700">準備時間を設定する</span>
              </label>

              {settings.preparationTimeEnabled && (
                <div className="flex items-center space-x-3 ml-8">
                  <input
                    type="number"
                    value={settings.preparationSeconds}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        preparationSeconds: parseInt(e.target.value) || 5,
                      })
                    }
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className="w-20 px-3 py-2 border rounded text-gray-800 bg-white"
                  />
                  <span className="text-gray-700">秒</span>
                </div>
              )}
            </div>
          </div>

          <div className="border-b pb-4">
            <h2 className="font-semibold text-gray-800 mb-4">本番モード</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  質問の並び順
                </label>
                <select
                  value={settings.realModeOrder}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      realModeOrder: e.target.value as 'fixed' | 'shuffle',
                    })
                  }
                  className="w-full px-3 py-2 border rounded text-gray-800 bg-white"
                >
                  <option value="fixed">デッキの順番通り</option>
                  <option value="shuffle">シャッフル</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-b pb-4">
            <h2 className="font-semibold text-gray-800 mb-4">
              デフォルト設定
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  デフォルト回答時間（質問に秒数がない場合）
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    value={settings.defaultSeconds}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultSeconds: parseInt(e.target.value) || 60,
                      })
                    }
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className="w-24 px-3 py-2 border rounded text-gray-800 bg-white"
                  />
                  <span className="text-gray-700">秒</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b pb-4">
            <h2 className="font-semibold text-gray-800 mb-4">録音設定</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  録音の保存上限（容量節約のため）
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    value={settings.recordingLimit}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        recordingLimit: parseInt(e.target.value) || 20,
                      })
                    }
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className="w-24 px-3 py-2 border rounded text-gray-800 bg-white"
                  />
                  <span className="text-gray-700">件まで</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  上限を超えると古い録音から削除されます
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            設定を保存
          </button>
        </div>

        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">💡 ヒント</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• 準備時間: 質問を読んで考える時間を設定できます</li>
            <li>
              • 本番モードのシャッフル: 毎回ランダムな順番で練習できます
            </li>
            <li>• 録音機能: 自分の回答を後から聞いて改善できます</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
