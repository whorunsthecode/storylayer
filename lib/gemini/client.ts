import { GoogleGenAI } from '@google/genai';

let _client: GoogleGenAI | null = null;

export function getAI(): GoogleGenAI {
  if (_client) return _client;
  const apiKey = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing GOOGLE_API_KEY (or GEMINI_API_KEY). Set it in .env.local.'
    );
  }
  _client = new GoogleGenAI({ apiKey });
  return _client;
}
