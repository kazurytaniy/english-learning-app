import React, { useState } from 'react';
import { Copy, Check, X, RotateCcw, List } from 'lucide-react';

// サンプルデータ
const sampleWords = [
  { id: 1, english: 'take a rain check', japanese: 'また今度にする', category: 'idiom' },
  { id: 2, english: 'break the ice', japanese: '打ち解ける、緊張をほぐす', category: 'idiom' },
  { id: 3, english: 'procrastinate', japanese: '先延ばしにする', category: 'word' },
  { id: 4, english: 'piece of cake', japanese: '朝飯前、簡単なこと', category: 'idiom' },
  { id: 5, english: 'beat around the bush', japanese: '遠回しに言う', category: 'idiom' },
];

const EnglishLearningApp = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState([]);
  const [showIncorrectList, setShowIncorrectList] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [formatType, setFormatType] = useState('ai-friendly');

  const currentWord = sampleWords[currentIndex];
  const isComplete = currentIndex >= sampleWords.length;
  const incorrectWords = results.filter(r => !r.correct);
  const correctCount = results.filter(r => r.correct).length;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleGrade = (isCorrect) => {
    setResults([...results, { 
      ...currentWord, 
      correct: isCorrect,
      timestamp: new Date()
    }]);
    setCurrentIndex(currentIndex + 1);
    setIsFlipped(false);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setResults([]);
    setIsFlipped(false);
    setShowIncorrectList(false);
  };

  const formatIncorrectWords = (format) => {
    switch(format) {
      case 'simple':
        return incorrectWords.map(w => `${w.english} / ${w.japanese}`).join('\n');
      
      case 'ai-friendly':
        return `以下の英語表現を覚えるための効果的な学習方法を教えてください:\n\n` +
          incorrectWords.map((w, i) => 
            `${i + 1}. ${w.english}\n   意味: ${w.japanese}`
          ).join('\n\n');
      
      case 'csv':
        return 'English,Japanese\n' +
          incorrectWords.map(w => `${w.english},${w.japanese}`).join('\n');
      
      default:
        return '';
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formatIncorrectWords(formatType));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // 完了画面
  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">学習完了! 🎉</h2>
            <div className="flex justify-center gap-4 text-lg">
              <span className="text-green-600 font-semibold">正解: {correctCount}</span>
              <span className="text-red-600 font-semibold">不正解: {incorrectWords.length}</span>
            </div>
          </div>

          {incorrectWords.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowIncorrectList(!showIncorrectList)}
                className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <List size={20} />
                間違えた単語 ({incorrectWords.length}件)
              </button>

              {showIncorrectList && (
                <div className="mt-4 space-y-3">
                  <div className="flex gap-2 text-sm">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="format"
                        value="simple"
                        checked={formatType === 'simple'}
                        onChange={(e) => setFormatType(e.target.value)}
                        className="cursor-pointer"
                      />
                      <span>シンプル</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="format"
                        value="ai-friendly"
                        checked={formatType === 'ai-friendly'}
                        onChange={(e) => setFormatType(e.target.value)}
                        className="cursor-pointer"
                      />
                      <span>AI用</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="format"
                        value="csv"
                        checked={formatType === 'csv'}
                        onChange={(e) => setFormatType(e.target.value)}
                        className="cursor-pointer"
                      />
                      <span>CSV</span>
                    </label>
                  </div>

                  <textarea
                    value={formatIncorrectWords(formatType)}
                    readOnly
                    className="w-full h-48 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                  />

                  <button
                    onClick={copyToClipboard}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {copySuccess ? (
                      <>
                        <Check size={20} />
                        コピーしました!
                      </>
                    ) : (
                      <>
                        <Copy size={20} />
                        クリップボードにコピー
                      </>
                    )}
                  </button>

                  <div className="text-xs text-gray-500 text-center">
                    💡 コピーしたテキストをClaude.aiやChatGPTに貼り付けて学習方法を聞いてみましょう
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleReset}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw size={20} />
            もう一度学習する
          </button>
        </div>
      </div>
    );
  }

  // 学習画面
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* ヘッダー */}
        <div className="bg-white rounded-t-2xl shadow-lg p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">📚 English Cards</h1>
            <div className="text-sm text-gray-600">
              {currentIndex + 1} / {sampleWords.length}
            </div>
          </div>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex) / sampleWords.length) * 100}%` }}
            />
          </div>
        </div>

        {/* カード */}
        <div className="bg-white shadow-xl p-8 mb-4">
          <div 
            onClick={handleFlip}
            className="cursor-pointer select-none"
          >
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">
                {isFlipped ? '日本語訳' : 'タップして確認'}
              </div>
              <div className="min-h-[200px] flex items-center justify-center">
                <p className="text-3xl font-bold text-gray-800 break-words">
                  {isFlipped ? currentWord.japanese : currentWord.english}
                </p>
              </div>
              <div className="text-xs text-gray-400 mt-4">
                {currentWord.category === 'idiom' ? '慣用句' : '単語'}
              </div>
            </div>
          </div>
        </div>

        {/* 採点ボタン */}
        {isFlipped && (
          <div className="bg-white rounded-b-2xl shadow-lg p-4">
            <div className="text-center text-sm text-gray-600 mb-3">
              自己採点してください
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleGrade(true)}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg"
              >
                <Check size={24} />
                正解
              </button>
              <button
                onClick={() => handleGrade(false)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg"
              >
                <X size={24} />
                不正解
              </button>
            </div>
          </div>
        )}

        {/* 進捗情報 */}
        {results.length > 0 && (
          <div className="mt-4 bg-white rounded-lg shadow p-3 text-sm text-gray-600 flex justify-between">
            <span>✅ 正解: {correctCount}</span>
            <span>❌ 不正解: {results.length - correctCount}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnglishLearningApp;
