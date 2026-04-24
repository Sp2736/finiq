"use client";

import React, { useEffect, useRef } from "react";

export default function InvestorFluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();
    window.addEventListener("resize", setSize);

    const render = () => {
      // Smoother, slightly slower animation for a calm, professional feel
      time += 0.0025; 
      const w = canvas.width;
      const h = canvas.height;

      // 1. Base Background: Clean, crisp Slate/White
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, "#ffffff"); // Pure white
      bgGrad.addColorStop(1, "#f8fafc"); // Very soft slate
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Helper function for organic, overlapping waves
      const drawWave = (
        yOffset: number,
        amplitude: number,
        frequency: number,
        phase: number,
        color1: string,
        color2: string,
        isTopWave: boolean
      ) => {
        ctx.beginPath();
        // Start drawing from the left edge
        ctx.moveTo(0, isTopWave ? 0 : h);
        
        for (let x = 0; x <= w; x += 20) {
          const normX = x / w;
          // Complex waveform combining two sine waves for organic, fluid movement
          const wave1 = Math.sin(normX * Math.PI * frequency + time + phase) * amplitude;
          const wave2 = Math.cos(normX * Math.PI * (frequency * 0.5) - time * 0.8) * (amplitude * 0.4);
          
          ctx.lineTo(x, yOffset + wave1 + wave2);
        }

        // Complete the path to fill either the top or bottom area
        ctx.lineTo(w, isTopWave ? 0 : h);
        ctx.lineTo(0, isTopWave ? 0 : h);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, isTopWave ? 0 : h, 0, yOffset);
        grad.addColorStop(0, color1);
        grad.addColorStop(1, color2);
        ctx.fillStyle = grad;
        ctx.fill();
      };

      // 2. Top Wave: Pearlescent Ice Blue (Keeps dark text highly readable)
      drawWave(h * 0.35, 120, 1.5, 0, "rgba(241, 245, 249, 0.8)", "rgba(224, 231, 255, 0.9)", true);

      // 3. Middle Wave: Modern SaaS Indigo / Azure Blue (Tech & Intelligence)
      drawWave(h * 0.6, 150, 1.2, 2, "rgba(99, 102, 241, 0.85)", "rgba(37, 99, 235, 0.9)", false);

      // 4. Bottom Wave: Deep Institutional Navy (Security & Stability)
      drawWave(h * 0.75, 100, 1.8, 4, "rgba(30, 58, 138, 0.95)", "rgba(2, 6, 23, 1)", false);

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
      window.removeEventListener("resize", setSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block z-0"
    />
  );
}