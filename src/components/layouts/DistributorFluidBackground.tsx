"use client";

import React, { useEffect, useRef, useState } from "react";

function hexToRgb(hex: string) {
  if (!hex) return "255, 255, 255";
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length !== 6) return "255, 255, 255";
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

const getCSSVar = (name: string, fallback: string) => {
  if (typeof window === "undefined") return fallback;
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
};

export default function DistributorFluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [colors, setColors] = useState({
    color50: "248, 250, 252",
    color100: "241, 245, 249",
    color200: "224, 231, 255",
    color400: "99, 102, 241",
    color600: "37, 99, 235",
    color800: "30, 58, 138",
    color950: "2, 6, 23"
  });

  useEffect(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    setColors({
      color50: hexToRgb(rootStyle.getPropertyValue('--fin-brand-50')),
      color100: hexToRgb(rootStyle.getPropertyValue('--fin-brand-100')),
      color200: hexToRgb(rootStyle.getPropertyValue('--fin-brand-200')),
      color400: hexToRgb(rootStyle.getPropertyValue('--fin-brand-400')),
      color600: hexToRgb(rootStyle.getPropertyValue('--fin-brand-600')),
      color800: hexToRgb(rootStyle.getPropertyValue('--fin-brand-800')),
      color950: hexToRgb(rootStyle.getPropertyValue('--fin-brand-950'))
    });

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

      const pageBg = getCSSVar("--fin-page-bg", "#f8fafc");
      const surfaceBg = getCSSVar("--fin-content-surface", "#ffffff");

      // 1. Base Background: Clean, crisp White to Ice Blue
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, surfaceBg);
      bgGrad.addColorStop(1, pageBg);
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

      // 2. Top Wave: Pearlescent Ice Blue (Keeps dark text highly readable)
      drawWave(h * 0.35, 120, 1.5, 0, `rgba(${colors.color100}, 0.8)`, `rgba(${colors.color200}, 0.9)`, true);

      // 3. Middle Wave: Modern SaaS Indigo / Azure Blue (Tech & Intelligence)
      drawWave(h * 0.6, 150, 1.2, 2, `rgba(${colors.color400}, 0.85)`, `rgba(${colors.color600}, 0.9)`, false);

      // 4. Bottom Wave: Deep Institutional Navy (Security & Stability)
      drawWave(h * 0.75, 100, 1.8, 4, `rgba(${colors.color800}, 0.95)`, `rgba(${colors.color950}, 1)`, false);

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