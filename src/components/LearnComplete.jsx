import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function LearnComplete({ summary, onBack, onRetryWrong, onRetireItems }) {
  const [copied, setCopied] = useState(false);
  const [retired, setRetired] = useState(false);
  const [selectedRetireIds, setSelectedRetireIds] = useState(new Set());
  const textSimple = useMemo(() => {
    if (!summary?.wrongAnswers || summary.wrongAnswers.length === 0) {
      return '';
    }

    const groups = {
      A: { label: '英→日', items: [], advice: 'これらの英文は英語を日本語に訳す問題集で不正解であった英文です。勉強する為のアドバイスを一つずつ教えて下さい。もし量が多い場合は複数に分けて一つ一つ丁寧にアドレスしてください。' },
      B: { label: '日→英', items: [], advice: 'これらの英文は日本語を英語に訳す問題集で不正解であった英文です。正しく英文を作れるようになるための勉強のアドバイスを一つずつ教えて下さい。もし量が多い場合は複数に分けて一つ一つ丁寧にアドレスしてください。' },
      C: { label: 'Listening', items: [], advice: 'これらの英文は音声を聞き取るリスニング問題で不正解であった英文です。聞き取れるようになるための勉強のアドバイスや聞き取りのポイントを一つずつ教えて下さい。もし量が多い場合は複数に分けて一つ一つ丁寧にアドレスしてください。' },
    };

    summary.wrongAnswers.forEach((wa) => {
      const skill = wa.skill || 'A';
      if (groups[skill]) {
        groups[skill].items.push(`${wa.item.en} / ${wa.item.ja || ''}`);
      }
    });

    const sections = [];
    ['A', 'B', 'C'].forEach((s) => {
      const g = groups[s];
      if (g.items.length > 0) {
        sections.push(`【${g.label}】\n${g.items.join('\n')}\n\n${g.advice}`);
      }
    });

    return sections.join('\n\n' + '='.repeat(20) + '\n\n');
  }, [summary]);

  useEffect(() => {
    setSelectedRetireIds(new Set((summary?.retirementCandidates || []).map((item) => item.id)));
    setRetired(false);
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

  const handleRetire = async () => {
    const candidates = summary?.retirementCandidates || [];
    const selected = candidates.filter((item) => selectedRetireIds.has(item.id));
    if (selected.length === 0 || !onRetireItems) return;
    if (!window.confirm(`${selected.length}件の単語を学習終了にしますか？\n学習終了中の単語は通常学習に出ず、180日後に再開確認されます。`)) return;
    await onRetireItems(selected);
    setRetired(true);
  };

  const toggleRetireCandidate = (itemId) => {
    setSelectedRetireIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const selectAllRetireCandidates = () => {
    setSelectedRetireIds(new Set((summary?.retirementCandidates || []).map((item) => item.id)));
  };

  const clearRetireCandidates = () => {
    setSelectedRetireIds(new Set());
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 word-page">
      <div className="form-card" style={{ maxWidth: 980, width: '100%', margin: '0 auto' }}>
        <h2 style={{ marginTop: 0, textAlign: 'center' }}>学習完了</h2>
        <p style={{ textAlign: 'center' }}>正解: {summary.correct} / 不正解: {summary.wrong}</p>

        {summary.retirementCandidates?.length > 0 && !retired && (
          <div className="word-card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: 12 }}>
            <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
              <div className="muted">学習終了できる単語 ({selectedRetireIds.size} / {summary.retirementCandidates.length}件)</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="md-btn" onClick={selectAllRetireCandidates}>全選択</button>
                <button className="md-btn" onClick={clearRetireCandidates}>解除</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflow: 'auto' }}>
              {summary.retirementCandidates.map((item) => (
                <label key={item.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 10, fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={selectedRetireIds.has(item.id)}
                    onChange={() => toggleRetireCandidate(item.id)}
                  />
                  <strong style={{ wordBreak: 'break-word' }}>{item.en}</strong>
                  <span className="muted" style={{ wordBreak: 'break-word' }}>{item.ja || ''}</span>
                </label>
              ))}
            </div>
            <button className="md-btn primary" onClick={handleRetire} disabled={selectedRetireIds.size === 0} style={{ marginTop: 10 }}>
              学習を終了する
            </button>
          </div>
        )}

        {retired && (
          <div className="status" style={{ marginBottom: 12 }}>
            <Check size={16} /> 学習終了にしました
          </div>
        )}

        {summary.wrongItems?.length > 0 && (
          <div className="word-card" style={{ background: '#fef2f2', border: '1px solid #fecdd3' }}>
            <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="muted">間違えた単語 ({summary.wrongItems.length}件)</div>
              <button className="md-btn" onClick={copyText}>
                <Copy size={16} /> コピー
              </button>
            </div>
            <textarea readOnly value={textSimple} rows={6} className="form-input" style={{ marginTop: 8 }} />
            <button className="md-btn primary" onClick={onRetryWrong} style={{ marginTop: 8 }}>
              間違えたものだけ復習
            </button>
            {copied && <div className="status"><Check size={16} /> コピーしました</div>}
          </div>
        )}

        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn-back" onClick={onBack}>戻る</button>
        </div>
      </div>
    </div>
  );
}
