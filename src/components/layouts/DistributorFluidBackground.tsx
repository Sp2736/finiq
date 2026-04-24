"use client";

import React, { useEffect, useRef } from "react";

export default function DistributorFluidBackground() {
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
      // Slower animation for a grounded, professional financial feel
      time += 0.002; 
      const w = canvas.width;
      const h = canvas.height;

      // 1. Base Background: Clean, crisp White/Mint
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, "#ffffff"); // Pure white
      bgGrad.addColorStop(1, "#f0fdf4"); // Very soft emerald tint (emerald-50)
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
        ctx.moveTo(0, isTopWave ? 0 : h);
        
        for (let x = 0; x <= w; x += 20) {
          const normX = x / w;
          const wave1 = Math.sin(normX * Math.PI * frequency + time + phase) * amplitude;
          const wave2 = Math.cos(normX * Math.PI * (frequency * 0.5) - time * 0.8) * (amplitude * 0.4);
          
          ctx.lineTo(x, yOffset + wave1 + wave2);
        }

        ctx.lineTo(w, isTopWave ? 0 : h);
        ctx.lineTo(0, isTopWave ? 0 : h);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, isTopWave ? 0 : h, 0, yOffset);
        grad.addColorStop(0, color1);
        grad.addColorStop(1, color2);
        ctx.fillStyle = grad;
        ctx.fill();
      };

      // 2. Top Wave: Pearlescent Mint (High readability for header area)
      drawWave(h * 0.35, 120, 1.5, 0, "rgba(236, 253, 245, 0.8)", "rgba(209, 250, 229, 0.9)", true);

      // 3. Middle Wave: Vibrant Emerald / Teal (Growth & Prosperity)
      drawWave(h * 0.6, 150, 1.2, 2, "rgba(16, 185, 129, 0.85)", "rgba(13, 148, 136, 0.9)", false);

      // 4. Bottom Wave: Deep Institutional Forest Green (Stability & Wealth)
      drawWave(h * 0.75, 100, 1.8, 4, "rgba(6, 78, 59, 0.95)", "rgba(2, 44, 34, 1)", false);

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