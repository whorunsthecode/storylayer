'use client';

import { useMemo, useState } from 'react';
import type {
  DataSource,
  Facet,
  GenerateResult,
  ListenerRole,
  StorytellerRole,
} from '@/lib/types/pitch';
import { pickRegister } from '@/lib/logic/pick-register';
import {
  STORYTELLER_OPTIONS,
  LISTENER_OPTIONS,
  REGISTER_LABEL,
  ARCHETYPE_LABEL,
  OC_LABEL,
  FORMAT_LABEL,
  FACET_LABELS,
} from '@/lib/labels';
import { getStubReason } from '@/lib/logic/pick-format';

interface DemoData {
  knownName?: string;
  sources: DataSource[];
}

export function Workspace() {
  const [storytellerRole, setStorytellerRole] = useState<StorytellerRole>('applicant');
  const [listenerRole, setListenerRole] = useState<ListenerRole>('startup');
  const [sources, setSources] = useState<DataSource[]>([]);
  const [knownName, setKnownName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [editedFacets, setEditedFacets] = useState<Facet[]>([]);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const previewRegister = pickRegister(storytellerRole, listenerRole);

  const canGenerate = sources.length > 0 && !loading;

  const stubReason = useMemo(
    () => (result ? getStubReason(result.outstandingCharacteristic) : null),
    [result]
  );

  const addSource = (type: 'url' | 'text') => {
    setSources((prev) => [
      ...prev,
      type === 'url'
        ? { type: 'url', label: 'Personal URL', url: '' }
        : { type: 'text', label: 'LinkedIn About', content: '' },
    ]);
  };

  const updateSource = (idx: number, patch: Partial<DataSource>) => {
    setSources((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const removeSource = (idx: number) => {
    setSources((prev) => prev.filter((_, i) => i !== idx));
  };

  const loadDemo = async () => {
    try {
      const res = await fetch('/api/demo-data');
      const demo = (await res.json()) as DemoData;
      setSources(demo.sources);
      setKnownName(demo.knownName ?? '');
      setStorytellerRole('applicant');
      setListenerRole('startup');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load demo');
    }
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setEditedFacets([]);
    setShareUrl(null);
    const stages = [
      'stripping identity (name → "the Person", pronouns neutralised)',
      'fetching URLs and aggregating corpus',
      'Layer 2 · detecting archetype + outstanding characteristic',
      'Layer 3 · extracting facets and edges',
      'Layer 5 · picking output format from the strength',
    ];
    let stageIdx = 0;
    setProgress(stages[0]);
    const tick = setInterval(() => {
      stageIdx = Math.min(stageIdx + 1, stages.length - 1);
      setProgress(stages[stageIdx]);
    }, 3500);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sources, storytellerRole, listenerRole, knownName }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (Array.isArray(data.sources)) {
          const failed = data.sources
            .filter((s: { ok: boolean }) => !s.ok)
            .map((s: { label: string; reason?: string }) => `· ${s.label}: ${s.reason ?? 'unknown'}`)
            .join('\n');
          throw new Error(`${data.error}\n${failed}`);
        }
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setResult(data as GenerateResult);
      setEditedFacets((data as GenerateResult).facets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      clearInterval(tick);
      setProgress('');
      setLoading(false);
    }
  };

  const regenerateFacet = async (facetId: string) => {
    if (!result) return;
    setRegenerating(facetId);
    try {
      const res = await fetch('/api/regenerate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sources,
          storytellerRole,
          listenerRole,
          register: result.register,
          archetype: result.archetype,
          outstandingCharacteristic: result.outstandingCharacteristic,
          focusFacet: facetId,
          knownName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      const updated = data.facet as Facet;
      setEditedFacets((prev) =>
        prev.map((f) => (f.id === updated.id ? updated : f))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Regenerate failed');
    } finally {
      setRegenerating(null);
    }
  };

  const updateFacet = (id: string, patch: Partial<Facet>) => {
    setEditedFacets((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...patch } : f))
    );
  };

  const share = async () => {
    if (!result) return;
    setSharing(true);
    try {
      const body = {
        storytellerRole,
        listenerRole,
        register: result.register,
        archetype: result.archetype,
        outstandingCharacteristic: result.outstandingCharacteristic,
        format: result.format,
        reasoning: result.reasoning,
        facets: editedFacets,
        edges: result.edges,
      };
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      const fullUrl = `${window.location.origin}${data.url}`;
      setShareUrl(fullUrl);
      try {
        await navigator.clipboard.writeText(fullUrl);
      } catch {
        /* clipboard may be blocked */
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Share failed');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="page">
      <header className="header">
        <div className="brand">
          <div className="brand-mark" />
          <div className="brand-name">
            Pitch <em>Workspace</em>
          </div>
        </div>
        <div className="header-status">
          <span className="status-dot" />
          <span>identity-stripped · craft mode</span>
        </div>
      </header>

      <div className="hero">
        <h1 className="hero-line">
          Tell your story <em>through who&rsquo;s listening.</em>
        </h1>
        <div className="hero-sub">
          Five layers · agent picks register, archetype, format · viewer picks facets
        </div>
      </div>

      {/* SECTION 01 — context */}
      <section className="section">
        <div className="section-head">
          <div className="section-num-and-title">
            <span className="section-num">01 /</span>
            <h2 className="section-title">
              Context — <em>who&rsquo;s pitching to whom</em>
            </h2>
          </div>
        </div>

        <div className="context-grid">
          <div>
            <label className="field-label">Storyteller relates as</label>
            <div className="select-wrap">
              <select
                className="select"
                value={storytellerRole}
                onChange={(e) => setStorytellerRole(e.target.value as StorytellerRole)}
              >
                {STORYTELLER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="arrow-glyph">→</div>

          <div>
            <label className="field-label">Listener relates as</label>
            <div className="select-wrap">
              <select
                className="select"
                value={listenerRole}
                onChange={(e) => setListenerRole(e.target.value as ListenerRole)}
              >
                {LISTENER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="preview-row">
          <span className="preview-label">Register lock</span>
          <span className="pill">
            {storytellerRole} → {listenerRole} &nbsp;·&nbsp; {REGISTER_LABEL[previewRegister]}
          </span>
        </div>
      </section>

      {/* SECTION 02 — sources */}
      <section className="section">
        <div className="section-head">
          <div className="section-num-and-title">
            <span className="section-num">02 /</span>
            <h2 className="section-title">
              Data sources — <em>your story, in your own words</em>
            </h2>
          </div>
          <button className="secondary-btn" onClick={loadDemo} type="button">
            ↓ Load demo data
          </button>
        </div>

        {sources.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-text">
              no sources yet — paste a URL or your LinkedIn About
            </span>
            <button
              className="add-source-btn"
              onClick={() => addSource('text')}
              type="button"
            >
              + add source
            </button>
          </div>
        ) : (
          <>
            <div className="source-list">
              {sources.map((s, i) => (
                <div key={i} className="source-row">
                  <select
                    className="source-select"
                    value={s.type}
                    onChange={(e) =>
                      updateSource(i, {
                        type: e.target.value as 'url' | 'text',
                        url: '',
                        content: '',
                      })
                    }
                  >
                    <option value="url">URL</option>
                    <option value="text">Text</option>
                  </select>
                  <input
                    className="source-input"
                    placeholder="Label"
                    value={s.label}
                    onChange={(e) => updateSource(i, { label: e.target.value })}
                  />
                  {s.type === 'url' ? (
                    <input
                      className="source-input"
                      placeholder="https://example.com"
                      value={s.url ?? ''}
                      onChange={(e) => updateSource(i, { url: e.target.value })}
                    />
                  ) : (
                    <textarea
                      className="source-input text-area"
                      placeholder="Paste content here…"
                      value={s.content ?? ''}
                      onChange={(e) => updateSource(i, { content: e.target.value })}
                    />
                  )}
                  <div className="source-row-actions">
                    <button
                      className="icon-btn"
                      type="button"
                      aria-label="Remove source"
                      onClick={() => removeSource(i)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="add-source-row">
              <button
                className="secondary-btn"
                type="button"
                onClick={() => addSource('url')}
              >
                + URL
              </button>
              <button
                className="secondary-btn"
                type="button"
                onClick={() => addSource('text')}
              >
                + Text
              </button>
              <input
                className="source-input"
                style={{ flex: 1, minWidth: 200 }}
                placeholder="Storyteller's name (optional, used for identity-stripping)"
                value={knownName}
                onChange={(e) => setKnownName(e.target.value)}
              />
            </div>
          </>
        )}
      </section>

      {/* GENERATE ROW */}
      <div className="generate-row">
        <div className="generate-meta">
          <span className="generate-meta-num">5</span> layers · identity stripped before any LLM call
        </div>
        <button
          className="generate-btn"
          disabled={!canGenerate}
          onClick={generate}
          type="button"
        >
          {loading ? 'Generating…' : 'Generate pitch'}
          <span className="generate-btn-arrow">→</span>
        </button>
      </div>

      {loading && progress && (
        <div
          className="agent-peek"
          style={{ marginTop: 16, opacity: 0.85 }}
        >
          <div className="agent-peek-label">working</div>
          <div
            style={{
              fontFamily: 'var(--body-font)',
              fontSize: 14,
              color: 'var(--ink-soft)',
            }}
          >
            {progress}
          </div>
        </div>
      )}

      {error && <div className="error-banner" style={{ whiteSpace: 'pre-wrap' }}>{error}</div>}

      {/* AGENT PEEK */}
      {result && (
        <div className="agent-peek">
          <div className="agent-peek-label">Agent rationale</div>
          <div className="agent-peek-title">
            Picked the <em>{FORMAT_LABEL[result.format]}</em> format.
          </div>
          <div className="agent-peek-detail">{result.reasoning}</div>
          <div className="agent-peek-meta">
            <span>
              <span className="agent-peek-meta-key">register</span>&nbsp;{' '}
              {REGISTER_LABEL[result.register]}
            </span>
            <span>
              <span className="agent-peek-meta-key">archetype</span>&nbsp;{' '}
              {ARCHETYPE_LABEL[result.archetype]}
            </span>
            <span>
              <span className="agent-peek-meta-key">outstanding</span>&nbsp;{' '}
              {OC_LABEL[result.outstandingCharacteristic]}
            </span>
            <span>
              <span className="agent-peek-meta-key">format</span>&nbsp;{' '}
              {FORMAT_LABEL[result.format]}
            </span>
          </div>
          {stubReason && (
            <div
              style={{
                marginTop: 12,
                fontFamily: 'var(--mono-font)',
                fontSize: 11,
                color: 'var(--muted)',
              }}
            >
              agent considered <strong>{FORMAT_LABEL[stubReason.ideal]}</strong> · falling back to{' '}
              <strong>{FORMAT_LABEL[stubReason.fallback]}</strong> for v1
            </div>
          )}
        </div>
      )}

      {/* FACET CARDS */}
      {result && editedFacets.length > 0 && (
        <section className="section" style={{ marginTop: 24 }}>
          <div className="section-head">
            <div className="section-num-and-title">
              <span className="section-num">03 /</span>
              <h2 className="section-title">
                Facets — <em>edit inline · regenerate per card</em>
              </h2>
            </div>
          </div>

          <div className="facet-cards">
            {editedFacets.map((f) => (
              <article key={f.id} className="facet-card">
                <div className="facet-card-id">{FACET_LABELS[f.id]}</div>
                <input
                  className="facet-card-title"
                  value={f.title}
                  onChange={(e) => updateFacet(f.id, { title: e.target.value })}
                />
                <textarea
                  className="facet-card-content"
                  value={f.content}
                  onChange={(e) => updateFacet(f.id, { content: e.target.value })}
                />
                <div className="facet-card-actions">
                  <button
                    className={`icon-btn ${regenerating === f.id ? 'spinning' : ''}`}
                    type="button"
                    title="Regenerate this facet"
                    aria-label="Regenerate"
                    disabled={regenerating !== null}
                    onClick={() => regenerateFacet(f.id)}
                  >
                    ↻
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="share-bar">
            <div>
              <div
                style={{
                  fontFamily: 'var(--mono-font)',
                  fontSize: 11,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                ready to share
              </div>
              <div style={{ fontFamily: 'var(--display-font)', fontSize: 18, marginTop: 4 }}>
                {editedFacets.length} facets · {result.edges.length} edges · {FORMAT_LABEL[result.format]}
              </div>
            </div>
            {shareUrl ? (
              <>
                <a className="share-link" href={shareUrl} target="_blank" rel="noreferrer">
                  {shareUrl}
                </a>
                <button className="add-source-btn" onClick={() => navigator.clipboard.writeText(shareUrl)} type="button">
                  Copy link
                </button>
              </>
            ) : (
              <button
                className="generate-btn"
                onClick={share}
                disabled={sharing}
                type="button"
              >
                {sharing ? 'Sharing…' : 'Share →'}
              </button>
            )}
          </div>
        </section>
      )}

      <footer className="footer">
        <span>pitch.workspace · v0.1</span>
        <span>
          <span className="footer-accent">●</span>&nbsp; identity-stripped · 5-layer logic ·
          gemini 2.5
        </span>
      </footer>
    </div>
  );
}
