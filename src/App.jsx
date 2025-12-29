import React, { useEffect, useMemo, useState } from 'react';
import { Home, PenSquare, Repeat, BookOpen, Settings as Gear, Database } from 'lucide-react';
import Dashboard from './components/Dashboard';
import LearnPage from './components/LearnPage';
import LearnComplete from './components/LearnComplete';
import FreeReview from './components/FreeReview';
import WordList from './components/WordList';
import Settings from './components/Settings';
import DataManagement from './components/DataManagement';
import LearnModeSelect from './components/LearnModeSelect';
import { useRepo } from './repo';
import { buildTodayQueue, recordAnswer } from './services/scheduleService';

const PAGES = { DASH: 'dash', LEARN: 'learn', LEARN_MODE: 'learnMode', COMPLETE: 'complete', FREE: 'free', WORDS: 'words', SETTINGS: 'settings', DATA: 'data' };

function App() {
  const repo = useMemo(() => useRepo(), []);
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState('');
  const [page, setPage] = useState(PAGES.DASH);
  const [queue, setQueue] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [completeSummary, setCompleteSummary] = useState(null);

  useEffect(() => {
    const run = async () => {
      try {
        await repo.init();
        setReady(true);
      } catch (e) {
        console.error('Failed to init repo', e);
        setInitError('データベースの初期化に失敗しました。ブラウザをリロードするか IndexedDB をクリアして再度お試しください。');
        setReady(true); // UIは表示しておく
      }
    };
    run();
  }, [repo]);

  const startLearn = async (skills = ['A', 'B', 'C'], options = {}) => {
    if (!ready) return;
    if (options.forceNew) {
      await repo.clearSession('schedule');
    }
    const saved = await repo.getSession('schedule');
    const todayQueue = await buildTodayQueue(repo, skills);
    if (saved && saved.queue && saved.queue.length > 0 && !options.forceNew) {
      const prevAnswers = saved.answers || [];
      const seen = new Set();
      for (const q of saved.queue) {
        seen.add(`${q.item.id}-${q.skill}`);
      }
      for (const a of prevAnswers) {
        seen.add(`${a.item.id}-${a.skill}`);
      }
      const additions = todayQueue.filter((q) => !seen.has(`${q.item.id}-${q.skill}`));
      const mergedQueue = [...saved.queue, ...additions];
      const total = prevAnswers.length + mergedQueue.length;
      await repo.saveSession('schedule', {
        id: saved.id || 'schedule',
        queue: mergedQueue,
        answers: prevAnswers,
        totalCount: total,
        skills,
        currentIndex: 0,
      });
      setQueue(mergedQueue);
      setAnswers(prevAnswers);
      setSessionId(saved.id || 'schedule');
      setTotalCount(total);
      setPage(PAGES.LEARN);
      return;
    }
    setQueue(todayQueue);
    setAnswers([]);
    const sid = Date.now().toString();
    setSessionId(sid);
    setTotalCount(todayQueue.length);
    await repo.saveSession('schedule', { id: sid, queue: todayQueue, answers: [], totalCount: todayQueue.length, skills, currentIndex: 0 });
    setPage(PAGES.LEARN);
  };

  const resetTodayLearning = async () => {
    await repo.clearSession('schedule');
    setQueue([]);
    setAnswers([]);
    setTotalCount(0);
  };

  const handleAnswer = async (item, skill, isCorrect, elapsedMs) => {
    await recordAnswer(repo, item, skill, isCorrect, elapsedMs);
    setAnswers((prev) => {
      const nextAnswers = [...prev, { item, skill, isCorrect }];
      setQueue((prevQueue) => {
        const nextQueue = prevQueue.slice(1);
        repo.saveSession('schedule', {
          id: sessionId || 'schedule',
          queue: nextQueue,
          answers: nextAnswers,
          totalCount: totalCount || (nextQueue.length + nextAnswers.length),
          currentIndex: 0,
        });
        return nextQueue;
      });
      return nextAnswers;
    });
  };

  const finishLearn = () => {
    const correct = answers.filter((a) => a.isCorrect).length;
    const wrong = answers.filter((a) => !a.isCorrect).length;
    const wrongItems = answers.filter((a) => !a.isCorrect).map((a) => a.item);
    setCompleteSummary({ correct, wrong, wrongItems });
    repo.clearSession('schedule');
    setPage(PAGES.COMPLETE);
  };

  const renderPage = () => {
    if (page === PAGES.DASH) return <Dashboard repo={repo} onStartLearn={() => setPage(PAGES.LEARN_MODE)} onNavigate={setPage} />;
    if (page === PAGES.LEARN_MODE) {
      return (
        <LearnModeSelect
          repo={repo}
          onStart={(skills) => startLearn(skills, { forceNew: true })}
          onReset={resetTodayLearning}
          onBack={() => setPage(PAGES.DASH)}
        />
      );
    }
    if (page === PAGES.LEARN) {
      return (
        <LearnPage
          queue={queue}
          sessionId={sessionId}
          answeredCount={answers.length}
          totalCount={totalCount}
          onAnswer={handleAnswer}
          onFinish={finishLearn}
          onAbort={() => {
            setPage(PAGES.DASH);
          }}
        />
      );
    }
    if (page === PAGES.COMPLETE) {
      return (
        <LearnComplete
          summary={completeSummary}
          onBack={() => setPage(PAGES.DASH)}
          onRetryWrong={() => {
            const wrong = completeSummary?.wrongItems || [];
            const wrongQueue = wrong.map((w) => ({ item: w, skill: 'A' }));
            setQueue(wrongQueue);
            setAnswers([]);
            const sid = Date.now().toString();
            setSessionId(sid);
            setTotalCount(wrongQueue.length);
            repo.saveSession('schedule', { id: sid, queue: wrongQueue, answers: [], totalCount: wrongQueue.length, currentIndex: 0 });
            setPage(PAGES.LEARN);
          }}
        />
      );
    }
    if (page === PAGES.FREE) return <FreeReview repo={repo} onBack={() => setPage(PAGES.DASH)} />;
    if (page === PAGES.WORDS) return <WordList repo={repo} ready={ready} onBack={() => setPage(PAGES.DASH)} />;
    if (page === PAGES.SETTINGS) return <Settings repo={repo} onBack={() => setPage(PAGES.DASH)} />;
    if (page === PAGES.DATA) return <DataManagement repo={repo} onBack={() => setPage(PAGES.DASH)} />;
    return null;
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card">読み込み中...</div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card" style={{ maxWidth: 520 }}>
          <p style={{ color: '#dc2626' }}>{initError}</p>
          <p className="muted">それでも進まない場合は、ブラウザのサイトデータ（IndexedDB など）を消去してから再読み込みしてください。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <div className="container">
          {renderPage()}
        </div>
      </main>
      <footer className="app-footer">
        <nav className="app-nav">
          <button className={`md-btn text nav-btn ${page === PAGES.DASH ? 'active' : ''}`} onClick={() => setPage(PAGES.DASH)}>
            <Home size={18} className="nav-icon" />
            <span className="nav-label">ホーム</span>
          </button>
          <button className={`md-btn text nav-btn ${(page === PAGES.LEARN || page === PAGES.LEARN_MODE) ? 'active' : ''}`} onClick={() => setPage(PAGES.LEARN_MODE)}>
            <PenSquare size={18} className="nav-icon" />
            <span className="nav-label">学習</span>
          </button>
          <button className={`md-btn text nav-btn ${page === PAGES.FREE ? 'active' : ''}`} onClick={() => setPage(PAGES.FREE)}>
            <Repeat size={18} className="nav-icon" />
            <span className="nav-label">復習</span>
          </button>
          <button className={`md-btn text nav-btn ${page === PAGES.WORDS ? 'active' : ''}`} onClick={() => setPage(PAGES.WORDS)}>
            <BookOpen size={18} className="nav-icon" />
            <span className="nav-label">単語</span>
          </button>
          <button className={`md-btn text nav-btn ${page === PAGES.SETTINGS ? 'active' : ''}`} onClick={() => setPage(PAGES.SETTINGS)}>
            <Gear size={18} className="nav-icon" />
            <span className="nav-label">設定</span>
          </button>
          <button className={`md-btn text nav-btn ${page === PAGES.DATA ? 'active' : ''}`} onClick={() => setPage(PAGES.DATA)}>
            <Database size={18} className="nav-icon" />
            <span className="nav-label">データ</span>
          </button>
        </nav>
      </footer>
    </div>
  );
}

export default App;
