'use client';

import { useCallback, useState } from 'react';

export type PipelineEvent =
  | { type: 'step'; step: string; message: string }
  | { type: 'tool_call'; name: string; args: { facetId?: string; searchTerms?: string }; iteration: number }
  | {
      type: 'tool_result';
      name: string;
      facetId: string;
      quoteCount: number;
      topRelevance: 'high' | 'medium' | 'low' | 'none';
    }
  | {
      type: 'result';
      selectedFacetIds: string[];
      reasoning: string;
      evidence: Record<string, string[]>;
    }
  | { type: 'error'; message: string };

export type PipelineResult = Extract<PipelineEvent, { type: 'result' }>;

export function useIntentPipeline(pitchId: string) {
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (intent: string) => {
      setEvents([]);
      setResult(null);
      setError(null);
      setRunning(true);
      try {
        const res = await fetch('/api/listener/pipeline', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ pitchId, intent }),
        });
        if (!res.body) throw new Error('No response stream');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const event = JSON.parse(line.slice(6)) as PipelineEvent;
              setEvents((prev) => [...prev, event]);
              if (event.type === 'result') setResult(event);
              if (event.type === 'error') setError(event.message);
            } catch {
              /* skip malformed line */
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'pipeline failed';
        setError(msg);
      } finally {
        setRunning(false);
      }
    },
    [pitchId]
  );

  const reset = useCallback(() => {
    setEvents([]);
    setResult(null);
    setError(null);
    setRunning(false);
  }, []);

  return { events, result, running, error, run, reset };
}
