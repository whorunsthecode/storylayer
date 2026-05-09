'use client';

import { useMemo, useState } from 'react';
import type { Pitch, FacetId, Facet } from '@/lib/types/pitch';
import {
  REGISTER_LABEL,
  ARCHETYPE_LABEL,
  OC_LABEL,
  FACET_LABELS,
} from '@/lib/labels';
import { FacetCardComponent } from './components/FacetCard';
import { ChapterSpread } from './components/ChapterSpread';
import { QuoteManifesto } from './components/QuoteManifesto';
import { MetricGrid } from './components/MetricGrid';
import { TimelineStrip } from './components/TimelineStrip';
import { SkillConstellation } from './components/SkillConstellation';
import { NodeGraphFacet } from './components/NodeGraphFacet';

const MIN_PICKS = 2;
const MAX_PICKS = 4;

// Components that take the full content width (no grid pairing).
const FULL_WIDTH: ReadonlySet<Facet['componentType']> = new Set([
  'node-graph',
  'quote-manifesto',
  'metric-grid',
  'timeline-strip',
]);

function renderFacet(facet: Facet) {
  switch (facet.componentType) {
    case 'node-graph':
      return <NodeGraphFacet facet={facet} />;
    case 'metric-grid':
      return <MetricGrid facet={facet} />;
    case 'timeline-strip':
      return <TimelineStrip facet={facet} />;
    case 'quote-manifesto':
      return <QuoteManifesto facet={facet} />;
    case 'skill-constellation':
      return <SkillConstellation facet={facet} />;
    case 'chapter-spread':
      return <ChapterSpread facet={facet} />;
    case 'facet-card':
    default:
      return <FacetCardComponent facet={facet} />;
  }
}

export function PublicPitchView({ pitch }: { pitch: Pitch }) {
  const [selected, setSelected] = useState<FacetId[] | null>(null);

  const availableFacetIds = useMemo(
    () => pitch.facets.map((f) => f.id),
    [pitch]
  );

  if (selected === null) {
    return <Onboarding pitch={pitch} onConfirm={setSelected} />;
  }

  const selectedSet = new Set(selected);
  const visible = pitch.facets.filter((f) => selectedSet.has(f.id));

  // Group consecutive small (non-full-width) facets into rows; full-width breaks rows.
  const rows: { type: 'full' | 'pair'; facets: Facet[] }[] = [];
  let pair: Facet[] = [];
  const flushPair = () => {
    if (pair.length > 0) {
      rows.push({ type: 'pair', facets: pair });
      pair = [];
    }
  };
  for (const f of visible) {
    if (FULL_WIDTH.has(f.componentType)) {
      flushPair();
      rows.push({ type: 'full', facets: [f] });
    } else {
      pair.push(f);
      if (pair.length === 2) flushPair();
    }
  }
  flushPair();

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
            <span><span className="pv-meta-key">outstanding</span>&nbsp; {OC_LABEL[pitch.outstandingCharacteristic]}</span>
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
          outstanding: <strong>{OC_LABEL[pitch.outstandingCharacteristic]}</strong> &nbsp;·&nbsp; {pitch.characteristicReasoning}
        </div>

        {visible.length === 0 ? (
          <div className="pv-empty-pick">pick a few facets above to see the pitch</div>
        ) : (
          <div className="pv-flow">
            {rows.map((row, i) =>
              row.type === 'full' ? (
                <div key={i} className="pv-row pv-row-full">
                  {renderFacet(row.facets[0])}
                </div>
              ) : (
                <div key={i} className="pv-row pv-row-pair">
                  {row.facets.map((f) => (
                    <div key={f.id} className="pv-row-cell">
                      {renderFacet(f)}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        <footer className="footer" style={{ marginTop: 64 }}>
          <span>same link · different listener · different page</span>
          <span>
            <span className="footer-accent">●</span>&nbsp; identity-stripped · agent assembles components per facet
          </span>
        </footer>
      </div>
    </div>
  );
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
        <h1 className="pv-onboarding-title">What do you want to know?</h1>
        <p className="pv-onboarding-sub">
          Pick {MIN_PICKS}–{MAX_PICKS} facets. The agent has already assembled each one
          into the component type that fits the content best.
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
                <span className="pv-chip-meta">· {f.componentType}</span>
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
