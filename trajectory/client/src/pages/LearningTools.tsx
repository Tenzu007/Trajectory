import React, { useEffect, useState } from 'react';
import { flashcardsApi } from '../api/index.js';

interface FlashcardItem {
  _id: string;
  front: string;
  back: string;
  source: 'manual' | 'llm_generated';
  verified: boolean;
  intervalDays: number;
  easeFactor: number;
  nextDueAt: string;
}

interface FeynmanResult {
  clarityScore: number;
  jargonDetected: string[];
  strengths: string;
  missingGaps: string;
  advice: string;
}

export const LearningTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'flashcards' | 'feynman'>('flashcards');

  // Flashcards state
  const [dueCards, setDueCards] = useState<FlashcardItem[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [allCards, setAllCards] = useState<FlashcardItem[]>([]);

  // Generator modal
  const [isGenerating, setIsGenerating] = useState(false);
  const [genTopic, setGenTopic] = useState('Operating Systems: Virtual Memory & Page Faults');
  const [genNotes, setGenNotes] = useState('Inverted page tables, TLB cache miss penalties, LRU page replacement algorithm');
  const [generatingLoading, setGeneratingLoading] = useState(false);

  // Feynman state
  const [feynmanConcept, setFeynmanConcept] = useState('Deadlock in Operating Systems');
  const [feynmanExplanation, setFeynmanExplanation] = useState(
    'A deadlock is like two cars meeting head-to-head on a one-lane bridge. Neither driver can move forward, and neither is willing to reverse. Because each car is holding the lane and waiting for the other to clear, both are frozen indefinitely.'
  );
  const [feynmanResult, setFeynmanResult] = useState<FeynmanResult | null>(null);
  const [feynmanLoading, setFeynmanLoading] = useState(false);

  const fetchDueCards = async () => {
    try {
      const res = await flashcardsApi.due();
      setDueCards(res.data.data || []);
      setCurrentCardIndex(0);
      setIsFlipped(false);
    } catch {
      // ignore
    }
  };

  const fetchAllCards = async () => {
    try {
      const res = await flashcardsApi.list();
      setAllCards(res.data.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchDueCards();
    fetchAllCards();
  }, []);

  const handleReviewRating = async (rating: number) => {
    if (dueCards.length === 0) return;
    const currentCard = dueCards[currentCardIndex];

    try {
      await flashcardsApi.review({
        flashcardId: currentCard._id,
        rating,
      });

      if (currentCardIndex + 1 < dueCards.length) {
        setCurrentCardIndex(currentCardIndex + 1);
        setIsFlipped(false);
      } else {
        // Deck finished!
        setDueCards([]);
        fetchAllCards();
      }
    } catch {
      // ignore
    }
  };

  const handleGenerateCards = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genTopic.trim()) return;
    setGeneratingLoading(true);
    try {
      await flashcardsApi.generate({
        topic: genTopic,
        notes: genNotes,
      });
      setIsGenerating(false);
      fetchDueCards();
      fetchAllCards();
    } catch {
      // ignore
    } finally {
      setGeneratingLoading(false);
    }
  };

  const handleEvaluateFeynman = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feynmanConcept.trim() || !feynmanExplanation.trim()) return;
    setFeynmanLoading(true);
    try {
      const res = await flashcardsApi.feynman({
        concept: feynmanConcept,
        explanation: feynmanExplanation,
      });
      setFeynmanResult(res.data.data);
    } catch {
      // ignore
    } finally {
      setFeynmanLoading(false);
    }
  };

  const currentCard = dueCards[currentCardIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* ─── Header & Tab Switcher ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Deep Learning Suite
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Active recall with FSRS spaced repetition and Feynman technique intuitive explanation simulation.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            background: 'var(--color-bg-elevated)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}
        >
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`btn btn-sm ${activeTab === 'flashcards' ? 'btn-primary' : 'btn-ghost'}`}
          >
            🗂️ Spaced Repetition ({dueCards.length} Due)
          </button>
          <button
            onClick={() => setActiveTab('feynman')}
            className={`btn btn-sm ${activeTab === 'feynman' ? 'btn-primary' : 'btn-ghost'}`}
          >
            🧠 Feynman Simulator
          </button>
        </div>
      </div>

      {/* ─── TAB 1: SPACED REPETITION FLASHCARDS ───────────────────────────── */}
      {activeTab === 'flashcards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
              Review Session: {dueCards.length > 0 ? `${currentCardIndex + 1} of ${dueCards.length}` : 'All caught up!'}
            </div>
            <button onClick={() => setIsGenerating(!isGenerating)} className="btn btn-secondary btn-sm">
              ✨ Generate Cards from Notes
            </button>
          </div>

          {/* Generator Modal */}
          {isGenerating && (
            <form onSubmit={handleGenerateCards} className="card" style={{ border: '1px solid var(--color-primary)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Auto-Generate Flashcards</h3>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="label">Topic / Subject Unit</label>
                <input
                  type="text"
                  className="input"
                  required
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="label">Notes / Keywords (Optional context)</label>
                <textarea
                  className="textarea"
                  rows={2}
                  value={genNotes}
                  onChange={(e) => setGenNotes(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsGenerating(false)} className="btn btn-ghost btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={generatingLoading} className="btn btn-primary btn-sm">
                  {generatingLoading ? 'Generating Cards...' : 'Generate 3 High-Yield Cards'}
                </button>
              </div>
            </form>
          )}

          {/* Flashcard Active Recall Arena */}
          {dueCards.length > 0 && currentCard ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="card-glass"
                style={{
                  width: '100%',
                  maxWidth: '680px',
                  minHeight: '280px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '32px',
                  cursor: 'pointer',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isFlipped ? 'scale(1.01)' : 'scale(1)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-accent">
                    {isFlipped ? 'Answer (Click to Flip)' : 'Question (Click to Reveal Answer)'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Ease: {currentCard.easeFactor} • Interval: {currentCard.intervalDays}d
                  </span>
                </div>

                <div
                  style={{
                    fontSize: isFlipped ? '1.15rem' : '1.35rem',
                    fontWeight: isFlipped ? 500 : 700,
                    lineHeight: '1.6',
                    textAlign: 'center',
                    padding: '24px 0',
                    color: isFlipped ? 'var(--color-accent)' : 'var(--color-text-primary)',
                  }}
                >
                  {isFlipped ? currentCard.back : currentCard.front}
                </div>

                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {isFlipped ? 'Rate your recall difficulty below:' : 'Tap card to flip and verify your recall'}
                </div>
              </div>

              {/* FSRS Rating Buttons (Shown when card is flipped) */}
              {isFlipped && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: '10px',
                    maxWidth: '680px',
                    width: '100%',
                  }}
                >
                  {[
                    { rating: 0, label: '0: Blackout', color: '#ef4444' },
                    { rating: 1, label: '1: Wrong', color: '#f87171' },
                    { rating: 2, label: '2: Hard', color: '#f59e0b' },
                    { rating: 3, label: '3: Passed', color: '#38bdf8' },
                    { rating: 4, label: '4: Good', color: '#34d399' },
                    { rating: 5, label: '5: Perfect', color: '#10b981' },
                  ].map((btn) => (
                    <button
                      key={btn.rating}
                      onClick={() => handleReviewRating(btn.rating)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        borderColor: btn.color,
                        color: btn.color,
                        fontWeight: 700,
                        padding: '10px 4px',
                        fontSize: '0.75rem',
                      }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎉</div>
              <h3>Zero cards due for review!</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
                Your spaced repetition schedule is completely up to date. Total active flashcards: {allCards.length}.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: FEYNMAN TECHNIQUE SIMULATOR ─────────────────────────────── */}
      {activeTab === 'feynman' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
          {/* Explanation Form */}
          <form onSubmit={handleEvaluateFeynman} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Explain Concept Simply</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                "If you can't explain it simply, you don't understand it well enough." — Richard Feynman
              </p>
            </div>

            <div className="form-group">
              <label className="label">Target Concept</label>
              <input
                type="text"
                className="input"
                required
                value={feynmanConcept}
                onChange={(e) => setFeynmanConcept(e.target.value)}
                placeholder="e.g. Asymmetric Cryptography, Pointers, Deadlocks"
              />
            </div>

            <div className="form-group">
              <label className="label">
                Your Intuitive Explanation <span style={{ color: 'var(--color-accent)' }}>(Avoid technical buzzwords)</span>
              </label>
              <textarea
                className="textarea"
                rows={7}
                required
                value={feynmanExplanation}
                onChange={(e) => setFeynmanExplanation(e.target.value)}
                placeholder="Write an explanation using an everyday analogy so someone without an engineering degree understands."
              />
            </div>

            <button type="submit" disabled={feynmanLoading} className="btn btn-primary">
              {feynmanLoading ? 'Analyzing Clarity...' : '🔬 Evaluate with Feynman Jargon Diagnostic ➔'}
            </button>
          </form>

          {/* Diagnostic Evaluation Card */}
          <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Feynman Diagnostic Results</h2>

            {feynmanResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Clarity Score Gauge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    background: 'var(--color-bg-elevated)',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '2rem',
                      fontWeight: 800,
                      color: feynmanResult.clarityScore >= 80 ? '#10b981' : '#f59e0b',
                    }}
                  >
                    {feynmanResult.clarityScore}/100
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Clarity & Intuition Score</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      {feynmanResult.clarityScore >= 80 ? 'Highly accessible analogy' : 'Needs reduction in technical terminology'}
                    </div>
                  </div>
                </div>

                {/* Jargon check */}
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Jargon Detected:
                  </div>
                  {feynmanResult.jargonDetected && feynmanResult.jargonDetected.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {feynmanResult.jargonDetected.map((j, idx) => (
                        <span key={idx} className="badge badge-danger">
                          ⚠️ {j}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="badge badge-success">✓ Zero ungrounded jargon detected!</span>
                  )}
                </div>

                {/* Strengths */}
                <div style={{ fontSize: '0.8125rem' }}>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>Strengths: </span>
                  <span style={{ color: 'var(--color-text-primary)' }}>{feynmanResult.strengths}</span>
                </div>

                {/* Advice */}
                <div
                  style={{
                    background: 'rgba(6, 182, 212, 0.08)',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--color-accent)', marginBottom: '4px' }}>
                    Feynman Suggestion:
                  </div>
                  <div style={{ color: 'var(--color-text-primary)' }}>{feynmanResult.advice}</div>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '40px 0' }}>
                Submit an explanation on the left to receive automated jargon detection and intuitive clarity analysis.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
