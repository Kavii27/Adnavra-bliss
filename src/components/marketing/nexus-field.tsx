"use client";
import { useEffect, useRef } from "react";

export function NexusField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let w = 0, h = 0, dpr = 1;

    const onResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2); // DPR clamp per spec
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onMove = (e: PointerEvent) => {
      pointer.current.x = e.clientX;
      pointer.current.y = e.clientY;
      pointer.current.active = true;
    };
    const onLeave = () => { pointer.current.active = false; };

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    onResize();

    // Grid config, sparse spacing per spec: dot-matrix with black foundation
    const GAP = 28; // sparse
    const DOT = 1.35; // dot particles
    const COLS = Math.ceil(w / GAP) + 2;
    const ROWS = Math.ceil(h / GAP) + 2;

    let t = 0;

    const draw = () => {
      t += prefersReduced ? 0 : 0.008; // slow breathing pulse
      ctx.clearRect(0, 0, w, h);

      // soft depth fade: vignette via radial alpha
      const cx = w * 0.72;
      const cy = h * 0.42;

      for (let y = -1; y < ROWS; y++) {
        for (let x = -1; x < COLS; x++) {
          const baseX = x * GAP + (GAP * 0.5);
          const baseY = y * GAP + (GAP * 0.5);

          // pointer-reactive drift, subtle
          let dx = 0, dy = 0;
          if (pointer.current.active && !prefersReduced) {
            const distP = Math.hypot(baseX - pointer.current.x, baseY - pointer.current.y);
            const influence = Math.max(0, 1 - distP / 420);
            dx = (baseX - pointer.current.x) * influence * 0.035;
            dy = (baseY - pointer.current.y) * influence * 0.035;
          }

          const px = baseX + dx;
          const py = baseY + dy;

          // breathing pulse modulates opacity + subtle scale
          const pulse = 0.55 + Math.sin(t + (x * 0.18) + (y * 0.12)) * 0.45;

          // depth fade: farther from center = dimmer, plus vertical fade
          const distCenter = Math.hypot(px - cx, py - cy);
          const radialFade = Math.max(0, 1 - distCenter / (Math.max(w, h) * 0.85));
          const vFade = Math.min(1, Math.max(0, 1 - Math.abs(py - h * 0.5) / (h * 0.75)));

          // base teal/cyan dots on black with alpha, preserve dom fallback contrast
          const alpha = (0.22 + radialFade * 0.62) * vFade * (0.35 + pulse * 0.65);
          // clamp alpha so field reads as technical, meditative, atmospheric, not noisy
          const a = Math.min(0.92, Math.max(0.04, alpha));

          // color lerp: teal #c9a26d + faint blue #3B82F6 for depth, but keep subtle
          // we vary slightly per row to create shader gradient feel
          const isAccent = (x + y) % 11 === 0;
          const r = isAccent ? 20 : 16;
          const g = isAccent ? 184 : 172;
          const b = isAccent ? 166 : 190;

          // soft depth fade via shadow blur, tiny glow
          ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
          ctx.beginPath();
          const rr = DOT * (0.9 + pulse * 0.22);
          ctx.arc(px, py, rr, 0, Math.PI * 2);
          ctx.fill();

          // subtle noise field: occasional extra-dim dot for texture (every 7th)
          if ((x * 3 + y * 7) % 17 === 0) {
            ctx.fillStyle = `rgba(148,163,184,${a * 0.18})`;
            ctx.beginPath();
            ctx.arc(px + 6, py + 4, rr * 0.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // shader gradients: soft top/bottom washes to tie into dark surface
      // keeps canvas from reading as flat grid
      const gradTop = ctx.createLinearGradient(0, 0, 0, h * 0.38);
      gradTop.addColorStop(0, "rgba(20,184,166,0.035)");
      gradTop.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradTop;
      ctx.fillRect(0, 0, w, h * 0.38);

      const gradBottom = ctx.createLinearGradient(0, h * 0.62, 0, h);
      gradBottom.addColorStop(0, "rgba(15,90,200,0.045)");
      gradBottom.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradBottom;
      ctx.fillRect(0, h * 0.62, w, h * 0.38);

      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      id="field"
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      // dom fallback: if canvas fails, css background still shows black
      style={{ background: "#000000" }}
    />
  );
}
