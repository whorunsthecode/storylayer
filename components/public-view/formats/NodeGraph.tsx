'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Facet, Edge, Register } from '@/lib/types/pitch';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface NodeDatum {
  id: string;
  name: string;
  content: string;
  x?: number;
  y?: number;
}

interface LinkDatum {
  source: string | NodeDatum;
  target: string | NodeDatum;
  label: string;
}

const REGISTER_COLORS: Record<Register, { node: string; nodeFill: string; edge: string; label: string }> = {
  'builder-led':   { node: '#3B5BFF', nodeFill: 'rgba(255,255,255,0.92)', edge: 'rgba(59, 91, 255, 0.45)', label: '#1F2C4D' },
  'vision-led':    { node: '#C9A14A', nodeFill: 'rgba(252,245,230,0.92)', edge: 'rgba(201, 161, 74, 0.5)',  label: '#1F2C4D' },
  'trust-led':     { node: '#3B5BFF', nodeFill: 'rgba(255,255,255,0.92)', edge: 'rgba(59, 91, 255, 0.4)',  label: '#1F2C4D' },
  'mission-led':   { node: '#3B5BFF', nodeFill: 'rgba(255,255,255,0.92)', edge: 'rgba(59, 91, 255, 0.4)',  label: '#1F2C4D' },
  'chemistry-led': { node: '#3B5BFF', nodeFill: 'rgba(255,255,255,0.92)', edge: 'rgba(59, 91, 255, 0.4)',  label: '#1F2C4D' },
};

export function NodeGraph({
  facets,
  edges,
  register,
}: {
  facets: Facet[];
  edges: Edge[];
  register: Register;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 580 });

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

  const colors = REGISTER_COLORS[register] ?? REGISTER_COLORS['builder-led'];

  const data = useMemo(() => {
    const validIds = new Set(facets.map((f) => f.id));
    return {
      nodes: facets.map((f) => ({ id: f.id, name: f.title, content: f.content })),
      links: edges
        .filter((e) => validIds.has(e.from) && validIds.has(e.to))
        .map((e) => ({ source: e.from, target: e.to, label: e.label })),
    };
  }, [facets, edges]);

  return (
    <div className="format-node-graph">
      <div className="ng-canvas-wrap" ref={wrapRef}>
        <ForceGraph2D
          graphData={data}
          width={size.w}
          height={size.h}
          backgroundColor="rgba(0,0,0,0)"
          linkColor={() => colors.edge}
          linkWidth={1.4}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.005}
          linkDirectionalParticleColor={() => colors.node}
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={0.85}
          linkDirectionalArrowColor={() => colors.edge}
          cooldownTicks={120}
          d3VelocityDecay={0.32}
          nodeCanvasObject={(rawNode: unknown, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const node = rawNode as NodeDatum;
            if (node.x === undefined || node.y === undefined) return;
            const r = 12;
            // outer glow
            ctx.beginPath();
            ctx.arc(node.x, node.y, r + 6, 0, 2 * Math.PI);
            ctx.fillStyle = colors.node + '22';
            ctx.fill();
            // glass orb
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
            ctx.fillStyle = colors.nodeFill;
            ctx.fill();
            ctx.lineWidth = 1.4;
            ctx.strokeStyle = colors.node;
            ctx.stroke();
            // top highlight
            ctx.beginPath();
            ctx.arc(node.x - r * 0.35, node.y - r * 0.35, r * 0.45, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            ctx.fill();

            // label
            const label = node.name;
            const fontSize = 11 / Math.sqrt(globalScale);
            ctx.font = `500 ${fontSize}px var(--reg-mono, monospace)`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = colors.label;
            ctx.fillText(label, node.x, node.y + r + 6);
          }}
          nodePointerAreaPaint={(rawNode: unknown, color: string, ctx: CanvasRenderingContext2D) => {
            const node = rawNode as NodeDatum;
            if (node.x === undefined || node.y === undefined) return;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 18, 0, 2 * Math.PI);
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
            const fontSize = 9 / Math.sqrt(globalScale);
            ctx.font = `400 ${fontSize}px var(--reg-mono, monospace)`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = colors.label;
            ctx.globalAlpha = 0.7;
            ctx.fillText(link.label, mx, my);
            ctx.globalAlpha = 1;
          }}
        />
      </div>
      <div className="ng-legend">
        <span><strong>{facets.length}</strong>&nbsp; facets</span>
        <span><strong>{edges.length}</strong>&nbsp; connections</span>
        <span>drag to reposition</span>
      </div>
    </div>
  );
}
