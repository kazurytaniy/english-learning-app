import React, { useMemo, useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from 'recharts';
import { STATUS_LEVELS } from '../utils/constants';
import { formatDateJst } from '../utils/date';

// ステータスカラー定義（既存の定義と合わせる）
const STATUS_COLORS = {
    'まだまだ': '#9e9e9e',
    '聞ける': '#ffc107',
    '話せる': '#4caf50',
    '書ける': '#2196f3',
    'マスター': '#ffd700',
};

// ユーティリティ
const formatDate = (date, mode) => {
    const d = new Date(date);
    if (mode === 'day') return `${d.getMonth() + 1}/${d.getDate()}`;
    if (mode === 'week') {
        // 週の始まり（日曜日）
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 月曜始まりにするなら調整
        const startOfWeek = new Date(d.setDate(d.getDate() - d.getDay()));
        return `${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()}週`;
    }
    if (mode === 'month') return `${d.getFullYear()}/${d.getMonth() + 1}`;
    return formatDateJst(d);
};

const aggregateData = (attempts, mode) => {
    // 日付でグループ化して集計
    // mode: 'day' | 'week' | 'month'
    // attempts: { ts: number, result: boolean, elapsedMs: number }[]

    const groups = {};

    // 期間設定（過去分のみ）
    // day: 30日, week: 12週, month: 12ヶ月 くらいをデフォルト表示とする
    const now = new Date();

    const sortedAttempts = [...attempts].sort((a, b) => a.ts - b.ts);

    for (const att of sortedAttempts) {
        const d = new Date(att.ts);
        let key;

        if (mode === 'day') {
            key = formatDateJst(d);
        } else if (mode === 'week') {
            // 週の開始日（日曜日）をキーにする
            const startOfWeek = new Date(d);
            startOfWeek.setDate(d.getDate() - d.getDay());
            key = formatDateJst(startOfWeek);
        } else if (mode === 'month') {
            // 月の1日をキーにする
            const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
            key = formatDateJst(startOfMonth);
        }

        if (!groups[key]) {
            groups[key] = { date: key, count: 0, correct: 0, time: 0 };
        }
        groups[key].count++;
        if (att.result) groups[key].correct++;
        groups[key].time += (att.elapsedMs || 0);
    }

    // 配列に変換してソート
    const result = Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));

    // 表示用にフォーマット
    return result.map(item => ({
        ...item,
        label: formatDate(item.date, mode),
    }));
};

// 履歴からその時点でのステータス分布を推測するのは難しい（履歴にはステータス変化が記録されていないため）。
// 代わりに、現在のスナップショットを表示するか、
// あるいは「その日に学習してステータスが上がった回数」などを集計することは可能だが、
// ユーザーの要望は「まだまだ、書けるなどのステータスが増えていく様」なので、積み上げ棒グラフで
// 「現在そのステータスにある単語数」の推移を見たい可能性が高い。
// しかし、過去の時点での各単語のステータスを復元するには完全な操作ログが必要。
// 今回のストレージ構造（最新の状態 + 回答履歴）では「過去のある時点での全単語のステータス分布」を正確に再現するのは困難。
// 代替案として、「学習回数（アクティビティ）」をステータス遷移（レベルアップ）とみなして表示するか、
// あるいはシンプルに「日々の回答数積み上げ」を表示した上で、
// 下部に「現在のステータス分布」を表示するのが現実的。

// **要望への対応策**:
// 「ステータスが増えていく様」を見せるために擬似的なアプローチをとります。
// 履歴データだけでは厳密な過去のステータス分布は出せないので、
// 今回は「日々の学習量（回答数）」を棒グラフ（正解・不正解、あるいはスキル別）で出しつつ、
// 「現在のステータス分布」を円グラフで出す構成にします。
// もし「時系列でのステータス変化」を強く要望される場合は、今後は毎日スナップショットを保存するバッチ処理的なものが必要になります。
// 現状のデータ構造でできるベストとして、「活動履歴グラフ」をフィルター付きで提供します。

