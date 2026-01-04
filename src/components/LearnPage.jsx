import React, { useEffect, useState } from 'react';
import { Check, X, Mic } from 'lucide-react';

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
        <div className="form-card" style={{ textAlign: 'center', maxWidth: 980, width: '100%', margin: '0 auto' }}>
          <p>学習完了</p>
          <button className="btn btn-primary" onClick={onFinish}>完了画面へ</button>
          <div style={{ marginTop: 8 }}>
            <button className="btn-back" onClick={onAbort}>戻る</button>
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
      : '音声を聴いてください';
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
      <div className="form-card" style={{ maxWidth: 980, width: '100%', textAlign: 'center', margin: '0 auto' }}>
        <div className="muted" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className={`skill-badge ${current.skill === 'A' ? 'skill-badge-a' : current.skill === 'B' ? 'skill-badge-b' : 'skill-badge-c'}`}>
            {current.skill === 'A' ? '英→日' : current.skill === 'B' ? '日→英' : 'Listening'}
          </span>
          <span className="muted">{progressCurrent} / {progressTotal}</span>
        </div>
        <div
          className="word-card"
          style={{ background: '#f9fafb', marginTop: 12, marginBottom: 12, cursor: 'pointer' }}
          onClick={() => setShowAnswer(!showAnswer)}
        >
          <div className="muted" style={{ marginBottom: 6 }}>{showAnswer ? '答え' : 'タップして確認'}</div>

          {showAnswer && isListening ? (
            <div style={{ margin: '8px 0' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#1f2937' }}>{current.item.en}</h2>
              <div style={{ fontSize: '1.2rem', color: '#4b5563' }}>{jaText}</div>
            </div>
          ) : (
            <h2 style={{ margin: '8px 0' }}>{showAnswer ? answer : (isListening ? '音声を聴いてください' : question)}</h2>
          )}

          {isListening && (
            <div style={{ marginTop: 10 }}>
              <button className="md-btn filled" onClick={(e) => { e.stopPropagation(); playAudio(); }}>
                <Mic size={16} style={{ marginRight: 6 }} />
                再生
              </button>
            </div>
          )}
          {!isListening && <div className="muted">{jaText ? '単語・フレーズ' : ''}</div>}
        </div>
        {showAnswer && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'nowrap',
              width: '100%',
            }}
          >
            <button
              onClick={() => handleGrade(true)}
              className="md-btn"
              style={{ background: '#22c55e', color: '#fff', flex: 1, minWidth: '45%' }}
            >
              <Check size={16} style={{ marginRight: 6 }} />
              正解
            </button>
            <button
              onClick={() => handleGrade(false)}
              className="md-btn danger"
              style={{ flex: 1, minWidth: '45%' }}
            >
              <X size={16} style={{ marginRight: 6 }} />
              不正解
            </button>
          </div>
        )}

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <button
            className="btn"
            style={{
              fontSize: 14,
              color: '#ffffff',
              background: '#424242',
              border: '1px solid #000000',
              fontWeight: 600,
              padding: '10px 24px',
              borderRadius: '10px'
            }}
            onClick={() => {
              if (window.confirm('学習を終了して結果を確認しますか？\n（ここまでのデータは保存されます）')) {
                onFinish();
              }
            }}
          >
            学習を中断して終了
          </button>
        </div>
      </div>
    </div>
  );
}
