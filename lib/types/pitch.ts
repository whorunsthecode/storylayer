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

/**
 * A component is a per-facet rendering choice. The agent picks one for each
 * facet based on the kind of content it is — quantified facets get metric-grids,
 * narrative facets get chapter-spreads, etc. The listener view assembles them
 * vertically into a mixed layout (Obsidian principle: different thoughts warrant
 * different containers).
 */
export type ComponentType =
  | 'node-graph'          // dark Obsidian panel: glowing nodes + connection lines
  | 'metric-grid'         // big accent numbers + labels + context
  | 'timeline-strip'      // horizontal sequence of dated moments
  | 'quote-manifesto'     // full-width left-bordered italic display quote
  | 'skill-constellation' // weighted pills (1-3 weights)
  | 'chapter-spread'      // editorial italic headline + body paragraph
  | 'facet-card';         // default — clean glass card with title + body

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

// Structured data per component type. Only one of these populates per facet,
// matching the facet's componentType.
export interface Metric {
  value: string;        // e.g. "120k", "$4.2M", "3 years"
  label: string;        // e.g. "weekly active users"
  context?: string;     // e.g. "at Preface, 2022–2024"
}

export interface TimelineEvent {
  eyebrow: string;      // e.g. "2021"
  title: string;
  content: string;
}

export interface GraphNode {
  id: string;
  label: string;
  hint?: string;        // optional one-liner for the node
}

export interface GraphConnection {
  from: string;         // node id within this facet's nodes
  to: string;
  label: string;        // verb phrase: "drives", "shaped", "demonstrates"
}

export interface SkillPill {
  name: string;
  weight: number;       // 1 = small/faded, 3 = large/full opacity
}

export interface Facet {
  id: FacetId;
  title: string;
  content: string;                // always populated — used as fallback / accessible text
  componentType: ComponentType;
  // Optional, populated based on componentType:
  metrics?: Metric[];             // metric-grid
  events?: TimelineEvent[];       // timeline-strip
  nodes?: GraphNode[];            // node-graph
  connections?: GraphConnection[];// node-graph
  skills?: SkillPill[];           // skill-constellation
  quote?: string;                 // quote-manifesto
  eyebrow?: string;               // chapter-spread (small label above headline)
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
  reasoning: string;
  facets: Facet[];
  createdAt: string;
}

export type GenerateResult = Omit<Pitch, 'id' | 'createdAt'>;
