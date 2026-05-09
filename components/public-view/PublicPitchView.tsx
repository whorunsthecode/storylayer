'use client';

import { useMemo, useState } from 'react';
import type { Pitch, FacetId } from '@/lib/types/pitch';
import { filterByViewer } from '@/lib/logic/filter-facets';
import {
  REGISTER_LABEL,
  ARCHETYPE_LABEL,
  OC_LABEL,
  FORMAT_LABEL,
  FACET_LABELS,
} from '@/lib/labels';
import { CardsGrid } from './formats/CardsGrid';
import { NodeGraph } from './formats/NodeGraph';
import { Magazine } from './formats/Magazine';
import { Timeline } from './formats/Timeline';

const MIN_PICKS = 2;
const MAX_PICKS = 4;

export function PublicPitchView({ pitch }: { pitch: Pitch }) {
  const [selected, setSelected] = useState<FacetId[] | null>(null);

  const availableFacetIds = useMemo(
    () => pitch.facets.map((f) => f.id),
    [pitch]
  );

  if (selected === null) {
    return <Onboarding pitch={pitch} onConfirm={setSelected} />;
  }

  const filtered = filterByViewer(pitch.facets, pitch.edges, selected);

  return (
    <div className={`register-${pitch.register}`}>
      <div className="pv-shell">
        <header className="pv-header">
          <div className="pv-brand">
            Pitch <em>·</em> {pitch.storytellerRole} → {pitch.listenerRole}
          </div>
          <div className="pv-meta">
            <span><span className="pv-meta-key">register</span>&nbsp; {REGISTER_LABEL[pitch.register]}</span>
            <span><span className="pv-meta-key">archetype</span>&nbsp; {ARCHETYPE_LABEL[pitch.archetype]}</span>
            <span><span className="pv-meta-key">format</span>&nbsp; {FORMAT_LABEL[pitch.format]}</span>
          </div>
        </header>

        <div className="pv-toggle-bar">
          <span className="pv-toggle-label">facets</span>
          {availableFacetIds.map((id) => {
            const active = selected.includes(id);
            return (
              <button
                key={id}
                className={`pv-chip ${active ? 'active' : ''}`}
                type="button"
                onClick={() => {
                  setSelected((prev) =>
                    prev!.includes(id)
                      ? prev!.filter((x) => x !== id)
                      : [...prev!, id]
                  );
                }}
              >
                {FACET_LABELS[id]}
              </button>
            );
          })}
        </div>

        <div className="pv-agent-badge">
          outstanding: <strong>{OC_LABEL[pitch.outstandingCharacteristic]}</strong> &nbsp;·&nbsp; {pitch.reasoning}
        </div>

        <FormatRender pitch={pitch} facets={filtered.facets} edges={filtered.edges} />

        <footer className="footer" style={{ marginTop: 64 }}>
          <span>same link · different listener · different page</span>
          <span>
            <span className="footer-accent">●</span>&nbsp; identity-stripped · 5-layer logic
          </span>
        </footer>
      </div>
    </div>
  );
}

function FormatRender({
  pitch,
  facets,
  edges,
}: {
  pitch: Pitch;
  facets: Pitch['facets'];
  edges: Pitch['edges'];
}) {
  if (facets.length === 0) {
    return (
      <div className="format-stub">
        <div className="format-stub-title">Pick a few facets above to see this pitch.</div>
        <div className="format-stub-detail">filtering is rule-based · no LLM round-trip</div>
      </div>
    );
  }
  switch (pitch.format) {
    case 'cards-grid':
      return <CardsGrid facets={facets} edges={[]} />;
    case 'node-graph':
      return <NodeGraph facets={facets} edges={edges} register={pitch.register} />;
    case 'magazine':
      return <Magazine facets={facets} edges={[]} />;
    case 'timeline':
      return <Timeline facets={facets} edges={[]} />;
    default:
      // Stubbed format — show placeholder + cards-grid as the rendered fallback
      return (
        <>
          <div className="format-stub">
            <div className="format-stub-title">
              Agent considered the <em>{FORMAT_LABEL[pitch.format]}</em> format.
            </div>
            <div className="format-stub-detail">
              not built for v1 · rendering as cards-grid
            </div>
          </div>
          <CardsGrid facets={facets} edges={[]} />
        </>
      );
  }
}

function Onboarding({
  pitch,
  onConfirm,
}: {
  pitch: Pitch;
  onConfirm: (ids: FacetId[]) => void;
}) {
  const [picks, setPicks] = useState<FacetId[]>([]);
  const toggle = (id: FacetId) => {
    setPicks((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < MAX_PICKS
          ? [...prev, id]
          : prev
    );
  };
  const canConfirm = picks.length >= MIN_PICKS && picks.length <= MAX_PICKS;

  return (
    <div className={`register-${pitch.register}`}>
      <div className="pv-onboarding">
        <div className="pv-onboarding-eyebrow">
          a pitch shaped for you · {pitch.storytellerRole} → {pitch.listenerRole}
        </div>
        <h1 className="pv-onboarding-title">
          What do you want to know?
        </h1>
        <p className="pv-onboarding-sub">
          Pick {MIN_PICKS}–{MAX_PICKS} facets. The page renders only what you select — and you can change your mind anytime.
        </p>

        <div className="pv-facet-options">
          {pitch.facets.map((f) => {
            const active = picks.includes(f.id);
            return (
              <button
                key={f.id}
                type="button"
                className={`pv-chip ${active ? 'active' : ''}`}
                onClick={() => toggle(f.id)}
              >
                {FACET_LABELS[f.id]}
              </button>
            );
          })}
        </div>

        <div className="pv-facet-confirm">
          <span className="pv-facet-counter">
            {picks.length} / {MAX_PICKS} selected
          </span>
          <button
            type="button"
            className="generate-btn"
            disabled={!canConfirm}
            onClick={() => onConfirm(picks)}
          >
            See the pitch <span className="generate-btn-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
