'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { Deck, Question } from '@/types';

export default function DecksPage() {
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [isEditingDeck, setIsEditingDeck] = useState(false);
  const [deckName, setDeckName] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [questionSeconds, setQuestionSeconds] = useState(60);

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = () => {
    const loaded = storage.getDecks();
    setDecks(loaded);
    if (loaded.length > 0 && !selectedDeck) {
      setSelectedDeck(loaded[0]);
    }
  };

  const handleCreateDeck = () => {
    const newDeck: Deck = {
      id: `deck-${Date.now()}`,
      name: deckName || '新しいデッキ',
      questions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.saveDeck(newDeck);
    setDeckName('');
    setIsEditingDeck(false);
    loadDecks();
    setSelectedDeck(newDeck);
  };

  const handleDeleteDeck = (deckId: string) => {
    if (deckId === 'default') {
      alert('デフォルトデッキは削除できません');
      return;
    }
    if (confirm('このデッキを削除しますか?')) {
      storage.deleteDeck(deckId);
      loadDecks();
      setSelectedDeck(null);
    }
  };

  const handleAddQuestion = () => {
    if (!selectedDeck || !questionText.trim()) return;

    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      text: questionText.trim(),
      recommendedSeconds: questionSeconds,
      createdAt: new Date().toISOString(),
    };

    const updatedDeck = {
      ...selectedDeck,
      questions: [...selectedDeck.questions, newQuestion],
    };

    storage.saveDeck(updatedDeck);
    setQuestionText('');
    setQuestionSeconds(60);
    loadDecks();
    setSelectedDeck(updatedDeck);
  };

  const handleUpdateQuestion = () => {
    if (!selectedDeck || !editingQuestion || !questionText.trim()) return;

    const updatedQuestions = selectedDeck.questions.map((q) =>
      q.id === editingQuestion.id
        ? { ...q, text: questionText.trim(), recommendedSeconds: questionSeconds }
        : q
    );

    const updatedDeck = {
      ...selectedDeck,
      questions: updatedQuestions,
    };

    storage.saveDeck(updatedDeck);
    setEditingQuestion(null);
    setQuestionText('');
    setQuestionSeconds(60);
    loadDecks();
    setSelectedDeck(updatedDeck);
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!selectedDeck) return;
    if (confirm('この質問を削除しますか?')) {
      const updatedDeck = {
        ...selectedDeck,
        questions: selectedDeck.questions.filter((q) => q.id !== questionId),
      };
      storage.saveDeck(updatedDeck);
      loadDecks();
      setSelectedDeck(updatedDeck);
    }
  };

  const handleExportCSV = () => {
    if (!selectedDeck) return;
    const csv = [
      '質問,推奨秒数',
      ...selectedDeck.questions.map(
        (q) => `"${q.text}",${q.recommendedSeconds}`
      ),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDeck.name}.csv`;
    a.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDeck) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').slice(1);
      const newQuestions: Question[] = lines
        .filter((line) => line.trim())
        .map((line) => {
          const [text, seconds] = line.split(',');
          return {
            id: `q-${Date.now()}-${Math.random()}`,
            text: text.replace(/^"(.*)"$/, '$1'),
            recommendedSeconds: parseInt(seconds) || 60,
            createdAt: new Date().toISOString(),
          };
        });

      const updatedDeck = {
        ...selectedDeck,
        questions: [...selectedDeck.questions, ...newQuestions],
      };

      storage.saveDeck(updatedDeck);
      loadDecks();
      setSelectedDeck(updatedDeck);
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 flex justify-between items-center">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm"
          >
            ← ホーム
          </button>
          <h1 className="text-2xl font-bold text-purple-600">質問管理</h1>
          <div className="w-20"></div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-gray-800">デッキ一覧</h2>
                <button
                  onClick={() => setIsEditingDeck(true)}
                  className="text-purple-600 text-2xl"
                >
                  +
                </button>
              </div>

              {isEditingDeck && (
                <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                  <input
                    type="text"
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    placeholder="デッキ名"
                    className="w-full mb-2 px-3 py-2 border rounded text-gray-800 bg-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateDeck}
                      className="flex-1 bg-purple-500 text-white py-1 rounded text-sm"
                    >
                      作成
                    </button>
                    <button
                      onClick={() => setIsEditingDeck(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-1 rounded text-sm"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {decks.map((deck) => (
                  <div
                    key={deck.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedDeck?.id === deck.id
                        ? 'bg-purple-100 border-2 border-purple-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedDeck(deck)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-800">
                          {deck.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {deck.questions.length}問
                        </div>
                      </div>
                      {deck.id !== 'default' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDeck(deck.id);
                          }}
                          className="text-red-500 text-sm"
                        >
                          削除
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            {selectedDeck ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {selectedDeck.name}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportCSV}
                      className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                    >
                      CSV出力
                    </button>
                    <label className="px-3 py-1 bg-blue-500 text-white rounded text-sm cursor-pointer">
                      CSV取込
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleImportCSV}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold mb-3 text-gray-800">
                    {editingQuestion ? '質問を編集' : '質問を追加'}
                  </h3>
                  <input
                    type="text"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="質問文を入力"
                    className="w-full mb-2 px-3 py-2 border rounded text-gray-800 bg-white"
                  />
                  <div className="flex gap-2 mb-2">
                    <input
                      type="number"
                      value={questionSeconds}
                      onChange={(e) =>
                        setQuestionSeconds(parseInt(e.target.value) || 60)
                      }
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className="w-24 px-3 py-2 border rounded text-gray-800 bg-white"
                    />
                    <span className="flex items-center text-gray-600">秒</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={
                        editingQuestion ? handleUpdateQuestion : handleAddQuestion
                      }
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded"
                    >
                      {editingQuestion ? '更新' : '追加'}
                    </button>
                    {editingQuestion && (
                      <button
                        onClick={() => {
                          setEditingQuestion(null);
                          setQuestionText('');
                          setQuestionSeconds(60);
                        }}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 rounded"
                      >
                        キャンセル
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedDeck.questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-sm text-gray-500 mb-1">
                            質問 {index + 1}
                          </div>
                          <div className="text-gray-800 mb-2">
                            {question.text}
                          </div>
                          <div className="text-sm text-gray-600">
                            推奨時間: {question.recommendedSeconds}秒
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => {
                              setEditingQuestion(question);
                              setQuestionText(question.text);
                              setQuestionSeconds(question.recommendedSeconds);
                            }}
                            className="text-blue-600 text-sm"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="text-red-600 text-sm"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                デッキを選択してください
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
