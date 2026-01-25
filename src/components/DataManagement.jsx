import React, { useRef, useState } from 'react';
import { formatDateJst } from '../utils/date';

export default function DataManagement({ repo, onBack }) {
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState('');

  const handleExport = async () => {
    try {
      const data = await repo.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ela-backup-${formatDateJst(new Date())}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('エクスポートが完了しました。');
    } catch (e) {
      console.error(e);
      setStatus('エクスポートに失敗しました。');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await repo.importAll(data);
      setStatus('インポートが完了しました。ページを再読み込みすると反映されます。');
    } catch (err) {
      console.error(err);
      setStatus('インポートに失敗しました。');
    } finally {
      e.target.value = '';
    }
  };

  const handleReset = async () => {
    if (!window.confirm('すべてのデータをリセットします。よろしいですか？')) return;
    await repo.resetAll();
    setStatus('全データをリセットしました。');
  };

  const handleCleanup = async () => {
    const attempts = await repo.listAttempts();
    const anomalies = attempts.filter((a) => (a.elapsedMs || 0) > 300000); // 5分以上を異常値とする
    if (anomalies.length === 0) {
      setStatus('異常な長時間データは見つかりませんでした。');
      return;
    }

    if (!window.confirm(`${anomalies.length}件の異常な長時間データ（5分以上）が見つかりました。これらを一律10秒に修正して、学習時間を正常化しますか？`)) {
      return;
    }

    let count = 0;
    for (const a of anomalies) {
      await repo.updateAttempt({ ...a, elapsedMs: 10000 }); // 10秒に補正
      count++;
    }
    setStatus(`${count}件の学習時間を修正しました。統計を再度ご確認ください。`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 word-page">
      <div className="form-card" style={{ maxWidth: 980, width: '100%', margin: '0 auto' }}>
        <h2 style={{ marginTop: 0 }}>データ管理</h2>
        <p className="muted">データのバックアップや、異常値の修正が行えます。</p>

        <div className="row" style={{ marginTop: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleExport}>エクスポート</button>
          <button className="btn btn-outline" onClick={handleImportClick}>インポート</button>
          <button className="btn btn-ghost" onClick={handleCleanup} style={{ color: '#0284c7', borderColor: '#0284c7' }}>学習時間の異常修正</button>
          <button className="btn btn-ghost" onClick={handleReset} style={{ color: '#dc2626' }}>全データリセット</button>
        </div>

        <input
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={onFileChange}
        />

        {status && <div className="status" style={{ marginTop: 12 }}>{status}</div>}

        <div style={{ marginTop: 12 }}>
          <button className="btn-back" onClick={onBack}>戻る</button>
        </div>
      </div>
    </div>
  );
}
