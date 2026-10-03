"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Status = "New" | "Learning" | "Mastered";
type Priority = "High" | "Medium" | "Low";

type Word = {
  id: number;
  word: string;
  ipa: string;
  type: string;
  meaning: string;
  topic: string;
  priority: Priority;
  status: Status;
  dateAdded: string;
  mastery: number;
};

type Tab = "home" | "words" | "test" | "tracking";

const seedWords: Word[] = [
  { id: 1, word: "Legitimate", ipa: "/lɪˈdʒɪtɪmət/", type: "Adjective", meaning: "Hợp pháp, chính đáng", topic: "Society", priority: "Medium", status: "Mastered", dateAdded: "17/08/26", mastery: 100 },
  { id: 2, word: "Take responsibility", ipa: "/teɪk rɪˌspɒnsəˈbɪləti/", type: "Verb phrase", meaning: "Chịu trách nhiệm", topic: "Work", priority: "High", status: "Mastered", dateAdded: "17/08/26", mastery: 100 },
  { id: 3, word: "Make progress", ipa: "/meɪk ˈprəʊɡres/", type: "Verb phrase", meaning: "Tiến bộ", topic: "Education", priority: "Medium", status: "Learning", dateAdded: "01/09/26", mastery: 68 },
  { id: 4, word: "Pay attention", ipa: "/peɪ əˈtenʃn/", type: "Verb phrase", meaning: "Chú ý", topic: "Education", priority: "High", status: "Learning", dateAdded: "01/09/26", mastery: 54 },
  { id: 5, word: "Raise awareness", ipa: "/reɪz əˈweənəs/", type: "Verb phrase", meaning: "Nâng cao nhận thức", topic: "Society", priority: "High", status: "Learning", dateAdded: "02/09/26", mastery: 47 },
  { id: 6, word: "Break the law", ipa: "/breɪk ðə lɔː/", type: "Verb phrase", meaning: "Phạm luật", topic: "Society", priority: "Medium", status: "New", dateAdded: "03/09/26", mastery: 10 },
  { id: 7, word: "Conscientious", ipa: "/ˌkɒnʃiˈenʃəs/", type: "Adjective", meaning: "Tận tâm, có lương tâm", topic: "Work", priority: "High", status: "New", dateAdded: "04/09/26", mastery: 8 },
  { id: 8, word: "Abandon", ipa: "/əˈbændən/", type: "Verb", meaning: "Từ bỏ, bỏ lại", topic: "Society", priority: "Medium", status: "Mastered", dateAdded: "04/09/26", mastery: 94 }
];

const navItems: { key: Tab; label: string; icon: string }[] = [
  { key: "home", label: "Dashboard", icon: "⌂" },
  { key: "words", label: "Vocab List", icon: "▤" },
  { key: "test", label: "Vocab Test", icon: "✎" },
  { key: "tracking", label: "Tracking", icon: "◫" }
];

function Ring({ value, total, caption, tone = "sage" }: { value: number; total: number; caption: string; tone?: "sage" | "yellow" }) {
  const p = Math.min(100, Math.round((value / total) * 100));
  return (
    <div className="ring-wrap">
      <div className={`ring ${tone}`} style={{ background: `conic-gradient(var(--ring-color) ${p * 3.6}deg, #fff ${p * 3.6}deg)` }}>
        <div className="ring-inner"><strong>{value}/{total}</strong><span>{p}%</span></div>
      </div>
      <p>{caption}</p>
    </div>
  );
}

function MiniChart({ mastered, newCount }: { mastered: number; newCount: number }) {
  const maxValue = Math.max(4, mastered, newCount);
  const y = (value: number) => 125 - Math.round((value / maxValue) * 80);
  return (
    <>
      <svg className="mini-chart" viewBox="0 0 360 165" role="img" aria-label="Biểu đồ tiến độ từ vựng theo tuần">
        {[25, 60, 95, 125].map((lineY) => <line key={lineY} x1="25" y1={lineY} x2="345" y2={lineY} stroke="#ded8c9" strokeWidth="1" />)}
        <polyline points={`35,125 190,125 335,${y(mastered)}`} fill="none" stroke="#71845b" strokeWidth="4" strokeLinecap="round" />
        <polyline points={`35,125 190,125 335,${y(newCount)}`} fill="none" stroke="#d8ae55" strokeWidth="4" strokeLinecap="round" />
        <circle cx="335" cy={y(mastered)} r="5" fill="#71845b" />
        <circle cx="335" cy={y(newCount)} r="4" fill="#d8ae55" />
        <text x="24" y="158">2 tuần trước</text><text x="160" y="158">Tuần trước</text><text x="305" y="158">Tuần này</text>
      </svg>
      <div className="chart-note">
        <b>● Xanh:</b> số từ đã Mastered · <b>● Vàng:</b> số từ mới. Hai tuần cũ đang bằng 0 vì V1 chưa lưu lịch sử theo tuần.
      </div>
    </>
  );
}

