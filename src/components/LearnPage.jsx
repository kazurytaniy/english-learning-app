import React, { useEffect, useState } from 'react';
import { Check, X, Volume2 } from 'lucide-react';

const getJaText = (item) => {
  if (!item) return '';
  if (Array.isArray(item.ja)) return item.ja.join(' / ');
  return item.ja || '';
};

export default function LearnPage({
  queue,
  sessionId,
  answeredCount = 0,
  totalCount = 0,
  onAnswer,
  onFinish,
  onAbort,
}) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const current = queue[0];

  useEffect(() => {
    setShowAnswer(false);
    setStartTime(Date.now());
  }, [sessionId]);

  if (!current) {
    return (
      <div className="min-h-screen flex items-center justify-center word-page">
        <div className="form-card" style={{ textAlign: 'center', maxWidth: 520, width: '100%' }}>
          <p>学習完了</p>
          <button className="btn btn-primary" onClick={onFinish}>完了画面へ</button>
          <div style={{ marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={onAbort}>ホームに戻る</button>
          </div>
        </div>
      </div>
    );
  }

  const jaText = getJaText(current.item);
  const isListening = current.skill === 'C';
  const question = current.skill === 'A'
    ? current.item.en
    : current.skill === 'B'
      ? (jaText || current.item.en)
      : '音声を再生してください';
  const answer = current.skill === 'A'
    ? (jaText || current.item.en)
    : current.skill === 'B'
      ? current.item.en
      : (jaText || current.item.en);

  const handleGrade = async (isCorrect) => {
    const elapsedMs = Date.now() - startTime;
    await onAnswer(current.item, current.skill, isCorrect, elapsedMs);
    setShowAnswer(false);
    setStartTime(Date.now());
  };

  const playAudio = () => {
    if (!current?.item?.en) return;
    if (!('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(current.item.en);
    utter.lang = 'en-US';
    synth.speak(utter);
  };

  const progressTotal = totalCount || (answeredCount + queue.length);
  const progressCurrent = Math.min(answeredCount + 1, progressTotal);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 word-page">
      <div className="form-card" style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
        <div className="muted" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{current.skill === 'A' ? '英→日' : current.skill === 'B' ? '日→英' : 'Listening'}</span>
          <span className="muted">{progressCurrent} / {progressTotal}</span>
        </div>
        <div
          className="word-card"
          style={{ background: '#f9fafb', marginTop: 12, marginBottom: 12, cursor: 'pointer' }}
          onClick={() => setShowAnswer(!showAnswer)}
        >
          <div className="muted" style={{ marginBottom: 6 }}>{showAnswer ? '答え' : 'タップして確認'}</div>
          <h2 style={{ margin: '8px 0' }}>{showAnswer ? answer : question}</h2>
          {isListening && (
            <div style={{ marginTop: 10 }}>
              <button className="md-btn filled" onClick={(e) => { e.stopPropagation(); playAudio(); }}>
                <Volume2 size={16} style={{ marginRight: 6 }} />
                音声を再生
              </button>
            </div>
          )}
          <div className="muted">{jaText ? '単語/フレーズ' : ''}</div>
        </div>
        {showAnswer && (
          <div className="row" style={{ justifyContent: 'center' }}>
            <button onClick={() => handleGrade(true)} className="md-btn primary">
              <Check size={16} style={{ marginRight: 6 }} />
              正解
            </button>
            <button onClick={() => handleGrade(false)} className="md-btn danger">
              <X size={16} style={{ marginRight: 6 }} />
              不正解
            </button>
          </div>
        )}
        <div className="mt-4">
          <button className="btn btn-ghost" onClick={onAbort}>中断して戻る</button>
        </div>
      </div>
    </div>
  );
}
