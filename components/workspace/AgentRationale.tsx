import type { Facet, GenerateResult } from '@/lib/types/pitch';
import { reasonForRegister, reasonForFormat } from '@/lib/logic/decision-reasons';
import { REGISTER_LABEL, ARCHETYPE_LABEL, OC_LABEL } from '@/lib/labels';

interface Props {
  pitch: GenerateResult;
  facets: Facet[];
}

export function AgentRationale({ pitch, facets }: Props) {
  const componentTypes = new Set(facets.map((f) => f.componentType));
  const compositionValue =
    componentTypes.size === 0
      ? '—'
      : `${componentTypes.size} component types`;
  const compositionDetail =
    componentTypes.size === 0
      ? ''
      : ` · ${Array.from(componentTypes).join(', ')}`;

  const decisions = [
    {
      label: 'Register',
      value: REGISTER_LABEL[pitch.register],
      reason: reasonForRegister(pitch.storytellerRole, pitch.listenerRole),
      source: 'deterministic',
    },
    {
      label: 'Archetype',
      value: ARCHETYPE_LABEL[pitch.archetype],
      reason: pitch.archetypeReasoning,
      source: 'gemini-2.5-flash',
    },
    {
      label: 'Standout',
      value: OC_LABEL[pitch.outstandingCharacteristic],
      reason: pitch.characteristicReasoning,
      source: 'gemini-2.5-flash',
    },
    {
      label: 'Composition',
      value: compositionValue,
      reason: reasonForFormat(pitch.outstandingCharacteristic) + compositionDetail,
      source: 'gemini-2.5-flash',
    },
  ];

  return (
    <section className="agent-rationale">
      <div className="agent-rationale-header">
        <span className="agent-rationale-label">Agent rationale</span>
        <span className="agent-rationale-count">4 decisions</span>
      </div>
      <ul className="decision-list">
        {decisions.map((d) => (
          <li key={d.label} className="decision-row">
            <span className="decision-label">{d.label}</span>
            <span className="decision-value">{d.value}</span>
            <span className="decision-reason">{d.reason}</span>
            <span className="decision-source">{d.source}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
