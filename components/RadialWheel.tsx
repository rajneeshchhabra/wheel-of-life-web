"use client";

import { useEffect, useRef } from "react";
import type { Section } from "@/lib/types";
import EmoticonCenter from "./EmoticonCenter";

interface RadialWheelProps {
  sections: Section[];
  mood: "thriving" | "happy" | "content" | "neutral" | "struggling" | "imbalanced" | "overwhelmed";
  onSectionClick?: (section: Section) => void;
}

export default function RadialWheel({ sections, mood, onSectionClick }: RadialWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const innerRadius = 40;
    const outerRadius = 140;

    // Clear
    ctx.fillStyle = "#0e0f14";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw 8 radial beams with bricks
    sections.forEach((section, index) => {
      const angle = (index / sections.length) * Math.PI * 2 - Math.PI / 2;

      // Beam start (center) and end (outer)
      const endX = centerX + Math.cos(angle) * outerRadius;
      const endY = centerY + Math.sin(angle) * outerRadius;

      // Draw radial line
      ctx.strokeStyle = section.colorHex + "40"; // 40% opacity
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Draw bricks along the beam
      const brickSize = 8;
      const spacing = (outerRadius - innerRadius) / section.brickCount;

      for (let i = 0; i < section.brickCount; i++) {
        const brickDist = innerRadius + i * spacing + spacing / 2;
        const brickX = centerX + Math.cos(angle) * brickDist;
        const brickY = centerY + Math.sin(angle) * brickDist;

        // Lit or grey?
        if (i < section.bricksLit) {
          // Lit brick - glowing
          ctx.fillStyle = section.colorHex;
          ctx.shadowColor = section.colorHex + "80";
          ctx.shadowBlur = 8;
        } else {
          // Grey brick
          ctx.fillStyle = "#3a3a4a";
          ctx.shadowColor = "transparent";
        }

        ctx.fillRect(brickX - brickSize / 2, brickY - brickSize / 2, brickSize, brickSize);
      }

      // Section label
      const labelDist = outerRadius + 20;
      const labelX = centerX + Math.cos(angle) * labelDist;
      const labelY = centerY + Math.sin(angle) * labelDist;

      ctx.fillStyle = "#a0a0b0";
      ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(section.icon + " " + section.name, labelX, labelY);
    });

    // Reset shadow
    ctx.shadowColor = "transparent";
  }, [sections, mood]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !onSectionClick) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Find which section was clicked
    const angle = Math.atan2(y - centerY, x - centerX) + Math.PI / 2;
    const normalizedAngle = angle < 0 ? angle + Math.PI * 2 : angle;
    const sectionIndex = Math.floor((normalizedAngle / (Math.PI * 2)) * sections.length);

    if (sectionIndex >= 0 && sectionIndex < sections.length) {
      onSectionClick(sections[sectionIndex]);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full max-w-md max-h-md cursor-pointer"
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <EmoticonCenter mood={mood} />
      </div>
    </div>
  );
}
