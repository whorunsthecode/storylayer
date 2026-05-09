'use client';

import { useState } from 'react';

interface Props {
  busy: boolean;
  onRemix: (text: string) => Promise<void>;
}

export function RemixBar({ busy, onRemix }: Props) {
  const [text, setText] = useState('');

  const submit = async () => {
    const t = text.trim();
    if (!t || busy) return;
    setText('');
    await onRemix(t);
  };

  return (
    <div className="remix-bar">
      <span className="remix-label">remix:</span>
      <input
        type="text"
        className="remix-input"
        placeholder="e.g., focus on values instead, or surface their fundraising track"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={busy}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          }
        }}
      />
      <button
        type="button"
        className="remix-submit"
        disabled={busy || !text.trim()}
        onClick={submit}
      >
        {busy ? '…' : '→'}
      </button>
    </div>
  );
}
