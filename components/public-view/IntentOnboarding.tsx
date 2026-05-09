'use client';

import { useState } from 'react';
import type { Pitch } from '@/lib/types/pitch';

interface Props {
  pitch: Pitch;
  onSubmit: (intent: string) => void;
  loading?: boolean;
  externalError?: string | null;
}

const SUGGESTIONS = [
  "I'm hiring an early PM and care about how fast they ship",
  'I want to understand their long-term thinking',
  "I'm a potential cofounder figuring out how they work",
  'I want to know what shaped them',
];

export function IntentOnboarding({ pitch, onSubmit, loading, externalError }: Props) {
  const [intent, setIntent] = useState('');
  const error = externalError ?? null;

  const submit = (text: string) => {
    if (!text.trim() || loading) return;
    onSubmit(text);
  };

  return (
    <div className={`register-${pitch.register} intent-overlay`}>
      <div className="intent-card">
        <div className="intent-eyebrow">
          a pitch · curated by listener intent · {pitch.storytellerRole} → {pitch.listenerRole}
        </div>
        <h1 className="intent-headline">
          What do you want to learn about <em>this person</em>?
        </h1>
        <p className="intent-sub">
          Tell the agent in your own words. It picks the facets that matter and renders the page for you, at view time.
        </p>

        <textarea
          className="intent-input"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder="e.g., I'm hiring an early PM and care about how fast they ship…"
          rows={3}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit(intent);
            }
          }}
        />

        <div className="intent-suggestions">
          <span className="intent-suggestions-label">try:</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className="intent-suggestion"
              disabled={loading}
              onClick={() => {
                setIntent(s);
                submit(s);
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {error && <div className="intent-error">{error}</div>}

        <button
          type="button"
          className="intent-submit"
          disabled={loading || !intent.trim()}
          onClick={() => submit(intent)}
        >
          {loading ? 'Agent reasoning…' : 'Render the page →'}
        </button>
      </div>
    </div>
  );
}
