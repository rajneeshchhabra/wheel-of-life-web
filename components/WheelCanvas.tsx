"use client";

import { useEffect, useRef } from "react";
import type { Section } from "@/lib/types";
import { BAND_COLOR, equilibrium, equilibriumBand, levelFor } from "@/lib/scoring";

interface Props {
  sections: Section[];
  levels: Record<string, number>;
  todayGains: Record<string, number>;
  rotationSpeed: number; // deg/s
  onSelect: (section: Section) => void;
}

/**
 * Port of WheelCanvasView.swift: each area's arc sits at a radius set by its score — strong
 * areas ride the rim, neglected ones sink toward the hub. Slice width ∝ weight. Dotted spokes
 * from hub to rim, a subtle pulsing balance dot in the center, date · balance · time below.
 */
export default function WheelCanvas({ sections, levels, todayGains, rotationSpeed, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const propsRef = useRef({ sections, levels, todayGains, rotationSpeed });
  propsRef.current = { sections, levels, todayGains, rotationSpeed };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const frame = (t: number) => {
      const { sections, levels, todayGains, rotationSpeed } = propsRef.current;
      if (lastTickRef.current != null && !reducedMotion.matches) {
        rotationRef.current = (rotationRef.current + ((t - lastTickRef.current) / 1000) * rotationSpeed) % 360;
      }
      lastTickRef.current = t;
      draw(ctx, canvas, sections.filter((s) => s.enabled), levels, todayGains, rotationRef.current, reducedMotion.matches ? 0 : t);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const side = Math.min(rect.width, rect.height);
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.hypot(dx, dy);
    const active = sections.filter((s) => s.enabled);
    if (!active.length) return;
    let deg = ((Math.atan2(dy, dx) * 180) / Math.PI + 90 - rotationRef.current) % 360;
    if (deg < 0) deg += 360;
    const angles = sliceAngles(active);
    let idx = 0;
    angles.forEach((a, i) => {
      if (deg >= a.start) idx = i;
    });
    const section = active[idx];
    const radius = arcRadius(section.currentScore, side);
    const thickness = side * 0.062;
    if (dist > radius - thickness && dist < side * 0.5) onSelect(section);
  };

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Life area momentum wheel. Use the area buttons below to select an area."
      onClick={handleClick}
      className="w-full h-full cursor-pointer"
      style={{ display: "block" }}
    />
  );
}

function sliceAngles(sections: Section[]) {
  const weights = sections.map((s) => Math.max(s.weight, 0.5));
  const total = weights.reduce((a, b) => a + b, 0);
  let cursor = 0;
  return weights.map((w) => {
    const span = (360 * w) / total;
    const r = { start: cursor, span };
    cursor += span;
    return r;
  });
}

/** Score → arc radius: 0 hugs the hub, 100 rides the rim. */
function arcRadius(score: number, side: number) {
  const f = Math.min(Math.max(score / 100, 0), 1);
  return side * (0.24 + 0.185 * f);
}

function shortName(name: string) {
  return name.split(/[\s&/]+/)[0].toUpperCase();
}

