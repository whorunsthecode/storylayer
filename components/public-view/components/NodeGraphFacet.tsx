'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Facet } from '@/lib/types/pitch';
import { FACET_LABELS } from '@/lib/labels';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface NodeDatum {
  id: string;
  name: string;
  hint?: string;
  x?: number;
  y?: number;
}
interface LinkDatum {
  source: string | NodeDatum;
  target: string | NodeDatum;
  label: string;
}

export function NodeGraphFacet({ facet }: { facet: Facet }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 380 });

  useEffect(() => {
    if (!wrapRef.current) return;
    const update = () => {
      const r = wrapRef.current!.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(() => {
    const nodes = facet.nodes ?? [];
    const validIds = new Set(nodes.map((n) => n.id));
    return {
      nodes: nodes.map((n) => ({ id: n.id, name: n.label, hint: n.hint })),
      links: (facet.connections ?? [])
        .filter((c) => validIds.has(c.from) && validIds.has(c.to))
        .map((c) => ({ source: c.from, target: c.to, label: c.label })),
    };
  }, [facet]);

  if (data.nodes.length === 0) {
    return (
      <article className="cmp cmp-facet-card">
        <div className="cmp-eyebrow">{FACET_LABELS[facet.id]}</div>
        <h3 className="cmp-title">{facet.title}</h3>
        <p className="cmp-body">{facet.content}</p>
      </article>
    );
  }

  return (
    <article className="cmp cmp-obsidian">
      <div className="cmp-obsidian-grid" />
      <div className="cmp-obsidian-head">
        <div className="cmp-obsidian-eyebrow">{FACET_LABELS[facet.id]}</div>
        <h3 className="cmp-obsidian-title">{facet.title}</h3>
      </div>
      <div className="cmp-obsidian-canvas" ref={wrapRef}>
        <ForceGraph2D
          graphData={data}
          width={size.w}
          height={size.h}
          backgroundColor="rgba(0,0,0,0)"
          linkColor={() => 'rgba(176, 196, 255, 0.35)'}
          linkWidth={1}
          linkDirectionalParticles={1.5}
          linkDirectionalParticleSpeed={0.005}
          linkDirectionalParticleColor={() => '#8FAEFF'}
          cooldownTicks={120}
          d3VelocityDecay={0.32}
          nodeCanvasObject={(rawNode: unknown, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const node = rawNode as NodeDatum;
            if (node.x === undefined || node.y === undefined) return;
            const r = 9;
            // outer glow
            const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r + 14);
            glow.addColorStop(0, 'rgba(140, 170, 255, 0.55)');
            glow.addColorStop(1, 'rgba(140, 170, 255, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(node.x, node.y, r + 14, 0, 2 * Math.PI);
            ctx.fill();
            // core circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
            ctx.fillStyle = '#E8EFFF';
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(140, 170, 255, 0.9)';
            ctx.stroke();
            // inner highlight
            ctx.beginPath();
            ctx.arc(node.x - r * 0.35, node.y - r * 0.35, r * 0.4, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.fill();
            // label
            const fontSize = 10 / Math.sqrt(globalScale);
            ctx.font = `500 ${fontSize}px var(--font-geist-mono, monospace)`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#D8E2FF';
            ctx.fillText(node.name, node.x, node.y + r + 5);
          }}
          nodePointerAreaPaint={(rawNode: unknown, color: string, ctx: CanvasRenderingContext2D) => {
            const node = rawNode as NodeDatum;
            if (node.x === undefined || node.y === undefined) return;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 14, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
          }}
          linkCanvasObjectMode={() => 'after'}
          linkCanvasObject={(rawLink: unknown, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const link = rawLink as LinkDatum;
            if (typeof link.source === 'string' || typeof link.target === 'string') return;
            const s = link.source;
            const t = link.target;
            if (s.x === undefined || s.y === undefined || t.x === undefined || t.y === undefined) return;
            const mx = (s.x + t.x) / 2;
            const my = (s.y + t.y) / 2;
            const fontSize = 8 / Math.sqrt(globalScale);
            ctx.font = `400 italic ${fontSize}px var(--font-geist-mono, monospace)`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(216, 226, 255, 0.7)';
            ctx.fillText(link.label, mx, my);
          }}
        />
      </div>
      {facet.content && <p className="cmp-obsidian-caption">{facet.content}</p>}
    </article>
  );
}
