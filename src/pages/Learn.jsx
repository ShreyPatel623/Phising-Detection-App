import { useState, useEffect } from 'react';
import { useApp } from '../context.js';
import { LESSONS, QUIZ } from '../data/content.js';

/** FR-14: awareness lessons + quiz. nav.sub = lesson id to open (contextual recommendation). */
export default function Learn() {
  const { S, actions, nav } = useApp();
  const [q, setQ] = useState({ i: 0, score: 0, picked: null, done: false });

  useEffect(() => { if (nav.sub) document.getElementById('ls-' + nav.sub)?.scrollIntoView({ block: 'start' }); }, [nav.sub]);

  const pick = i => { if (q.picked !== null) return; setQ(p => ({ ...p, picked: i, score: p.score + (i === QUIZ[p.i].a ? 1 : 0) })); };
  const next = () => {
    if (q.i === QUIZ.length - 1) { actions.setQuizBest(q.score); setQ(p => ({ ...p, done: true })); }
    else setQ(p => ({ ...p, i: p.i + 1, picked: null }));
  };
  const cur = QUIZ[q.i];

  return (
    <>
      <h1>Learn to spot scams</h1>
      <div className="stack">
        {LESSONS.map(l => (
          <details className="lesson" key={l.id} id={'ls-' + l.id} open={nav.sub === l.id}>
            <summary>{l.t}</summary>
            <div className="body">
              <p>{l.s}</p>
              <div><b>Red flags</b><ul>{l.f.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
              <div><b>What to do</b><ul>{l.d.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
            </div>
          </details>
        ))}
      </div>

      <section className="card stack">
        {q.done ? (
          <>
            <h2>Quiz done</h2>
            <p>You got <b>{q.score} of {QUIZ.length}</b> right.{S.quizBest ? ' Best: ' + S.quizBest + '.' : ''}</p>
            <button className="btn primary" onClick={() => setQ({ i: 0, score: 0, picked: null, done: false })}>Try again</button>
          </>
        ) : (
          <>
            <h2>Quick quiz <span className="muted small">{q.i + 1} of {QUIZ.length}</span></h2>
            <p>{cur.q}</p>
            <div>
              {cur.o.map((o, i) => <button key={i} className={'opt' + (q.picked !== null ? (i === cur.a ? ' right' : i === q.picked ? ' wrong' : '') : '')} disabled={q.picked !== null} onClick={() => pick(i)}>{o}</button>)}
            </div>
            {q.picked !== null && (
              <>
                <p className={'next ' + (q.picked === cur.a ? 'safe' : 'suspicious')}><b>{q.picked === cur.a ? 'Correct. ' : 'Not quite. '}</b>{cur.e}</p>
                <button className="btn primary" onClick={next}>{q.i === QUIZ.length - 1 ? 'See score' : 'Next question'}</button>
              </>
            )}
          </>
        )}
      </section>
    </>
  );
}