function draw(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  sections: Section[],
  levels: Record<string, number>,
  todayGains: Record<string, number>,
  rotation: number,
  t: number,
) {
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.width / dpr;
  const H = canvas.height / dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  const side = Math.min(W, H);
  const cx = W / 2;
  const cy = H / 2;
  const count = Math.max(sections.length, 1);
  const thickness = side * 0.062;
  const maxRadius = side * 0.44;
  const labelSize = Math.max(9, side * 0.0185 * Math.min(1, 7.5 / count));
  const angles = sliceAngles(sections);
  const gap = Math.max(5.5, (24 / count) * 3);

  // Spokes — dotted, one per section, aligned to slice centers. Drawn first so arcs sit on top.
  ctx.save();
  ctx.setLineDash([3, 5]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  sections.forEach((_, i) => {
    const mid = ((angles[i].start + angles[i].span / 2 - 90 + rotation) * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(mid) * maxRadius, cy + Math.sin(mid) * maxRadius);
    ctx.stroke();
  });
  ctx.restore();

  sections.forEach((section, i) => {
    const { start, span } = angles[i];
    const score = section.currentScore;
    const radius = arcRadius(score, side);
    const color = section.colorHex;
    const a0 = ((start + gap / 2 - 90 + rotation) * Math.PI) / 180;
    const a1 = ((start + span - gap / 2 - 90 + rotation) * Math.PI) / 180;

    // Ghost track on the rim — where the arc is heading.
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius, a0, a1);
    ctx.lineWidth = thickness * 0.55;
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255,255,255,0.045)";
    ctx.stroke();

    // Glow + arc.
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, a0, a1);
    ctx.lineWidth = thickness;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();

    // Label on the arc, tangential and upright.
    let mid = (start + span / 2 - 90 + rotation) % 360;
    if (mid < 0) mid += 360;
    const midRad = (mid * Math.PI) / 180;
    let tangent = (mid + 90) % 360;
    if (tangent < 0) tangent += 360;
    if (tangent > 90 && tangent < 270) tangent -= 180;

    const drawAt = (r: number, text: string, font: string, fill: string) => {
      ctx.save();
      ctx.translate(cx + Math.cos(midRad) * r, cy + Math.sin(midRad) * r);
      ctx.rotate((tangent * Math.PI) / 180);
      ctx.font = font;
      ctx.fillStyle = fill;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 0, 0);
      ctx.restore();
    };

    drawAt(radius, shortName(section.name), `800 ${labelSize}px system-ui, sans-serif`, "rgba(14,15,20,0.92)");

    // Score · level · today's gain — outside the arc so it never overlaps the label.
    const parts = [String(Math.round(score))];
    const level = levels[section.id] ?? 0;
    if (level > 0) parts.push(`L${level}`);
    const gain = todayGains[section.id] ?? 0;
    if (gain > 0) parts.push(`▲${gain}`);
    drawAt(
      radius + thickness / 2 + Math.max(11, side * 0.022),
      parts.join(" · "),
      `700 ${Math.max(8, labelSize * 0.8)}px system-ui, sans-serif`,
      "rgba(255,255,255,0.55)",
    );

    if (section.aspiration) {
      drawAt(maxRadius + side * 0.012, section.aspiration.toUpperCase(), `700 ${Math.max(8.5, labelSize * 0.88)}px system-ui, sans-serif`, hexAlpha(color, 0.7));
    }
    if (section.aspiration2) {
      drawAt(maxRadius + side * 0.046, section.aspiration2.toUpperCase(), `600 ${Math.max(7.5, labelSize * 0.72)}px system-ui, sans-serif`, hexAlpha(color, 0.32));
    }
  });

  // Center: subtle heartbeat in the balance colour.
  const eq = equilibrium(sections.map((s) => s.currentScore));
  const bandColor = BAND_COLOR[equilibriumBand(eq)];
  const beat = Math.max(0, Math.sin((t / 1200) * Math.PI * 2)) * 0.15 + 0.05;
  const baseR = side * 0.05;
  const pulseR = baseR * (0.9 + beat * 0.2);

  ctx.beginPath();
  ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
  ctx.fillStyle = hexAlpha(bandColor, 0.28);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, pulseR * 1.2, 0, Math.PI * 2);
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = hexAlpha(bandColor, 0.15);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, baseR * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = bandColor;
  ctx.fill();

  // Below the wheel: date · balance · time.
  const now = new Date();
  const dateStr = now.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const timeStr = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const infoY = cy + side * 0.485;
  ctx.textBaseline = "middle";
  ctx.font = "600 11px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.textAlign = "left";
  ctx.fillText(dateStr, cx - side * 0.36, infoY);
  ctx.textAlign = "right";
  ctx.fillText(timeStr, cx + side * 0.36, infoY);
  ctx.textAlign = "center";
  ctx.font = "800 11px system-ui, sans-serif";
  ctx.fillStyle = bandColor;
  ctx.fillText(`BALANCE ${eq}`, cx, infoY);
}

function hexAlpha(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export { levelFor };
