import type { Facet, FacetId, Edge } from '@/lib/types/pitch';

export function filterByViewer(
  facets: Facet[],
  edges: Edge[],
  selected: FacetId[]
): { facets: Facet[]; edges: Edge[] } {
  const selectedSet = new Set(selected);
  return {
    facets: facets.filter((f) => selectedSet.has(f.id)),
    edges: edges.filter((e) => selectedSet.has(e.from) && selectedSet.has(e.to)),
  };
}
