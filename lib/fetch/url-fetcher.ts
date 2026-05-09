// URL fetcher uses Jina AI Reader (https://jina.ai/reader) — a free public service
// that renders any URL with a headless browser and returns clean markdown.
// Handles JS-rendered portfolio sites (Framer, Webflow, Cargo, SPAs) where Mozilla
// Readability would only see an empty shell.
//
// Falls back to raw fetch + regex strip if Jina is unavailable, so the system
// degrades gracefully.

const JINA_PREFIX = 'https://r.jina.ai/';
const MAX_CHARS = 14_000;
const FETCH_TIMEOUT_MS = 25_000;
// Anything shorter than this is almost certainly nav/title scraps with no real story content
const MIN_USEFUL_CHARS = 220;

export class BlockedHostError extends Error {
  constructor(host: string) {
    super(
      `${host} blocks scraping — paste the text into a Text source instead`
    );
    this.name = 'BlockedHostError';
  }
}

const BLOCKED_HOSTS = /(?:^|\.)(linkedin|twitter|x|facebook|instagram|threads)\.com$/i;

export async function fetchAndExtract(url: string): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  if (BLOCKED_HOSTS.test(parsed.hostname)) {
    throw new BlockedHostError(parsed.hostname);
  }

  let jinaText = '';
  try {
    jinaText = await fetchViaJina(url);
  } catch (err) {
    console.warn('Jina Reader failed, falling back to raw fetch', url, err);
  }

  if (jinaText.trim().length >= MIN_USEFUL_CHARS) {
    return jinaText.slice(0, MAX_CHARS);
  }

  // Jina returned too little (likely a JS-heavy SPA with loaders). Try raw fetch.
  let rawText = '';
  try {
    rawText = await fetchRawFallback(url);
  } catch (err) {
    console.warn('raw fallback failed', url, err);
  }

  // Pick whichever has more usable content
  const best = rawText.length > jinaText.length ? rawText : jinaText;
  if (best.trim().length < MIN_USEFUL_CHARS) {
    throw new Error(
      `couldn't extract meaningful text from ${parsed.hostname} — likely a JS-rendered or image-heavy site, paste your bio/about text into a Text source instead`
    );
  }
  return best.slice(0, MAX_CHARS);
}

async function fetchViaJina(url: string): Promise<string> {
  const target = `${JINA_PREFIX}${url}`;
  const res = await fetch(target, {
    headers: {
      Accept: 'text/plain',
      'X-Engine': 'browser',
      'User-Agent': 'Mozilla/5.0 PitchWorkspace/0.1',
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Jina Reader ${res.status}`);
  return await res.text();
}

async function fetchRawFallback(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 PitchWorkspace/0.1' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Fetch failed (${res.status}) for ${url}`);
  const html = await res.text();
  // Strip script/style blocks, then all tags, then collapse whitespace
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.slice(0, MAX_CHARS);
}