export default function StatsPage({ repo, onBack }) {
    const [attempts, setAttempts] = useState([]);
    const [currentProgress, setCurrentProgress] = useState([]);
    const [mode, setMode] = useState('day'); // day, week, month
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const [atts, progressList] = await Promise.all([
                repo.listAttempts(),
                repo.listProgress(),
            ]);
            setAttempts(atts);
            setCurrentProgress(progressList);
            setLoading(false);
        };
        load();
    }, [repo]);

    // 1. 活動量グラフデータ（棒グラフ）
    const activityData = useMemo(() => {
        return aggregateData(attempts, mode);
    }, [attempts, mode]);

    // 2. 現在のステータス分布データ（円グラフ）
    const statusDistData = useMemo(() => {
        const counts = {};
        STATUS_LEVELS.forEach(s => counts[s] = 0);
        // 未学習（progressがない）はカウントされないため、progressListにあるものだけで集計
        // 本来は全アイテム数との差分で「未着手」を出すべきだが、ここではprogressベース

        // progressは item_id x skill の組み合わせ。
        // 単語ごとのステータス（代表値）を集計するか、スキルごとの総数で見るか。
        // ここでは、各単語の「status」プロパティ（アイテム自体に保存されている）を使うのが適切だが、
        // listProgressの結果にはそれは含まれない。
        // 簡易的に、全進捗データの分布を見る（スキルごと）。
        // 正確には items の status を見るべきだが、今回は progressList から集計する（より詳細なデータがあるため）
        // ...いや、WordListなどで見ている `item.status` の分布が見たいはず。

        // 今回は listProgress しか取っていないので、item自体の取得を追加するか、
        // あるいは `attempts` を使ったグラフに注力する。
        // UIのロードで `listItems` も呼ぶように修正しよう。
        return [];
    }, [currentProgress]);

    // 補正: アイテム自体のステータス分布を取得するために useEffect 内で items もロードする方針に変更
    const [items, setItems] = useState([]);
    useEffect(() => {
        const loadItems = async () => {
            const allItems = await repo.listItems();
            setItems(allItems);
        };
        loadItems();
    }, [repo]);

    const currentStatusData = useMemo(() => {
        const counts = {};
        STATUS_LEVELS.forEach(s => counts[s] = 0);
        items.forEach(item => {
            const s = item.status || 'まだまだ';
            if (counts[s] !== undefined) counts[s]++;
            else counts['まだまだ']++; // fallback
        });

        return Object.keys(counts).map(key => {
            const colorDef = STATUS_COLORS[key] || '#9e9e9e'; // fallback
            let color = colorDef;
            if (typeof colorDef === 'object' && colorDef.bg) {
                // If the definition is an object (like in index.css logic using classes, but here we need hex)
                // Actually constants.js defines it. Let's assume we need to access robustly.
                // The error `includes` undefined suggests STATUS_COLORS[key].bg might be accessed where STATUS_COLORS[key] is undefined or doesn't have bg property as expected in string context.
                // Wait, previously I saw `STATUS_COLORS[key].bg.includes`
                // If STATUS_COLORS values are just strings in some contexts, or objects in others.
                // Let's look at constants.js content if possible, but safely:
                color = colorDef.bg || '#9e9e9e';
            } else if (typeof colorDef === 'string') {
                color = colorDef;
            }

            // If color is a gradient string, pick a solid color
            if (color.includes('gradient')) {
                return { name: key, value: counts[key], color: '#ffd700' };
            }
            return { name: key, value: counts[key], color: color };
        });
    }, [items]);

    // 3. 累積学習回数（ラインチャート）
    const cumulativeData = useMemo(() => {
        let sum = 0;
        return activityData.map(d => {
            sum += d.count;
            return { ...d, cumulative: sum };
        });
    }, [activityData]);

    const totalStatusCount = useMemo(() => currentStatusData.reduce((acc, cur) => acc + cur.value, 0), [currentStatusData]);

    const renderBarTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const correctData = payload.find(p => p.dataKey === 'correct');
            const countData = payload.find(p => p.dataKey === 'count');
            const correct = correctData ? correctData.value : 0;
            const count = countData ? countData.value : 0;
            const accuracy = count > 0 ? Math.round((correct / count) * 100) : 0;

            return (
                <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: '#374151', fontSize: '14px' }}>{label}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ color: '#4caf50', fontSize: '13px', fontWeight: 600 }}>
                            正解 : {correct}
                        </div>
                        <div style={{ color: '#4b5563', fontSize: '13px', fontWeight: 600 }}>
                            総数 : {count}
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #f3f4f6' }}>
                            正解率 : {accuracy}%
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const renderPieTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            const percent = totalStatusCount > 0 ? Math.round((data.value / totalStatusCount) * 100) : 0;
            return (
                <div style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <div style={{ width: 8, height: 8, backgroundColor: data.payload.color, borderRadius: '50%' }}></div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{data.name}</span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#4b5563' }}>
                        {data.value} 単語
                        <span style={{ marginLeft: '8px', color: '#6b7280', fontSize: '12px' }}>
                            ({percent}%)
                        </span>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="card">データを集計中...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center gap-4 px-4 py-6 word-page">
            <style>{`
        .stats-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          margin-bottom: 24px;
        }
        .stats-card {
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          width: 100%;
          margin-bottom: 16px;
        }
        .chart-title {
          font-size: 16px;
          font-weight: 700;
          color: #374151;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .filter-tabs {
          display: flex;
          background: #f3f4f6;
          padding: 4px;
          border-radius: 10px;
          gap: 4px;
        }
        .filter-tab {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.2s;
        }
        .filter-tab.active {
          background: #fff;
          color: #4f46e5;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .stat-box {
          background: #fff;
          padding: 16px;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          text-align: center;
        }
        .stat-val {
          font-size: 24px;
          font-weight: 800;
          color: #111827;
        }
        .stat-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 600;
          margin-top: 4px;
        }
       `}</style>

            <div style={{ maxWidth: 980, width: '100%', margin: '0 auto' }}>
                <div className="stats-header">
                    <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>統計・進捗</h2>
                    <button className="btn-back" onClick={onBack}>戻る</button>
                </div>

                <div className="stat-grid">
                    <div className="stat-box">
                        <div className="stat-val">{items.length}</div>
                        <div className="stat-label">登録単語数</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-val">{attempts.length}</div>
                        <div className="stat-label">総学習回数</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-val">
                            {Math.round(attempts.reduce((acc, cur) => acc + (cur.elapsedMs || 0), 0) / 1000 / 60)}
                        </div>
                        <div className="stat-label">総学習時間(分)</div>
                    </div>
                </div>

                <div className="stats-card">
                    <div className="chart-title">
                        <span>学習量の推移</span>
                        <div className="filter-tabs">
                            <div className={`filter-tab ${mode === 'day' ? 'active' : ''}`} onClick={() => setMode('day')}>日</div>
                            <div className={`filter-tab ${mode === 'week' ? 'active' : ''}`} onClick={() => setMode('week')}>週</div>
                            <div className={`filter-tab ${mode === 'month' ? 'active' : ''}`} onClick={() => setMode('month')}>月</div>
                        </div>
                    </div>

                    <div style={{ height: 300, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                <Tooltip content={renderBarTooltip} cursor={{ fill: '#f9fafb' }} />
                                <Legend />
                                <Bar dataKey="correct" name="正解" stackId="a" fill="#4caf50" radius={[0, 0, 4, 4]} />
                                <Bar dataKey="count" name="総数 " stackId="a" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="muted" style={{ textAlign: 'center', marginTop: 12, fontSize: 12 }}>
                        ※ 積み上げ棒グラフ： 緑色が正解数、グレーを含めた全体が学習総数です。
                    </div>
                </div>

                <div className="row">
                    <div className="stats-card" style={{ flex: 1 }}>
                        <div className="chart-title">現在のステータス分布</div>
                        <div style={{ height: 300, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={currentStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {currentStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={renderPieTooltip} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="stats-card" style={{ flex: 1 }}>
                        <div className="chart-title">累積学習回数（成長曲線）</div>
                        <div style={{ height: 300, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={cumulativeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="cumulative" name="累積回数" stroke="#4f46e5" strokeWidth={3} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
