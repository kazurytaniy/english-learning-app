import React, { useRef, useState } from 'react';

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
      a.download = `ela-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('エクスポート完了');
    } catch (e) {
      console.error(e);
      setStatus('エクスポート失敗');
    }
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await repo.importAll(data);
      setStatus('インポート完了（再読み込みしてください）');
    } catch (err) {
      console.error(err);
      setStatus('インポート失敗');
    } finally {
      e.target.value = '';
    }
  };

  const handleReset = async () => {
    if (!window.confirm('すべてのデータをリセットします。よろしいですか？')) return;
    await repo.resetAll();
    setStatus('データをリセットしました');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <div className="card" style={{ maxWidth: 480, width: '100%' }}>
        <h2 style={{ marginTop: 0 }}>データ管理</h2>
        <p>JSONでインポート/エクスポートできます。全データリセットも可能です。</p>
        <div className="row">
          <button className="md-btn" onClick={handleExport}>エクスポート</button>
          <button className="md-btn" onClick={handleImport}>インポート</button>
          <button className="md-btn danger" onClick={handleReset}>全データリセット</button>
        </div>
        <input
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={onFileChange}
        />
        {status && <div className="status">{status}</div>}
        <div style={{ marginTop: 12 }}>
          <button className="md-btn text" onClick={onBack}>戻る</button>
        </div>
      </div>
    </div>
  );
}
