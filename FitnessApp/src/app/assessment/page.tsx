'use client';

import { useState, useMemo, useEffect } from 'react';

type AnswerValue = 0 | 1 | 2 | 3 | 4 | 5;
type Q = { key: string; label: string };

type AssessmentHistory = {
  id: string;
  constitution: string | null;
  scores: Record<string, number>;
  createdAt: string;
  questionnaireVersion: number;
};

const QUESTIONS: Q[] = [
  { key: 'yang_intoleranceCold',  label: 'Do you often feel cold in hands/feet?' },
  { key: 'yang_lowEnergyMorning', label: 'Do you feel low energy in the morning?' },
  { key: 'yin_dryMouth',          label: 'Do you frequently have a dry mouth or thirst at night?' },
  { key: 'yin_hotPalms',          label: 'Do your palms/soles feel warm, with restlessness?' },
  { key: 'qi_shortBreath',        label: 'Do you feel short of breath after mild activity?' },
  { key: 'qi_fatigueAfternoon',   label: 'Do you feel fatigued in the afternoon?' },
  { key: 'phlegm_heavyBody',      label: 'Do you feel heaviness or drowsiness in the body?' },
  { key: 'phlegm_greasyTongue',   label: 'Thick/greasy tongue coating or dislike greasy food?' },
  { key: 'stasis_fixedPain',      label: 'Fixed stabbing/aching pain areas?' },
  { key: 'stasis_darkLips',       label: 'Darker lips/nails or bruised spots?' },
];

export default function AssessmentPage() {
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<null | {
    assessmentId: string;
    constitution: string | null;
    scores: Record<string, number>;
  }>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AssessmentHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const allAnswered = useMemo(
    () => QUESTIONS.every((q) => answers[q.key] !== undefined),
    [answers]
  );

  const setAnswer = (key: string, v: AnswerValue) =>
    setAnswers((prev) => ({ ...prev, [key]: v }));

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const resp = await fetch('/api/assessment', {
        method: 'GET',
        credentials: 'same-origin',
      });

      if (!resp.ok) {
        throw new Error(`Failed to load history: ${resp.status}`);
      }

      const data = await resp.json();
      setHistory(data);
    } catch (e: any) {
      console.error('Failed to load history:', e);
      setError(e?.message || 'Failed to load history');
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function onSubmit() {
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const resp = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ answers, questionnaireVersion: 1 }),
      });

      const ct = resp.headers.get('content-type') || '';
      if (!resp.ok) {
        if (ct.includes('application/json')) {
          const e = await resp.json();
          throw new Error(e?.error || e?.message || `Request failed: ${resp.status}`);
        } else {
          const txt = await resp.text();
          throw new Error(`Request failed: ${resp.status}. ${txt.slice(0, 120)}...`);
        }
      }

      const data = await resp.json();
      setResult({
        assessmentId: data.id,
        constitution: data.constitution,
        scores: data.scores,
      });
      // Reload history after successful submission
      loadHistory();
    } catch (e: any) {
      setError(e?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
<main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Page container */}
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 bg-clip-text text-transparent drop-shadow-sm">
                Constitution Assessment
              </h1>
              <p className="mt-2 text-sm text-neutral-600">
                Answer the following questions. After submission, the system computes category scores and saves your assessment.
              </p>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100"
            >
              {showHistory ? 'Hide History' : 'View History'}
            </button>
          </div>
        </header>

        {/* History Section */}
        {showHistory && (
          <section className="mb-8 rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="p-6 sm:p-8">
              <h2 className="mb-4 text-xl font-semibold text-neutral-900">Assessment History</h2>
              {loadingHistory ? (
                <p className="text-sm text-neutral-600">Loading history...</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-neutral-600">No assessment history found.</p>
              ) : (
                <div className="space-y-4">
                  {history.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-neutral-900">
                            {assessment.constitution || 'BALANCED / Undetermined'}
                          </p>
                          <p className="text-xs text-neutral-600">
                            {new Date(assessment.createdAt).toLocaleDateString()} at{' '}
                            {new Date(assessment.createdAt).toLocaleTimeString()}
                          </p>
                          <p className="text-xs text-neutral-500">ID: {assessment.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-neutral-600">Scores:</p>
                          <div className="mt-1 text-xs">
                            {Object.entries(assessment.scores).map(([key, value]) => (
                              <span key={key} className="mr-2">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Card */}
        <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
          {/* Card body */}
          <div className="p-6 sm:p-8">
            <ol className="space-y-4">
              {QUESTIONS.map((q, idx) => (
                <li key={q.key} className="rounded-xl border border-neutral-200 p-4 sm:p-5">
                  <p className="mb-3 font-medium text-neutral-900">
                    {idx + 1}. {q.label}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {[0, 1, 2, 3, 4, 5].map((v) => (
                      <label
                        key={v}
                        className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-800 hover:border-neutral-300"
                      >
                        <input
                          type="radio"
                          name={q.key}
                          value={v}
                          checked={answers[q.key] === (v as AnswerValue)}
                          onChange={() => setAnswer(q.key, v as AnswerValue)}
                          className="h-4 w-4"
                        />
                        <span>
                          {v} {v === 0 ? '(Never)' : v === 5 ? '(Always)' : ''}
                        </span>
                      </label>
                    ))}
                  </div>
                </li>
              ))}
            </ol>

            {/* Error */}
            {error && (
              <p className="mt-4 text-sm text-red-600">
                {error}
              </p>
            )}

            {/* Result */}
            {result && (
              <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
                <p className="font-medium text-neutral-900">Assessment saved</p>
                <p className="mt-1 text-sm text-neutral-700">ID: {result.assessmentId}</p>
                <p className="mt-2 text-neutral-800">
                  Constitution:&nbsp;
                  <b>{result.constitution ?? 'BALANCED / Undetermined'}</b>
                </p>
                <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-white p-3 text-xs text-neutral-800">
{JSON.stringify(result.scores, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Sticky card footer */}
          <div className="sticky bottom-0 rounded-b-2xl border-t border-neutral-200 bg-white/80 p-4 backdrop-blur supports-[backdrop-filter]:bg-white/60 sm:p-6">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100"
                onClick={() => {
                  setAnswers({});
                  setResult(null);
                  setError(null);
                }}
              >
                Reset
              </button>
              <button
                disabled={!allAnswered || submitting}
                onClick={onSubmit}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-900 disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}