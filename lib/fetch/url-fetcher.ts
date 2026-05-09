import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export async function fetchAndExtract(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 PitchWorkspace/0.1' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Fetch failed (${res.status}) for ${url}`);
  const html = await res.text();
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  const text = article?.textContent ?? '';
  // Cap very long pages so we don't blow up the LLM context
  return text.slice(0, 12_000);
}
