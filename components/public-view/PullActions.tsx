'use client';

import type { PullAction } from '@/lib/schemas/pull';

interface Props {
  facetId: string;
  busyAction: PullAction | null;
  anyBusy: boolean;
  onPull: (action: PullAction) => void;
}

const ACTIONS: { id: PullAction; icon: string; label: string }[] = [
  { id: 'dig-deeper', icon: '↓', label: 'Dig deeper' },
  { id: 'show-proof', icon: '⊞', label: 'Show proof' },
  { id: 'what-made-this', icon: '◐', label: 'What made this' },
  { id: 'connect-it', icon: '◎', label: 'Connect it' },
];

export function PullActions({ busyAction, anyBusy, onPull }: Props) {
  return (
    <div className="pull-actions">
      {ACTIONS.map((a) => {
        const isBusy = busyAction === a.id;
        const dimmed = anyBusy && !isBusy;
        return (
          <button
            key={a.id}
            type="button"
            className={`pull-btn ${isBusy ? 'busy' : ''} ${dimmed ? 'dimmed' : ''}`}
            disabled={anyBusy}
            onClick={() => onPull(a.id)}
            title={a.label}
          >
            <span className={`pull-btn-icon ${isBusy ? 'spinning' : ''}`}>{a.icon}</span>
            <span className="pull-btn-label">{a.label}</span>
          </button>
        );
      })}
    </div>
  );
}
