import type { PipelineEvent } from '@/lib/hooks/useIntentPipeline';

const STEP_LABELS: Record<string, string> = {
  parse_intent: 'Parsing your intent',
  reasoning: 'Selecting facets · grounding in evidence',
  finalizing: 'Composing the final view',
};

export function ThinkingTrace({
  events,
  running,
}: {
  events: PipelineEvent[];
  running: boolean;
}) {
  if (events.length === 0 && !running) return null;

  return (
    <div className="thinking-trace">
      <div className="trace-header">
        <span className="trace-label">→ agent pipeline</span>
        {running && <span className="trace-pulse">●</span>}
      </div>
      <ul className="trace-list">
        {events.map((e, i) => {
          if (e.type === 'step') {
            return (
              <li key={i} className="trace-item trace-step">
                <span className="trace-marker">▸</span>
                <span className="trace-text">{STEP_LABELS[e.step] ?? e.message}</span>
              </li>
            );
          }
          if (e.type === 'tool_call') {
            return (
              <li key={i} className="trace-item trace-tool-call">
                <span className="trace-marker">⟶</span>
                <span className="trace-text">
                  <code>{e.name}</code> for <strong>{e.args.facetId}</strong>
                  <span className="trace-sub">
                    searching: &ldquo;{e.args.searchTerms}&rdquo;
                  </span>
                </span>
              </li>
            );
          }
          if (e.type === 'tool_result') {
            return (
              <li key={i} className="trace-item trace-tool-result">
                <span className="trace-marker">←</span>
                <span className="trace-text">
                  found <strong>{e.quoteCount}</strong>{' '}
                  {e.quoteCount === 1 ? 'quote' : 'quotes'} for {e.facetId}
                  <span className={`trace-relevance trace-relevance-${e.topRelevance}`}>
                    {e.topRelevance}
                  </span>
                </span>
              </li>
            );
          }
          if (e.type === 'error') {
            return (
              <li key={i} className="trace-item trace-error">
                <span className="trace-marker">✕</span>
                <span className="trace-text">{e.message}</span>
              </li>
            );
          }
          return null;
        })}
      </ul>
    </div>
  );
}
