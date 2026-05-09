'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CopilotKit, useCopilotReadable } from '@copilotkit/react-core';
import type { Pitch, Facet } from '@/lib/types/pitch';
import { REGISTER_LABEL, ARCHETYPE_LABEL, OC_LABEL, FACET_LABELS } from '@/lib/labels';
import type { PullAction, PullResponse } from '@/lib/schemas/pull';
import { PullActions } from './PullActions';
import { FacetCardComponent } from './components/FacetCard';
import { ChapterSpread } from './components/ChapterSpread';
import { QuoteManifesto } from './components/QuoteManifesto';
import { MetricGrid } from './components/MetricGrid';
import { TimelineStrip } from './components/TimelineStrip';
import { SkillConstellation } from './components/SkillConstellation';
import { NodeGraphFacet } from './components/NodeGraphFacet';

interface PullThread {
  id: string;
  action: PullAction;
  loading: boolean;
  facet?: Facet; // populated when the agent returns; same shape as a Facet so render code is shared
  error?: string;
}

const REVEAL_INTERVAL_MS = 5000;

export function PublicPitchView({ pitch }: { pitch: Pitch }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <ListenerView pitch={pitch} />
    </CopilotKit>
  );
}

function ListenerView({ pitch }: { pitch: Pitch }) {
  // Sort facets by weight: hero → feature → supporting
  const orderedFacets = useMemo(() => {
    const order: Record<string, number> = { hero: 0, feature: 1, supporting: 2 };
    return [...pitch.facets].sort(
      (a, b) => (order[a.weight ?? 'supporting'] ?? 9) - (order[b.weight ?? 'supporting'] ?? 9)
    );
  }, [pitch.facets]);

  const totalLayers = orderedFacets.length;
  const [revealed, setRevealed] = useState(1); // start with hero only
  const dwellRef = useRef<NodeJS.Timeout | null>(null);

  // Pull-thread state, keyed by originating facet id
  const [threads, setThreads] = useState<Record<string, PullThread[]>>({});
  const [anyBusy, setAnyBusy] = useState(false);

  // Expose the listener's current state to CopilotKit's runtime so the protocol is engaged
  useCopilotReadable({
    description:
      'The listener-view state of a Storylayer pitch. Tracks which facets are currently revealed and any pull-thread components that the listener has gestured into.',
    value: {
      pitchId: pitch.id,
      relationship: `${pitch.storytellerRole} → ${pitch.listenerRole}`,
      register: pitch.register,
      archetype: pitch.archetype,
      outstandingCharacteristic: pitch.outstandingCharacteristic,
      revealedFacetIds: orderedFacets.slice(0, revealed).map((f) => f.id),
      remainingLayers: Math.max(totalLayers - revealed, 0),
      threadCounts: Object.fromEntries(
        Object.entries(threads).map(([k, v]) => [k, v.length])
      ),
    },
  });

  // Auto-reveal next layer every REVEAL_INTERVAL_MS until all surfaced
  useEffect(() => {
    if (revealed >= totalLayers) return;
    if (dwellRef.current) clearTimeout(dwellRef.current);
    dwellRef.current = setTimeout(() => {
      setRevealed((r) => Math.min(r + 1, totalLayers));
    }, REVEAL_INTERVAL_MS);
    return () => {
      if (dwellRef.current) clearTimeout(dwellRef.current);
    };
  }, [revealed, totalLayers]);

  const revealNext = useCallback(() => {
    if (dwellRef.current) clearTimeout(dwellRef.current);
    setRevealed((r) => Math.min(r + 1, totalLayers));
  }, [totalLayers]);

  const handlePull = useCallback(
    async (facetId: string, action: PullAction) => {
      const threadId = `${facetId}-${action}-${Date.now()}`;
      setAnyBusy(true);
      setThreads((prev) => ({
        ...prev,
        [facetId]: [...(prev[facetId] ?? []), { id: threadId, action, loading: true }],
      }));
      try {
        const res = await fetch('/api/pull', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ pitchId: pitch.id, facetId, action }),
        });
        const data = (await res.json()) as { component?: PullResponse; error?: string };
        if (!res.ok || !data.component) {
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }
        // Promote PullResponse to Facet shape for rendering reuse
        const threadFacet: Facet = {
          id: facetId as Facet['id'],
          title: data.component.title,
          content: data.component.content,
          componentType: data.component.componentType,
          weight: 'supporting',
          span: 'full',
          emphasis: data.component.emphasis,
          metrics: data.component.metrics,
          events: data.component.events,
          nodes: data.component.nodes,
          connections: data.component.connections,
          skills: data.component.skills,
          quote: data.component.quote,
          eyebrow: data.component.eyebrow,
        };
        setThreads((prev) => ({
          ...prev,
          [facetId]: (prev[facetId] ?? []).map((t) =>
            t.id === threadId ? { ...t, loading: false, facet: threadFacet } : t
          ),
        }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Pull failed';
        setThreads((prev) => ({
          ...prev,
          [facetId]: (prev[facetId] ?? []).map((t) =>
            t.id === threadId ? { ...t, loading: false, error: msg } : t
          ),
        }));
      } finally {
        setAnyBusy(false);
      }
    },
    [pitch.id]
  );

  const visible = orderedFacets.slice(0, revealed);
  const progressPct = Math.round((revealed / Math.max(totalLayers, 1)) * 100);
  const allRevealed = revealed >= totalLayers;

  return (
    <div className={`register-${pitch.register}`}>
      <div className="pv-shell pv-listener">
        <header className="pv-sticky-header">
          <div className="pv-header-row">
            <div className="pv-brand">
              Pitch <em>·</em> {pitch.storytellerRole} → {pitch.listenerRole}
            </div>
            <div className="pv-meta">
              <span><span className="pv-meta-key">register</span>&nbsp; {REGISTER_LABEL[pitch.register]}</span>
              <span><span className="pv-meta-key">archetype</span>&nbsp; {ARCHETYPE_LABEL[pitch.archetype]}</span>
              <span><span className="pv-meta-key">standout</span>&nbsp; {OC_LABEL[pitch.outstandingCharacteristic]}</span>
            </div>
          </div>
          <div className="pv-progress" aria-hidden>
            <div className="pv-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </header>

        <div className="pv-flow">
          {visible.map((f) => (
            <FacetWithPulls
              key={f.id}
              facet={f}
              threads={threads[f.id] ?? []}
              busyAny={anyBusy}
              onPull={(action) => handlePull(f.id, action)}
            />
          ))}
        </div>

        <div className="pv-reveal-bar">
          {allRevealed ? (
            <span className="pv-reveal-done">
              ✦ Full story revealed — pull any facet to go deeper
            </span>
          ) : (
            <button type="button" className="pv-reveal-btn" onClick={revealNext}>
              Show me more <span className="pv-reveal-arrow">→</span>
              <span className="pv-reveal-count">
                {revealed} / {totalLayers}
              </span>
            </button>
          )}
        </div>

        <footer className="footer" style={{ marginTop: 64 }}>
          <span>same link · different listener · different story</span>
          <span>
            <span className="footer-accent">●</span>&nbsp; identity-stripped · agent composes ·
            CopilotKit runtime
          </span>
        </footer>
      </div>
    </div>
  );
}

