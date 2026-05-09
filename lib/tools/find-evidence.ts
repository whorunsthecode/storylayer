export type Relevance = 'high' | 'medium' | 'low';

export interface EvidenceQuote {
  text: string;
  relevance: Relevance;
}

/**
 * MCP-shape tool implementation. The agent calls this through Gemini function-calling
 * to ground each facet selection in actual sentences from the storyteller's corpus.
 */
export function findEvidenceInCorpus(
  corpus: string,
  searchTerms: string,
  maxResults = 3
): EvidenceQuote[] {
  if (!corpus) return [];
  const sentences = corpus
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && s.length < 320);

  const terms = searchTerms
    .toLowerCase()
    .split(/[\s,;\/]+/)
    .map((t) => t.replace(/[^\w-]/g, ''))
    .filter((t) => t.length > 3);

  if (terms.length === 0) return [];

  const scored = sentences.map((s) => {
    const sl = s.toLowerCase();
    const score = terms.reduce((acc, t) => acc + (sl.includes(t) ? 1 : 0), 0);
    return { text: s, score };
  });

  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map<EvidenceQuote>((x) => {
      const ratio = x.score / terms.length;
      const relevance: Relevance =
        ratio >= 0.6 ? 'high' : ratio >= 0.3 ? 'medium' : 'low';
      return { text: x.text, relevance };
    });
}
