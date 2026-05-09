import type { Facet } from '@/lib/types/pitch';

export function Magazine({ facets }: { facets: Facet[]; edges: never[] }) {
  if (facets.length === 0) return null;
  const [hero, ...rest] = facets;
  return (
    <div className="format-magazine">
      <section className="mag-hero">
        <h1 className="mag-hero-title">{hero.title}</h1>
        <p className="mag-hero-body">{hero.content}</p>
      </section>
      <div className="mag-spread">
        {rest.map((f) => (
          <article key={f.id} className="mag-column">
            <h2 className="mag-column-title">{f.title}</h2>
            <p className="mag-column-body">{f.content}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