export default function Page() {
  const [tab, setTab] = useState<Tab>("home");
  const [words, setWords] = useState<Word[]>(seedWords);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | Status>("All");
  const [showAdd, setShowAdd] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [testIndex, setTestIndex] = useState(0);
  const [testScore, setTestScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [testWords, setTestWords] = useState<Word[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("vocab-garden-words");
    if (saved) {
      try { setWords(JSON.parse(saved)); } catch { /* ignore malformed local data */ }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem("vocab-garden-words", JSON.stringify(words));
  }, [words, hydrated]);

  const stats = useMemo(() => ({
    total: words.length,
    newCount: words.filter(w => w.status === "New").length,
    learning: words.filter(w => w.status === "Learning").length,
    mastered: words.filter(w => w.status === "Mastered").length,
    avgMastery: words.length ? Math.round(words.reduce((a, w) => a + w.mastery, 0) / words.length) : 0
  }), [words]);

  const filteredWords = useMemo(() => words.filter(w => {
    const okSearch = `${w.word} ${w.meaning} ${w.topic}`.toLowerCase().includes(search.toLowerCase());
    const okFilter = filter === "All" || w.status === filter;
    return okSearch && okFilter;
  }), [words, search, filter]);

  function speak(word: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = "en-US";
    utter.rate = 0.82;
    window.speechSynthesis.speak(utter);
  }

  function addWord(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const now = new Date();
    const next: Word = {
      id: Date.now(),
      word: String(fd.get("word") || "").trim(),
      ipa: String(fd.get("ipa") || "").trim(),
      type: String(fd.get("type") || "").trim(),
      meaning: String(fd.get("meaning") || "").trim(),
      topic: String(fd.get("topic") || "General").trim(),
      priority: (fd.get("priority") as Priority) || "Medium",
      status: "New",
      mastery: 0,
      dateAdded: now.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" })
    };
    if (!next.word || !next.meaning) return;
    setWords(prev => [next, ...prev]);
    setShowAdd(false);
    e.currentTarget.reset();
  }

  function startTest() {
    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, Math.min(5, words.length));
    setTestWords(shuffled);
    setTestIndex(0);
    setTestScore(0);
    setSelectedAnswer(null);
    setFinished(false);
  }

  function choicesFor(current: Word) {
    const distractors = words.filter(w => w.id !== current.id).sort(() => Math.random() - 0.5).slice(0, 3).map(w => w.meaning);
    return [...distractors, current.meaning].sort(() => Math.random() - 0.5);
  }

  const currentTestWord = testWords[testIndex];
  const [choiceCache, setChoiceCache] = useState<string[]>([]);
  useEffect(() => {
    if (currentTestWord) setChoiceCache(choicesFor(currentTestWord));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTestWord?.id]);

  function answer(choice: string) {
    if (!currentTestWord || selectedAnswer) return;
    setSelectedAnswer(choice);
    const correct = choice === currentTestWord.meaning;
    if (correct) {
      setTestScore(s => s + 1);
      setWords(prev => prev.map(w => w.id === currentTestWord.id ? { ...w, mastery: Math.min(100, w.mastery + 8), status: w.mastery + 8 >= 85 ? "Mastered" : "Learning" } : w));
    } else {
      setWords(prev => prev.map(w => w.id === currentTestWord.id ? { ...w, mastery: Math.max(0, w.mastery - 5), status: "Learning" } : w));
    }
  }

  function nextQuestion() {
    if (testIndex + 1 >= testWords.length) setFinished(true);
    else { setTestIndex(i => i + 1); setSelectedAnswer(null); }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">VG</span><div><strong>Vocab Garden</strong><small>study softly, grow daily</small></div></div>
        <nav>{navItems.map(item => <button key={item.key} onClick={() => setTab(item.key)} className={tab === item.key ? "active" : ""}><span>{item.icon}</span>{item.label}</button>)}</nav>
        <div className="side-note"><b>🌱 Daily goal</b><p>Học đều một chút mỗi ngày.</p><div className="tiny-progress"><i style={{ width: "78%" }} /></div><small>31 / 40 từ</small></div>
      </aside>

      <section className="content">
        <header className="topbar"><div><span className="eyebrow">FRIDAY · OCT 03</span><h1>{tab === "home" ? "Study Dashboard" : navItems.find(n => n.key === tab)?.label}</h1></div><button className="add-button" onClick={() => setShowAdd(true)}>＋ Add word</button></header>

        {tab === "home" && <div className="page-grid">
          <section className="hero-card"><div><span className="pill">THIS WEEK</span><h2>You're growing nicely 🌿</h2><p>Giữ nhịp học nhẹ nhưng đều. Bạn đang có <b>{stats.mastered}</b> từ đã thuộc.</p><button onClick={() => { setTab("test"); startTest(); }}>Start quick test →</button></div><div className="hero-rings"><Ring value={31} total={35} caption="31 từ đã học / mục tiêu 35 từ trong tuần" /><Ring value={44} total={200} caption="44 từ đã học / mục tiêu 200 từ trong tháng" tone="yellow" /></div></section>

          <div className="stat-row">
            <article><span>Total vocab</span><strong>{stats.total}</strong><small>in your library</small></article>
            <article><span>Learning</span><strong>{stats.learning}</strong><small>in progress</small></article>
            <article><span>Mastered</span><strong>{stats.mastered}</strong><small>completed</small></article>
            <article><span>Avg. mastery</span><strong>{stats.avgMastery}%</strong><small>overall score</small></article>
          </div>

          <section className="panel chart-panel"><div className="section-title"><div><span className="pill green">WEEK-ON-WEEK</span><h3>Vocabulary progress</h3></div><div className="legend"><i className="dot sage" /> Completed <i className="dot yellow" /> New vocab</div></div><MiniChart mastered={stats.mastered} newCount={stats.newCount} /></section>

          <section className="panel summary-panel"><div className="section-title"><div><span className="pill pink">TODAY</span><h3>Quick summary</h3></div></div><div className="summary-list"><div><span>Words to review</span><b>16</b></div><div><span>New words</span><b>{stats.newCount}</b></div><div><span>Average study time</span><b>6m 24s</b></div><div><span>Accuracy</span><b>89%</b></div></div></section>

          <section className="panel wide"><div className="section-title"><div><span className="pill yellow">RECENT VOCAB</span><h3>Continue learning</h3></div><button className="text-button" onClick={() => setTab("words")}>View all →</button></div><div className="table-wrap"><table><thead><tr><th>Word</th><th>Meaning</th><th>Topic</th><th>Priority</th><th>Progress</th><th>Status</th></tr></thead><tbody>{words.slice(0, 6).map(w => <tr key={w.id}><td><b>{w.word}</b><small>{w.ipa}</small></td><td>{w.meaning}</td><td>{w.topic}</td><td><span className={`priority ${w.priority.toLowerCase()}`}>{w.priority}</span></td><td><div className="cell-progress"><i style={{ width: `${w.mastery}%` }} /></div><small>{w.mastery}%</small></td><td><span className={`status ${w.status.toLowerCase()}`}>{w.status}</span></td></tr>)}</tbody></table></div></section>
        </div>}

        {tab === "words" && <div className="page-stack">
          <section className="panel vocab-toolbar"><div className="searchbox">⌕<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search word, meaning or topic..." /></div><div className="filters">{(["All", "New", "Learning", "Mastered"] as const).map(f => <button key={f} className={filter === f ? "selected" : ""} onClick={() => setFilter(f)}>{f}</button>)}</div></section>
          <section className="panel"><div className="section-title"><div><span className="pill green">VOCAB LIST</span><h3>{filteredWords.length} vocabulary items</h3></div></div><div className="table-wrap full"><table><thead><tr><th>🔊</th><th>Vocabulary</th><th>Phonetic</th><th>Word type</th><th>Meaning</th><th>Topic</th><th>Priority</th><th>Date added</th><th>Mastery</th><th>Status</th></tr></thead><tbody>{filteredWords.map(w => <tr key={w.id}><td><button className="speaker" onClick={() => speak(w.word)}>▶</button></td><td><b>{w.word}</b></td><td>{w.ipa}</td><td>{w.type}</td><td>{w.meaning}</td><td>{w.topic}</td><td><span className={`priority ${w.priority.toLowerCase()}`}>{w.priority}</span></td><td>{w.dateAdded}</td><td><b>{w.mastery}%</b></td><td><span className={`status ${w.status.toLowerCase()}`}>{w.status}</span></td></tr>)}</tbody></table></div></section>
        </div>}

        {tab === "test" && <div className="test-layout">
          <section className="test-card">
            {!testWords.length || finished ? <div className="test-start"><span className="quiz-badge">Quiz & Submit</span><h2>{finished ? "Test complete!" : "Random Vocab Test"}</h2>{finished ? <><div className="big-score">{testScore}/{testWords.length}</div><p>Bạn đã hoàn thành bài kiểm tra. Điểm mastery của từ vừa được cập nhật.</p></> : <p>Lấy ngẫu nhiên 5 từ trong Vocab List, kiểm tra nghĩa và cập nhật tiến độ.</p>}<button onClick={startTest}>{finished ? "Try again" : "Start test"}</button></div> : <>
              <div className="test-progress"><span>Question {testIndex + 1}/{testWords.length}</span><b>{testScore} correct</b></div>
              <div className="question"><button className="speaker big" onClick={() => speak(currentTestWord.word)}>▶</button><h2>{currentTestWord.word}</h2><span>{currentTestWord.ipa}</span><p>Chọn nghĩa đúng:</p></div>
              <div className="choices">{choiceCache.map(choice => { const isCorrect = choice === currentTestWord.meaning; const cls = selectedAnswer ? (isCorrect ? "correct" : selectedAnswer === choice ? "wrong" : "") : ""; return <button key={choice} className={cls} onClick={() => answer(choice)} disabled={!!selectedAnswer}>{choice}</button>; })}</div>
              {selectedAnswer && <div className="answer-footer"><div><span>{selectedAnswer === currentTestWord.meaning ? "✓ Correct" : "✕ Not quite"}</span><small>Correct answer: <b>{currentTestWord.meaning}</b></small></div><button onClick={nextQuestion}>{testIndex + 1 === testWords.length ? "See result" : "Next →"}</button></div>}
            </>}
          </section>
          <aside className="test-side panel"><span className="pill yellow">TEST GUIDE</span><h3>Daily random test</h3><p>• 5 từ ngẫu nhiên</p><p>• Nghe phát âm trực tiếp</p><p>• Đúng: mastery +8</p><p>• Sai: mastery -5</p><p>• Mastery ≥ 85% → Mastered</p></aside>
        </div>}

        {tab === "tracking" && <div className="page-stack"><section className="panel"><div className="section-title"><div><span className="pill pink">KANBAN TRACKING</span><h3>Learning status</h3></div></div><div className="kanban">{(["New", "Learning", "Mastered"] as Status[]).map(status => <div className="kanban-col" key={status}><div className={`kanban-head ${status.toLowerCase()}`}><span>{status}</span><b>{words.filter(w => w.status === status).length}</b></div>{words.filter(w => w.status === status).map(w => <article key={w.id}><div><b>{w.word}</b><button onClick={() => speak(w.word)}>🔊</button></div><p>{w.meaning}</p><small>{w.topic} · {w.priority}</small><div className="card-progress"><i style={{ width: `${w.mastery}%` }} /></div><footer><span>{w.mastery}% mastery</span><select value={w.status} onChange={e => setWords(prev => prev.map(x => x.id === w.id ? { ...x, status: e.target.value as Status } : x))}><option>New</option><option>Learning</option><option>Mastered</option></select></footer></article>)}</div>)}</div></section></div>}
      </section>

      <nav className="mobile-nav">{navItems.map(item => <button key={item.key} onClick={() => setTab(item.key)} className={tab === item.key ? "active" : ""}><span>{item.icon}</span><small>{item.label}</small></button>)}</nav>

      {showAdd && <div className="modal-backdrop" onMouseDown={() => setShowAdd(false)}><form className="modal" onSubmit={addWord} onMouseDown={e => e.stopPropagation()}><div className="modal-title"><div><span className="pill green">NEW VOCAB</span><h2>Add a new word</h2></div><button type="button" onClick={() => setShowAdd(false)}>×</button></div><div className="form-grid"><label>Vocabulary<input name="word" required placeholder="e.g. abandon" autoFocus /></label><label>IPA<input name="ipa" placeholder="/əˈbændən/" /></label><label>Word type<input name="type" placeholder="Verb" /></label><label>Meaning<input name="meaning" required placeholder="Từ bỏ, bỏ lại" /></label><label>Topic<input name="topic" placeholder="Society" /></label><label>Priority<select name="priority" defaultValue="Medium"><option>High</option><option>Medium</option><option>Low</option></select></label></div><div className="modal-actions"><button type="button" className="ghost" onClick={() => setShowAdd(false)}>Cancel</button><button type="submit">Save vocabulary</button></div></form></div>}
    </main>
  );
}
