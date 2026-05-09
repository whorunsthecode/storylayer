export type StorytellerRole = 'founder' | 'investor' | 'applicant' | 'startup' | 'cofounder';
export type ListenerRole = 'investor' | 'founder' | 'startup' | 'applicant' | 'cofounder';

export type Register =
  | 'vision-led'
  | 'trust-led'
  | 'builder-led'
  | 'mission-led'
  | 'chemistry-led';

export type Archetype =
  | 'arc-of-pivots'
  | 'deepening-conviction'
  | 'builder-streak'
  | 'operator-builder'
  | 'domain-translator';

export type OutstandingCharacteristic =
  | 'shipped-output'
  | 'network-of-influence'
  | 'voice-and-writing'
  | 'structured-thinking'
  | 'journey-and-pivots'
  | 'conviction-and-thesis'
  | 'credentialed-track'
  | 'multidisciplinary-range'
  | 'quantified-impact';

export type Format =
  | 'cards-grid'
  | 'node-graph'
  | 'magazine'
  | 'timeline'
  | 'portfolio-gallery'
  | 'data-dashboard'
  | 'map-constellation'
  | 'manifesto'
  | 'process-diagram'
  | 'conversation'
  | 'annotated-cv'
  | 'network-of-people';

export type FacetId =
  | 'values'
  | 'formative-experience'
  | 'origin'
  | 'shipped-work'
  | 'range'
  | 'vision'
  | 'fundraising-track'
  | 'looking-for'
  | 'how-i-work'
  | 'outside-interests';

export interface Facet {
  id: FacetId;
  title: string;
  content: string;
}

export interface Edge {
  from: FacetId;
  to: FacetId;
  label: string;
}

export interface DataSource {
  type: 'url' | 'text';
  label: string;
  url?: string;
  content?: string;
}

export interface Pitch {
  id: string;
  storytellerRole: StorytellerRole;
  listenerRole: ListenerRole;
  register: Register;
  archetype: Archetype;
  outstandingCharacteristic: OutstandingCharacteristic;
  format: Format;
  reasoning: string;
  facets: Facet[];
  edges: Edge[];
  createdAt: string;
}

export type GenerateResult = Omit<Pitch, 'id' | 'createdAt' | 'storytellerRole' | 'listenerRole'> & {
  storytellerRole: StorytellerRole;
  listenerRole: ListenerRole;
};
