import React, { useEffect, useMemo, useState } from 'react';
import Dashboard from './components/Dashboard';
import LearnPage from './components/LearnPage';
import LearnComplete from './components/LearnComplete';
import FreeReview from './components/FreeReview';
import WordList from './components/WordList';
import Settings from './components/Settings';
import DataManagement from './components/DataManagement';
import { useRepo } from './repo';
import { buildTodayQueue, recordAnswer } from './services/scheduleService';

const PAGES = { DASH: 'dash', LEARN: 'learn', COMPLETE: 'complete', FREE: 'free', WORDS: 'words', SETTINGS: 'settings', DATA: 'data' };

function App() {
  const repo = useMemo(() => useRepo(), []);
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState(PAGES.DASH);
  const [queue, setQueue] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [completeSummary, setCompleteSummary] = useState(null);

  useEffect(() => {
    const run = async () => {
      await repo.init();
      setReady(true);
    };
    run();
  }, [repo]);

  const startLearn = async () => {
    if (!ready) return;
    // 既存セッションがあれば再開
    const saved = await repo.getSession('schedule');
    if (saved && saved.queue && saved.queue.length > 0) {
      setQueue(saved.queue);
      setAnswers(saved.answers || []);
      setSessionId(saved.id || 'schedule');
      setTotalCount(saved.totalCount || saved.total || saved.queue.length + (saved.answers?.length || 0));
      setPage(PAGES.LEARN);
      return;
    }
    const todayQueue = await buildTodayQueue(repo);
    setQueue(todayQueue);
    setAnswers([]);
    const sid = Date.now().toString();
    setSessionId(sid);
    setTotalCount(todayQueue.length);
    await repo.saveSession('schedule', { id: sid, queue: todayQueue, answers: [], totalCount: todayQueue.length, currentIndex: 0 });
    setPage(PAGES.LEARN);
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
    if (page === PAGES.DASH) return <Dashboard repo={repo} onStartLearn={startLearn} onNavigate={setPage} />;
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
    if (page === PAGES.FREE) return <FreeReview onBack={() => setPage(PAGES.DASH)} />;
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

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-title">English Learning</div>
      </header>
      <main className="app-main">
        <div className="container">
          {renderPage()}
        </div>
      </main>
      <footer className="app-footer">
        <nav className="app-nav">
          <button className={`md-btn text nav-btn ${page === PAGES.DASH ? 'active' : ''}`} onClick={() => setPage(PAGES.DASH)}>
            <span className="nav-icon">🏠</span>
            <span className="nav-label">ダッシュボード</span>
          </button>
          <button className={`md-btn text nav-btn ${page === PAGES.LEARN ? 'active' : ''}`} onClick={() => setPage(PAGES.LEARN)}>
            <span className="nav-icon">📝</span>
            <span className="nav-label">学習</span>
          </button>
          <button className={`md-btn text nav-btn ${page === PAGES.FREE ? 'active' : ''}`} onClick={() => setPage(PAGES.FREE)}>
            <span className="nav-icon">📖</span>
            <span className="nav-label">自由復習</span>
          </button>
          <button className={`md-btn text nav-btn ${page === PAGES.WORDS ? 'active' : ''}`} onClick={() => setPage(PAGES.WORDS)}>
            <span className="nav-icon">📚</span>
            <span className="nav-label">単語</span>
          </button>
          <button className={`md-btn text nav-btn ${page === PAGES.SETTINGS ? 'active' : ''}`} onClick={() => setPage(PAGES.SETTINGS)}>
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">設定</span>
          </button>
          <button className={`md-btn text nav-btn ${page === PAGES.DATA ? 'active' : ''}`} onClick={() => setPage(PAGES.DATA)}>
            <span className="nav-icon">🗂️</span>
            <span className="nav-label">データ</span>
          </button>
        </nav>
      </footer>
    </div>
  );
}

export default App;
