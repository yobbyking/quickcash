"use client";

import { useEffect, useRef } from "react";

/**
 * AnimatedBackground — premium live background with:
 *  - Aurora gradient mesh (two slowly-moving radial gradients)
 *  - Floating particle field (canvas)
 *  - Subtle grid overlay
 *
 * Renders fixed, behind all content. Respects prefers-reduced-motion.
 */
export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Honor reduced-motion
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;
    let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      hue: number;
      alpha: number;
      twinkle: number;
    }
    let particles: Particle[] = [];

    function resize() {
      if (!canvas) return;
      const parent = canvas.parentElement;
      width = parent?.clientWidth || window.innerWidth;
      height = parent?.clientHeight || window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Re-seed particles based on viewport area
      const target = Math.min(60, Math.max(20, Math.floor((width * height) / 22000)));
      if (particles.length !== target) {
        particles = new Array(target).fill(0).map(() => spawn());
      }
    }

    function spawn(): Particle {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: 0.6 + Math.random() * 1.8,
        // hues around emerald (155) and cyan (190)
        hue: Math.random() > 0.5 ? 155 + Math.random() * 10 : 185 + Math.random() * 12,
        alpha: 0.2 + Math.random() * 0.4,
        twinkle: Math.random() * Math.PI * 2,
      };
    }

    function tick(t: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.twinkle += 0.025;

        // Wrap around edges
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Soft twinkle alpha
        const a = p.alpha * (0.6 + 0.4 * Math.sin(p.twinkle));
        // Outer glow
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 8);
        grad.addColorStop(0, `hsla(${p.hue}, 85%, 65%, ${a})`);
        grad.addColorStop(0.4, `hsla(${p.hue}, 85%, 55%, ${a * 0.25})`);
        grad.addColorStop(1, `hsla(${p.hue}, 85%, 50%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 8, 0, Math.PI * 2);
        ctx.fill();
        // Bright core
        ctx.fillStyle = `hsla(${p.hue}, 95%, 80%, ${a * 1.2})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Connection lines between nearby particles
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.18;
            ctx.strokeStyle = `hsla(170, 70%, 65%, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      {/* Base dark gradient */}
      <div className="absolute inset-0 bg-[#040a13]" />

      {/* Aurora gradient 1 — emerald */}
      <div
        className="absolute -inset-[20%] opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(40% 40% at 20% 20%, rgba(52, 211, 153, 0.35), transparent 60%), radial-gradient(50% 50% at 80% 80%, rgba(6, 182, 212, 0.30), transparent 60%)",
          animation: "aurora1 18s ease-in-out infinite alternate",
        }}
      />
      {/* Aurora gradient 2 — cyan (offset timing) */}
      <div
        className="absolute -inset-[20%] opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(35% 35% at 80% 25%, rgba(34, 211, 238, 0.30), transparent 60%), radial-gradient(45% 45% at 20% 80%, rgba(110, 231, 183, 0.20), transparent 60%)",
          animation: "aurora2 22s ease-in-out infinite alternate",
        }}
      />
      {/* Aurora gradient 3 — subtle magenta highlight for premium feel */}
      <div
        className="absolute -inset-[20%] opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(30% 30% at 50% 50%, rgba(168, 85, 247, 0.15), transparent 70%)",
          animation: "aurora3 28s ease-in-out infinite alternate",
        }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(52, 211, 153, 0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(52, 211, 153, 0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 100%)",
        }}
      />

      {/* Top vignette to keep header readable */}
      <div
        className="absolute inset-x-0 top-0 h-32"
        style={{
          background:
            "linear-gradient(to bottom, rgba(4, 10, 19, 0.6), transparent)",
        }}
      />

      {/* Floating particles (canvas) */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Bottom vignette */}
      <div
        className="absolute inset-x-0 bottom-0 h-32"
        style={{
          background: "linear-gradient(to top, rgba(4, 10, 19, 0.6), transparent)",
        }}
      />

      {/* Keyframes for aurora drift */}
      <style>{`
        @keyframes aurora1 {
          0%   { transform: translate3d(-3%, -2%, 0) scale(1); }
          50%  { transform: translate3d(2%, 3%, 0) scale(1.06); }
          100% { transform: translate3d(3%, -1%, 0) scale(1); }
        }
        @keyframes aurora2 {
          0%   { transform: translate3d(3%, 2%, 0) scale(1.04); }
          50%  { transform: translate3d(-2%, -3%, 0) scale(1); }
          100% { transform: translate3d(-3%, 1%, 0) scale(1.05); }
        }
        @keyframes aurora3 {
          0%   { transform: translate3d(0, 0, 0) scale(1); opacity: 0.20; }
          50%  { transform: translate3d(0, -2%, 0) scale(1.10); opacity: 0.30; }
          100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.20; }
        }
      `}</style>
    </div>
  );
}