function FacetWithPulls({
  facet,
  threads,
  busyAny,
  onPull,
}: {
  facet: Facet;
  threads: PullThread[];
  busyAny: boolean;
  onPull: (action: PullAction) => void;
}) {
  const isFullSpan = facet.span === 'full' || facet.weight === 'hero';
  const busyAction = threads.find((t) => t.loading)?.action ?? null;

  return (
    <section
      className={`pv-row ${isFullSpan ? 'pv-row-full' : 'pv-row-half'}`}
      data-weight={facet.weight}
    >
      <div className="pv-facet-block">
        {facet.weight === 'hero' && (
          <div className="pv-hero-eyebrow">
            <span className="pv-hero-tag">hero · {FACET_LABELS[facet.id]}</span>
            {facet.emphasis && (
              <span className="pv-hero-emphasis">↗ {facet.emphasis}</span>
            )}
          </div>
        )}
        {renderFacet(facet)}
        <PullActions facetId={facet.id} busyAction={busyAction} anyBusy={busyAny} onPull={onPull} />
        {threads.length > 0 && (
          <div className="pv-thread-stack">
            {threads.map((t) => (
              <div key={t.id} className="pv-thread">
                <div className="pv-thread-line" />
                <div className="pv-thread-eyebrow">
                  <span className="pv-thread-action">↳ {labelForAction(t.action)}</span>
                </div>
                {t.loading && (
                  <div className="pv-thread-loading">agent is composing the thread…</div>
                )}
                {t.error && (
                  <div className="pv-thread-error">pull failed: {t.error}</div>
                )}
                {t.facet && renderFacet(t.facet)}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

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

function labelForAction(a: PullAction): string {
  return {
    'dig-deeper': 'Dig deeper',
    'show-proof': 'Show proof',
    'what-made-this': 'What made this',
    'connect-it': 'Connect it',
  }[a];
}
