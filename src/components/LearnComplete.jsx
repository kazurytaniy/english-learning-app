import React, { useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function LearnComplete({ summary, onBack, onRetryWrong }) {
  const [copied, setCopied] = useState(false);
  const textSimple = useMemo(() => {
    return summary?.wrongItems?.map((w) => `${w.en} / ${w.ja || ''}`).join('\n') || '';
  }, [summary]);

  if (!summary) return null;

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(textSimple);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card" style={{ maxWidth: 560, width: '100%' }}>
        <h2 style={{ marginTop: 0, textAlign: 'center' }}>学習完了！</h2>
        <p style={{ textAlign: 'center' }}>正解: {summary.correct} / 不正解: {summary.wrong}</p>

        {summary.wrongItems?.length > 0 && (
          <div className="card" style={{ background: '#fef2f2', border: '1px solid #fecdd3' }}>
            <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="muted">間違えた単語 ({summary.wrongItems.length}件)</div>
              <button className="md-btn" onClick={copyText}>
                <Copy size={16} /> コピー
              </button>
            </div>
            <textarea readOnly value={textSimple} rows={6} style={{ width: '100%', marginTop: 8 }} />
            <button className="md-btn primary" onClick={onRetryWrong} style={{ marginTop: 8 }}>
              間違えたものだけ復習
            </button>
            {copied && <div className="status"><Check size={16} /> コピーしました</div>}
          </div>
        )}

        <div className="row" style={{ marginTop: 12 }}>
          <button className="md-btn primary" onClick={onBack}>ホームに戻る</button>
        </div>
      </div>
    </div>
  );
}
