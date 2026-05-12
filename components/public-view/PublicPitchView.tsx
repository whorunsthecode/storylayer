'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CopilotKit, useCopilotReadable } from '@copilotkit/react-core';
import type { Pitch, Facet, FacetId } from '@/lib/types/pitch';
import { REGISTER_LABEL, ARCHETYPE_LABEL, OC_LABEL, FACET_LABELS } from '@/lib/labels';
import type { PullAction, PullResponse } from '@/lib/schemas/pull';
import { PullActions } from './PullActions';
import { IntentOnboarding } from './IntentOnboarding';
import { ListenerRationale } from './ListenerRationale';
import { ThinkingTrace } from './ThinkingTrace';
import { RemixBar } from './RemixBar';
import { useIntentPipeline } from '@/lib/hooks/useIntentPipeline';
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
  facet?: Facet;
  error?: string;
}

const REVEAL_INTERVAL_MS = 5000;

export function PublicPitchView({ pitch }: { pitch: Pitch }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <ListenerRoot pitch={pitch} />
    </CopilotKit>
  );
}

function ListenerRoot({ pitch }: { pitch: Pitch }) {
  const { events, result, running, error, run } = useIntentPipeline(pitch.id);
  const [phase, setPhase] = useState<'intent' | 'pipeline' | 'rendered'>('intent');

  const handleIntent = (text: string) => {
    setPhase('pipeline');
    run(text).then(() => setPhase('rendered'));
  };

  if (phase === 'intent') {
    return <IntentOnboarding pitch={pitch} onSubmit={handleIntent} externalError={null} />;
  }

  if (phase === 'pipeline' || (running && !result)) {
    return (
      <div className={`register-${pitch.register}`}>
        <div className="pv-shell pv-pipeline-stage">
          <div className="pv-pipeline-header">
            <div className="pv-brand">
              Story<em>layer</em> · {pitch.storytellerRole} → {pitch.listenerRole}
            </div>
            <span className="pv-pipeline-eyebrow">agent at work · live trace below</span>
          </div>
          <ThinkingTrace events={events} running={running} />
          {error && <div className="error-banner" style={{ marginTop: 18 }}>{error}</div>}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className={`register-${pitch.register}`}>
        <div className="pv-shell">
          <div className="error-banner">{error ?? 'pipeline returned no result'}</div>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => setPhase('intent')}
            style={{ marginTop: 16 }}
          >
            Try again →
          </button>
        </div>
      </div>
    );
  }

  return (
    <ListenerView
      pitch={pitch}
      result={result}
      events={events}
      onRemix={async (text) => {
        setPhase('pipeline');
        await run(text);
        setPhase('rendered');
      }}
      remixing={running}
    />
  );
}

function ListenerView({
  pitch,
  result,
  events,
  onRemix,
  remixing,
}: {
  pitch: Pitch;
  result: { selectedFacetIds: string[]; reasoning: string; evidence: Record<string, string[]> };
  events: ReturnType<typeof useIntentPipeline>['events'];
  onRemix: (text: string) => Promise<void>;
  remixing: boolean;
}) {
  const orderedFacets = useMemo(() => {
    const order: Record<string, number> = { hero: 0, feature: 1, supporting: 2 };
    const picked = new Set(result.selectedFacetIds);
    return pitch.facets
      .filter((f) => picked.has(f.id))
      .sort(
        (a, b) =>
          (order[a.weight ?? 'supporting'] ?? 9) -
          (order[b.weight ?? 'supporting'] ?? 9)
      );
  }, [pitch.facets, result.selectedFacetIds]);

  const totalLayers = orderedFacets.length;
  const [revealed, setRevealed] = useState(1);
  const dwellRef = useRef<NodeJS.Timeout | null>(null);

  const [threads, setThreads] = useState<Record<string, PullThread[]>>({});
  const [anyBusy, setAnyBusy] = useState(false);
  const [traceCollapsed, setTraceCollapsed] = useState(false);

  // Reset reveal on resolution change
  useEffect(() => {
    setRevealed(1);
    setThreads({});
    setTraceCollapsed(false);
  }, [result]);

  useCopilotReadable({
    description:
      'The listener-view state of a Storylayer pitch. Tracks the listener intent, agent-picked facets with evidence, current reveal, and any pull-thread components.',
    value: {
      pitchId: pitch.id,
      relationship: `${pitch.storytellerRole} → ${pitch.listenerRole}`,
      register: pitch.register,
      archetype: pitch.archetype,
      outstandingCharacteristic: pitch.outstandingCharacteristic,
      listenerReasoning: result.reasoning,
      pickedFacetIds: result.selectedFacetIds,
      evidenceCounts: Object.fromEntries(
        Object.entries(result.evidence).map(([k, v]) => [k, v.length])
      ),
      revealedFacetIds: orderedFacets.slice(0, revealed).map((f) => f.id),
      remainingLayers: Math.max(totalLayers - revealed, 0),
      threadCounts: Object.fromEntries(
        Object.entries(threads).map(([k, v]) => [k, v.length])
      ),
    },
  });

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
  const selected = result.selectedFacetIds as FacetId[];

  return (
    <div className={`register-${pitch.register}`}>
      <div className="pv-shell pv-listener">
        <header className="pv-sticky-header">
          <div className="pv-header-row">
            <div className="pv-brand">
              Story<em>layer</em> · {pitch.storytellerRole} → {pitch.listenerRole}
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

        <ListenerRationale
          reasoning={result.reasoning}
          selected={selected}
          totalAvailable={pitch.facets.length}
        />

        {!traceCollapsed && events.length > 0 && (
          <div className="pv-trace-wrap">
            <ThinkingTrace events={events} running={false} />
            <button
              type="button"
              className="pv-trace-toggle"
              onClick={() => setTraceCollapsed(true)}
            >
              hide trace
            </button>
          </div>
        )}
        {traceCollapsed && (
          <button
            type="button"
            className="pv-trace-toggle pv-trace-show"
            onClick={() => setTraceCollapsed(false)}
          >
            ↳ show agent pipeline
          </button>
        )}

        <div className="pv-flow">
          {visible.map((f) => (
            <FacetWithPulls
              key={f.id}
              facet={f}
              evidence={result.evidence[f.id] ?? []}
              threads={threads[f.id] ?? []}
              busyAny={anyBusy}
              onPull={(action) => handlePull(f.id, action)}
            />
          ))}
        </div>

        <div className="pv-reveal-bar">
          {allRevealed ? (
            <span className="pv-reveal-done">
              ✦ Full story revealed — pull any facet to go deeper, or remix below
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

        <RemixBar busy={remixing} onRemix={onRemix} />

        <footer className="footer" style={{ marginTop: 64 }}>
          <span>same link · different listener · different page</span>
          <span>
            <span className="footer-accent">●</span>&nbsp; identity-stripped · streaming pipeline ·
            tool-grounded
          </span>
        </footer>
      </div>
    </div>
  );
}

function FacetWithPulls({
  facet,
  evidence,
  threads,
  busyAny,
  onPull,
}: {
  facet: Facet;
  evidence: string[];
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
            {facet.emphasis && <span className="pv-hero-emphasis">↗ {facet.emphasis}</span>}
          </div>
        )}
        {renderFacet(facet)}
        {evidence.length > 0 && (
          <div className="facet-evidence">
            <div className="facet-evidence-label">→ from corpus · agent-grounded</div>
            {evidence.map((quote, i) => (
              <blockquote key={i} className="facet-evidence-quote">
                {quote}
              </blockquote>
            ))}
          </div>
        )}
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
                {t.error && <div className="pv-thread-error">pull failed: {t.error}</div>}
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
