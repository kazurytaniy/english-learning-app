import React from 'react';

export default function FreeReview({ onBack }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <div className="card" style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <h2 style={{ marginTop: 0 }}>自由復習</h2>
        <p>フィルター/選択は今後実装（統計には影響しません）</p>
        <button className="md-btn text" onClick={onBack}>戻る</button>
      </div>
    </div>
  );
}
