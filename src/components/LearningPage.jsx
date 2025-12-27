import React, { useState, useEffect } from 'react';
import { Check, X, RotateCcw, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { getTodayWords, calculateNextReview, addReviewHistory, updateStatus, shuffleArray } from '../utils/helpers';
import { LEARNING_MODES } from '../utils/constants';

const LearningPage = ({ words, mode, settings, onComplete, onUpdateWord, customWords = null }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [showAllMeanings, setShowAllMeanings] = useState(false);
  const [showIncorrectList, setShowIncorrectList] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [formatType, setFormatType] = useState('ai-friendly');
  const [studyWords, setStudyWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentWord = studyWords[currentIndex];
  const isComplete = studyWords.length > 0 && currentIndex >= studyWords.length;
  const incorrectWords = results.filter((r) => !r.correct);
  const correctCount = results.filter((r) => r.correct).length;

  const [currentMode, setCurrentMode] = useState(mode);
  const isReviewSession = !!(customWords && customWords.length > 0);

  // セッション初期化（選択カード数がそのまま問題数）
  useEffect(() => {
    setResults([]);
    setIsFlipped(false);
    setShowAllMeanings(false);
    setShowIncorrectList(false);
    setCopySuccess(false);
    setFormatType('ai-friendly');
    setStartTime(Date.now());
    setCurrentIndex(0);
    if (isReviewSession) {
      setStudyWords(shuffleArray(customWords));
    } else {
      setStudyWords(shuffleArray(getTodayWords(words)));
    }
  }, [mode, customWords, isReviewSession]);

  // ランダムモード用のモード決定
  useEffect(() => {
    if (currentWord && mode === LEARNING_MODES.RANDOM) {
      setCurrentMode(Math.random() > 0.5 ? LEARNING_MODES.EN_TO_JP : LEARNING_MODES.JP_TO_EN);
    } else {
      setCurrentMode(mode);
    }
  }, [currentIndex, currentWord, mode]);

  // 完了時に不正解リストを自動で開く
  useEffect(() => {
    if (isComplete && incorrectWords.length > 0) {
      setShowIncorrectList(true);
    }
  }, [isComplete, incorrectWords.length]);

  if (studyWords.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 text-center">
          <p className="text-gray-700">No words to study.</p>
        </div>
      </div>
    );
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleGrade = async (isCorrect) => {
    if (!currentWord) return;
    const responseTime = Date.now() - startTime;

    if (!isReviewSession) {
      const nextReview = calculateNextReview(currentWord, isCorrect, settings.intervals);
      const newHistory = addReviewHistory(currentWord, currentMode, isCorrect, responseTime);

      const updatedWord = {
        ...currentWord,
        reviewHistory: newHistory,
        nextReviewDate: nextReview.nextReviewDate,
        currentInterval: nextReview.currentInterval,
        correctCount: (currentWord.correctCount || 0) + (isCorrect ? 1 : 0),
        incorrectCount: (currentWord.incorrectCount || 0) + (isCorrect ? 0 : 1),
        lastReviewDate: new Date().toISOString().split('T')[0],
      };
      updatedWord.status = updateStatus(updatedWord);

      await onUpdateWord(currentWord.id, updatedWord);
    }

    setResults((prev) => [
      ...prev,
      {
        ...currentWord,
        correct: isCorrect,
        timestamp: new Date(),
        responseTime,
      },
    ]);
    setCurrentIndex((prev) => prev + 1);
    setIsFlipped(false);
    setShowAllMeanings(false);
    setStartTime(Date.now());
  };

  const handleReset = () => {
    onComplete(results, { isReviewSession });
  };

  const handleInterrupt = () => {
    if (window.confirm('Stop learning now? Results so far will be saved.')) {
      onComplete(results, { isReviewSession });
    }
  };

  const handleRetryIncorrect = () => {
    const retryWords = incorrectWords.map(({ correct, timestamp, responseTime, ...word }) => word);
    setStudyWords(shuffleArray(retryWords));
    setResults([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowAllMeanings(false);
    setShowIncorrectList(false);
    setStartTime(Date.now());
  };

  const formatIncorrectWords = (format) => {
    switch (format) {
      case 'simple':
        return incorrectWords
          .map((w) => `${w.english} / ${Array.isArray(w.japanese) ? w.primaryMeaning : w.japanese}`)
          .join('\n');
      case 'ai-friendly':
        return (
          `以下の英語表現を覚えるための効果的な学習方法を教えてください:\n\n` +
          incorrectWords
            .map((w, i) => {
              const meaning = Array.isArray(w.japanese) ? w.primaryMeaning : w.japanese;
              return `${i + 1}. ${w.english}\n   意味: ${meaning}`;
            })
            .join('\n\n')
        );
      case 'csv':
        return (
          'English,Japanese\n' +
          incorrectWords
            .map((w) => {
              const meaning = Array.isArray(w.japanese) ? w.primaryMeaning : w.japanese;
              return `${w.english},${meaning}`;
            })
            .join('\n')
        );
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
              <span className="text-green-600 font-semibold">✅ 正解: {correctCount}</span>
              <span className="text-red-600 font-semibold">❌ 不正解: {incorrectWords.length}</span>
            </div>
          </div>

          {incorrectWords.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowIncorrectList(!showIncorrectList)}
                className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {showIncorrectList ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                間違えた単語 ({incorrectWords.length}件)
              </button>

              {showIncorrectList && (
                <div className="mt-4 space-y-3">
                  <div className="space-y-1 text-sm text-gray-700">
                    {incorrectWords.map((w, i) => (
                      <div key={`${w.id}-${i}`}>
                        {i + 1}. {w.english} / {Array.isArray(w.japanese) ? w.primaryMeaning : w.japanese}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 text-sm flex-wrap">
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

          {incorrectWords.length > 0 && (
            <button
              onClick={handleRetryIncorrect}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mb-3"
            >
              間違えた単語だけ復習
            </button>
          )}

          <button
            onClick={handleReset}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw size={20} />
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  const isEnToJp = currentMode === LEARNING_MODES.EN_TO_JP;
  const question = isEnToJp ? currentWord.english : Array.isArray(currentWord.japanese) ? currentWord.primaryMeaning : currentWord.japanese;
  const answer = isEnToJp ? (Array.isArray(currentWord.japanese) ? currentWord.primaryMeaning : currentWord.japanese) : currentWord.english;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* ヘッダー */}
        <div className="bg-white rounded-t-2xl shadow-lg p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">
              {currentMode === LEARNING_MODES.EN_TO_JP ? '英→日' : '日→英'}
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {currentIndex + 1} / {studyWords.length}
              </span>
              <button
                onClick={handleInterrupt}
                className="text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded-full px-3 py-1 transition-colors"
              >
                Stop
              </button>
            </div>
          </div>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentIndex / studyWords.length) * 100}%` }}
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
                {isFlipped ? '答え' : 'タッチして確認'}
              </div>
              <div className="min-h-[200px] flex flex-col items-center justify-center">
                <p className="text-3xl font-bold text-gray-800 break-words mb-2">
                  {isFlipped ? answer : question}
                </p>

                {/* 複数訳がある場合 */}
                {isFlipped && isEnToJp && Array.isArray(currentWord.japanese) && currentWord.japanese.length > 1 && (
                  <div className="mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllMeanings(!showAllMeanings);
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      {showAllMeanings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      他の意味を見る ({currentWord.japanese.length - 1}件)
                    </button>

                    {showAllMeanings && (
                      <div className="mt-3 text-left bg-gray-50 rounded-lg p-3">
                        {currentWord.japanese.map((meaning, idx) => (
                          <div key={idx} className="text-sm text-gray-700 py-1">
                            {idx + 1}. {meaning}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-4">
                {currentWord.category === 'idiom' ? '慣用句' : currentWord.category === 'phrase' ? 'フレーズ' : '単語'}
              </div>
              {currentWord.category === 'phrase' && currentWord.tags?.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {currentWord.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

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

export default LearningPage;
