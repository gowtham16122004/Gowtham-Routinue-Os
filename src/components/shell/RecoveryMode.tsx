import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { useOS } from "@/lib/os-store";
import { useBreathingEngine, BREATH_PATTERNS, type BreathPhase } from "./recovery/BreathingEngine";
import { useAmbientAudio, AMBIENT_PRESETS, type AmbientSound } from "./recovery/useAmbientAudio";

/* ─────────────────────────────────────────────────────────────
   Palette — Mountain lake at 3am
   ───────────────────────────────────────────────────────────── */
const PAL = {
  void:    "#050810",
  water:   "#030810",
  blue:    "#4a8fc4",
  blueHi:  "rgba(100,170,240,0.95)",
  mist:    "rgba(200,225,255,0.85)",
  text:    "rgba(220,235,255,0.92)",
  textDim: "rgba(180,205,235,0.55)",
  textMut: "rgba(140,170,210,0.40)",
  hair:    "rgba(100,140,200,0.06)",
  hair2:   "rgba(100,140,200,0.10)",
};

const FONT_DISPLAY = `var(--font-sanctuary-display), "Cormorant Garamond", Georgia, serif`;
const FONT_UI      = `var(--font-sanctuary-ui), "DM Sans", ui-sans-serif, system-ui`;

/* Per-atmosphere visual identity — emotional color signature for sound cards */
const ATMOSPHERE_TINT: Record<string, {
  bgA: string; bgB: string; border: string; glow: string; dot: string;
}> = {
  rain:    { bgA: "rgba(70,120,200,0.10)",  bgB: "rgba(40,80,150,0.04)",   border: "rgba(100,160,230,0.22)", glow: "rgba(120,180,240,0.18)", dot: "rgba(160,210,255,0.95)" },
  ocean:   { bgA: "rgba(30,130,180,0.10)",  bgB: "rgba(20,90,140,0.04)",   border: "rgba(80,180,210,0.22)",  glow: "rgba(100,200,220,0.18)", dot: "rgba(140,220,235,0.95)" },
  forest:  { bgA: "rgba(50,140,90,0.10)",   bgB: "rgba(30,100,70,0.04)",   border: "rgba(90,180,130,0.22)",  glow: "rgba(120,200,150,0.16)", dot: "rgba(170,235,195,0.95)" },
  space:   { bgA: "rgba(100,80,200,0.10)",  bgB: "rgba(50,40,130,0.04)",   border: "rgba(140,120,230,0.22)", glow: "rgba(160,140,240,0.18)", dot: "rgba(200,180,255,0.95)" },
  wind:    { bgA: "rgba(120,170,200,0.10)", bgB: "rgba(70,120,160,0.04)",  border: "rgba(150,200,220,0.22)", glow: "rgba(180,220,240,0.16)", dot: "rgba(200,230,250,0.95)" },
  healing: { bgA: "rgba(160,90,200,0.10)",  bgB: "rgba(110,50,150,0.04)",  border: "rgba(190,130,230,0.22)", glow: "rgba(210,150,240,0.18)", dot: "rgba(225,180,255,0.95)" },
  noise:   { bgA: "rgba(145,115,80,0.08)",  bgB: "rgba(90,70,50,0.03)",    border: "rgba(175,140,100,0.20)", glow: "rgba(190,160,120,0.14)", dot: "rgba(225,200,170,0.92)" },
  night:   { bgA: "rgba(50,70,140,0.10)",   bgB: "rgba(30,40,90,0.04)",    border: "rgba(80,110,190,0.22)",  glow: "rgba(110,140,210,0.16)", dot: "rgba(170,190,240,0.95)" },
  default: { bgA: "rgba(74,143,196,0.10)",  bgB: "rgba(40,90,150,0.04)",   border: "rgba(100,170,240,0.22)", glow: "rgba(120,180,240,0.16)", dot: "rgba(180,215,250,0.95)" },
};

/* ─────────────────────────────────────────────────────────────
   Canvas Environment — moon, fog bands, water, particles
   ───────────────────────────────────────────────────────────── */
interface EnvProps {
  orbScale: number;        // 0.55 .. 1.0
  phase: BreathPhase;
  active: boolean;
}
function RecoveryEnvironment({ orbScale, phase, active }: EnvProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ orbScale, phase, active });
  useEffect(() => { stateRef.current = { orbScale, phase, active }; }, [orbScale, phase, active]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    const resize = () => {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Stars (static positions, twinkle)
    const stars = Array.from({ length: 90 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.55,
      r: Math.random() * 1.1 + 0.2,
      a: Math.random() * 0.6 + 0.2,
      p: Math.random() * Math.PI * 2,
    }));

    // Rising atmospheric dust
    const parts = Array.from({ length: 110 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vy: 0.00012 + Math.random() * 0.00045,
      vx: (Math.random() - 0.5) * 0.00006,
      r: Math.random() * 1.4 + 0.25,
      a: Math.random() * 0.35 + 0.06,
      p: Math.random() * Math.PI * 2,
    }));

    // Fog bands
    const fogBands = [
      { y: 0.56, h: 0.20, speed: 0.000018, off: 0,     alpha: 0.12 },
      { y: 0.60, h: 0.24, speed: 0.000032, off: 200,   alpha: 0.10 },
      { y: 0.64, h: 0.18, speed: 0.000050, off: 400,   alpha: 0.08 },
      { y: 0.69, h: 0.15, speed: 0.000074, off: 600,   alpha: 0.06 },
    ];

    // Aurora ribbons (slow drift across upper sky)
    const aurora = [
      { y: 0.18, amp: 28, freq: 0.0035, speed: 0.00012, hue: "rgba(120,200,210,", alpha: 0.07 },
      { y: 0.26, amp: 40, freq: 0.0025, speed: 0.00008, hue: "rgba(160,140,220,", alpha: 0.05 },
      { y: 0.34, amp: 22, freq: 0.0045, speed: 0.00016, hue: "rgba(90,170,240,",  alpha: 0.06 },
    ];

    let raf = 0;
    let t0 = performance.now();

    const draw = (now: number) => {
      const t = now;
      const dt = now - t0; t0 = now;
      const { orbScale: os, phase: ph, active: ac } = stateRef.current;

      // Sky gradient (subtly lighter on inhale)
      const lift = ph === "inhale" ? (os - 0.55) / 0.45 : 0;
      const skyTop    = `rgba(5, 8, 16, 1)`;
      const skyMid    = `rgba(${8 + lift * 6}, ${12 + lift * 8}, ${24 + lift * 10}, 1)`;
      const skyHorizon= `rgba(${20 + lift * 14}, ${36 + lift * 16}, ${64 + lift * 20}, 1)`;

      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, skyTop);
      g.addColorStop(0.45, skyMid);
      g.addColorStop(0.72, skyHorizon);
      g.addColorStop(0.78, "#040a14");
      g.addColorStop(1, PAL.water);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // Moon glow
      const cx = W * 0.62, cy = H * 0.22;
      const moonR = Math.min(W, H) * 0.42;
      const mg = ctx.createRadialGradient(cx, cy, 0, cx, cy, moonR);
      const moonA = 0.18 + lift * 0.10;
      mg.addColorStop(0, `rgba(180,210,255,${moonA})`);
      mg.addColorStop(0.25, `rgba(120,170,230,${moonA * 0.55})`);
      mg.addColorStop(0.6, `rgba(70,120,200,${moonA * 0.18})`);
      mg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = mg;
      ctx.fillRect(0, 0, W, H);

      // Moon disk
      const diskR = Math.min(W, H) * 0.045;
      const dg = ctx.createRadialGradient(cx - diskR * 0.25, cy - diskR * 0.25, 0, cx, cy, diskR);
      dg.addColorStop(0, "rgba(245,250,255,0.95)");
      dg.addColorStop(0.6, "rgba(200,220,245,0.55)");
      dg.addColorStop(1, "rgba(160,190,230,0)");
      ctx.fillStyle = dg;
      ctx.beginPath(); ctx.arc(cx, cy, diskR, 0, Math.PI * 2); ctx.fill();

      // Stars
      for (const s of stars) {
        const tw = 0.5 + 0.5 * Math.sin(t * 0.0008 + s.p);
        ctx.fillStyle = `rgba(220,235,255,${s.a * tw * (ac ? 1 : 0.7)})`;
        ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2); ctx.fill();
      }

      // Aurora ribbons — slow drifting bands of color in upper sky
      ctx.globalCompositeOperation = "screen";
      for (const a of aurora) {
        const phaseT = t * a.speed;
        const yBase = H * a.y;
        const grad = ctx.createLinearGradient(0, yBase - a.amp, 0, yBase + a.amp);
        const baseAlpha = a.alpha * (ac ? 1 : 0.55) * (0.7 + 0.3 * Math.sin(t * 0.0004));
        grad.addColorStop(0, `${a.hue}0)`);
        grad.addColorStop(0.5, `${a.hue}${baseAlpha})`);
        grad.addColorStop(1, `${a.hue}0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, yBase);
        for (let x = 0; x <= W; x += 12) {
          const y = yBase + Math.sin(x * a.freq + phaseT) * a.amp + Math.sin(x * a.freq * 2.3 + phaseT * 1.7) * (a.amp * 0.35);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(W, yBase + a.amp);
        ctx.lineTo(0, yBase + a.amp);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";


      // Mountain silhouettes (3 layers, parallax-ish via static path)
      // Far range
      ctx.fillStyle = "rgba(18,30,55,0.85)";
      ctx.beginPath();
      ctx.moveTo(0, H * 0.62);
      ctx.lineTo(W * 0.10, H * 0.55);
      ctx.lineTo(W * 0.22, H * 0.60);
      ctx.lineTo(W * 0.34, H * 0.50);
      ctx.lineTo(W * 0.46, H * 0.58);
      ctx.lineTo(W * 0.58, H * 0.48);
      ctx.lineTo(W * 0.70, H * 0.56);
      ctx.lineTo(W * 0.82, H * 0.52);
      ctx.lineTo(W * 0.94, H * 0.58);
      ctx.lineTo(W, H * 0.55);
      ctx.lineTo(W, H * 0.78); ctx.lineTo(0, H * 0.78);
      ctx.closePath(); ctx.fill();

      // Mid range
      ctx.fillStyle = "rgba(10,18,34,0.92)";
      ctx.beginPath();
      ctx.moveTo(0, H * 0.72);
      ctx.lineTo(W * 0.08, H * 0.64);
      ctx.lineTo(W * 0.18, H * 0.70);
      ctx.lineTo(W * 0.30, H * 0.60);
      ctx.lineTo(W * 0.42, H * 0.68);
      ctx.lineTo(W * 0.55, H * 0.58);
      ctx.lineTo(W * 0.68, H * 0.66);
      ctx.lineTo(W * 0.80, H * 0.62);
      ctx.lineTo(W * 0.92, H * 0.70);
      ctx.lineTo(W, H * 0.66);
      ctx.lineTo(W, H * 0.78); ctx.lineTo(0, H * 0.78);
      ctx.closePath(); ctx.fill();

      // Fog bands (drifting horizontally)
      for (const fb of fogBands) {
        fb.off += fb.speed * dt * W;
        if (fb.off > W) fb.off -= W * 2;
        const fy = H * fb.y;
        const fh = H * fb.h;
        const fg = ctx.createLinearGradient(0, fy, 0, fy + fh);
        fg.addColorStop(0, `rgba(200,225,255,${fb.alpha * (ac ? 1 : 0.7)})`);
        fg.addColorStop(0.5, `rgba(180,210,240,${fb.alpha * 0.6 * (ac ? 1 : 0.7)})`);
        fg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = fg;
        // Offset wrapped band (drift)
        ctx.save();
        ctx.translate((fb.off % W) - W * 0.2, 0);
        ctx.fillRect(0, fy, W * 1.4, fh);
        ctx.restore();
      }

      // Water — dark plane with horizon line
      ctx.fillStyle = PAL.water;
      ctx.fillRect(0, H * 0.78, W, H * 0.22);

      // Water shimmer — multi-band, grows with orb scale (alive feeling)
      const shimmerA = 0.05 + (os - 0.55) * 0.16;
      ctx.fillStyle = `rgba(120,170,230,${shimmerA})`;
      for (let i = 0; i < 22; i++) {
        const y = H * 0.795 + i * (H * 0.014);
        const wob = Math.sin(t * 0.0006 + i * 0.7) * (6 + i * 0.4);
        const wid = W * (0.55 + 0.04 * Math.sin(t * 0.0004 + i));
        ctx.fillRect(W * 0.5 - wid / 2 + wob, y, wid, 0.55);
      }

      // Moon reflection on water
      const ry = H * 0.82;
      const rg = ctx.createRadialGradient(cx, ry, 0, cx, ry, W * 0.24);
      rg.addColorStop(0, `rgba(180,210,250,${0.20 + lift * 0.12})`);
      rg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(0, H * 0.78, W, H * 0.22);

      // Orb glow reflection in water (breathing reflection)
      const orbRefY = H * 0.86;
      const orbRefR = (W * 0.18) * (0.6 + (os - 0.55) * 0.9);
      const og2 = ctx.createRadialGradient(W * 0.5, orbRefY, 0, W * 0.5, orbRefY, orbRefR);
      const orbRefA = 0.08 + (os - 0.55) * 0.18;
      og2.addColorStop(0, `rgba(100,170,240,${orbRefA * (ac ? 1 : 0.4)})`);
      og2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = og2;
      ctx.fillRect(0, H * 0.78, W, H * 0.22);

      // Atmospheric dust — drifting particles with horizontal sway
      for (const p of parts) {
        const speed = ph === "inhale" ? 1.5 : ph === "exhale" ? 0.65 : 1.0;
        p.y -= p.vy * dt * speed;
        p.x += p.vx * dt;
        if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
        if (p.x < -0.05) p.x = 1.05;
        if (p.x > 1.05) p.x = -0.05;
        const edge = Math.min(1, Math.min(p.y, 1 - p.y) * 4);
        const flick = 0.6 + 0.4 * Math.sin(t * 0.001 + p.p);
        ctx.fillStyle = `rgba(200,225,255,${p.a * edge * flick * (ac ? 1 : 0.6)})`;
        ctx.beginPath(); ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2); ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0, display: "block" }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   Canvas Breathing Orb — 320×320 internal, CSS-scaled to 160
   ───────────────────────────────────────────────────────────── */
interface OrbProps {
  scale: number;       // current orb scale (animated)
  phase: BreathPhase;
  active: boolean;
}
function BreathingOrbCanvas({ scale, phase, active }: OrbProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ scale, phase, active });
  useEffect(() => { stateRef.current = { scale, phase, active }; }, [scale, phase, active]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const SIZE = 320;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let raf = 0;

    const draw = (now: number) => {
      const { scale: s, phase: ph, active: ac } = stateRef.current;
      ctx.clearRect(0, 0, SIZE, SIZE);

      const cx = SIZE / 2;
      const cy = SIZE / 2;
      const baseR = 80;
      const r = baseR * s;

      // Layer 1 — outer ambient glow
      const glowR = r * 2.2;
      const og = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, glowR);
      const glowA = ph === "inhale" ? 0.55 : ph === "hold" ? 0.50 : 0.32;
      og.addColorStop(0, `rgba(100,170,240,${glowA})`);
      og.addColorStop(0.35, `rgba(80,140,220,${glowA * 0.45})`);
      og.addColorStop(0.7, `rgba(60,110,200,${glowA * 0.15})`);
      og.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = og;
      ctx.beginPath(); ctx.arc(cx, cy, glowR, 0, Math.PI * 2); ctx.fill();

      // Layer 4 — twin soft waveforms below orb (NEVER white)
      ctx.save();
      const scaleFactor = Math.max(0.3, s);
      const wy = cy + baseR + 50;
      const amp = 6 + (s - 0.55) * 28;

      // Primary wave
      ctx.strokeStyle = `rgba(80, 150, 220, ${0.15 * scaleFactor})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let x = 20; x <= SIZE - 20; x += 2) {
        const py = wy + Math.sin((x / 16) + now * 0.002) * amp;
        if (x === 20) ctx.moveTo(x, py); else ctx.lineTo(x, py);
      }
      ctx.stroke();

      // Depth wave (offset, softer)
      ctx.strokeStyle = `rgba(60, 120, 195, ${0.08 * scaleFactor})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let x = 20; x <= SIZE - 20; x += 2) {
        const py = (wy + 10) + Math.sin((x / 16) + now * 0.002 + 0.4) * (amp * 0.5);
        if (x === 20) ctx.moveTo(x, py); else ctx.lineTo(x, py);
      }
      ctx.stroke();
      ctx.restore();

      // Layer 2 — core sphere with subtle liquid distortion
      ctx.save();
      ctx.beginPath();
      const distortAmp = r * 0.012;
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.06) {
        const wob = Math.sin(a * 3 + now * 0.0009) * distortAmp + Math.sin(a * 5 - now * 0.0006) * (distortAmp * 0.5);
        const rr = r + wob;
        const px = cx + Math.cos(a) * rr;
        const py = cy + Math.sin(a) * rr;
        if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.clip();

      const sg = ctx.createRadialGradient(
        cx - r * 0.30, cy - r * 0.30, r * 0.05,
        cx, cy, r
      );
      sg.addColorStop(0, "rgba(235,245,255,0.95)");
      sg.addColorStop(0.25, "rgba(160,200,245,0.85)");
      sg.addColorStop(0.65, "rgba(74,143,196,0.55)");
      sg.addColorStop(1, "rgba(20,50,100,0.20)");
      ctx.fillStyle = sg;
      ctx.fillRect(cx - r * 1.2, cy - r * 1.2, r * 2.4, r * 2.4);

      // Internal floating particles inside orb (life inside)
      const innerCount = 18;
      for (let i = 0; i < innerCount; i++) {
        const ang = (i / innerCount) * Math.PI * 2 + now * 0.0004;
        const rad = r * (0.15 + 0.6 * ((i * 37) % 100) / 100);
        const drift = Math.sin(now * 0.0011 + i * 1.3) * (r * 0.08);
        const px = cx + Math.cos(ang) * rad + drift;
        const py = cy + Math.sin(ang) * rad - drift * 0.6;
        const pr = 0.7 + 0.6 * Math.sin(now * 0.0018 + i);
        const pa = (0.18 + 0.14 * Math.sin(now * 0.0014 + i * 0.7)) * (ac ? 1 : 0.5);
        ctx.fillStyle = `rgba(220,235,255,${pa})`;
        ctx.beginPath(); ctx.arc(px, py, Math.max(0.3, pr), 0, Math.PI * 2); ctx.fill();
      }

      // Liquid sheen highlight band
      const sheenA = 0.10 + 0.06 * Math.sin(now * 0.001);
      ctx.fillStyle = `rgba(255,255,255,${sheenA})`;
      ctx.beginPath();
      ctx.ellipse(cx - r * 0.25, cy - r * 0.35, r * 0.45, r * 0.18, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Volumetric edge glow (thin luminous rim)
      ctx.strokeStyle = `rgba(160,210,255,${0.28 * (ac ? 1 : 0.5)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(cx, cy, r * 1.005, 0, Math.PI * 2); ctx.stroke();

      // Inner rim shadow for spherical depth
      ctx.strokeStyle = "rgba(10,20,40,0.30)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.98, 0, Math.PI * 2); ctx.stroke();

      // Layer 3 — 8 orbital particles
      const orbitA = ph === "inhale" ? 0.85 : ph === "hold" ? 0.70 : 0.40;
      const orbitSpeed = ph === "hold" ? 0.0003 : 0.0008;
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2 + now * orbitSpeed;
        const rad = r + 22 + Math.sin(now * 0.0012 + i) * 8;
        const px = cx + Math.cos(ang) * rad * 1.1;
        const py = cy + Math.sin(ang) * rad * 0.7;
        const pr = 1.6 + Math.sin(now * 0.002 + i) * 0.6;
        ctx.fillStyle = `rgba(180,215,250,${orbitA * (ac ? 1 : 0.5)})`;
        ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        width: 320,
        height: 320,
        display: "block",
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   Smooth-followed orb scale (frame-rate independent)
   ───────────────────────────────────────────────────────────── */
function useSmoothScale(target: number) {
  const [scale, setScale] = useState(target);
  const cur = useRef(target);
  const tgt = useRef(target);
  useEffect(() => { tgt.current = target; }, [target]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      cur.current += (tgt.current - cur.current) * 0.04;
      setScale(cur.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return scale;
}

/* ─────────────────────────────────────────────────────────────
   Voice Breathing Guide (Web Speech API)
   ───────────────────────────────────────────────────────────── */
function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const preferredNames = ["Samantha", "Karen", "Moira", "Google UK English Female", "Microsoft Zira"];
  for (const name of preferredNames) {
    const v = voices.find(v => v.name.includes(name));
    if (v) return v;
  }
  const enFemale = voices.find(v => /en[-_]/i.test(v.lang) && /female/i.test(v.name));
  if (enFemale) return enFemale;
  const enUS = voices.find(v => v.lang === "en-US");
  return enUS ?? voices.find(v => v.lang.startsWith("en")) ?? null;
}

function useVoiceGuide(phase: BreathPhase, running: boolean) {
  const lastSpoken = useRef<BreathPhase | "">("");
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => { voiceRef.current = pickVoice(); };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (!running) {
      window.speechSynthesis.cancel();
      lastSpoken.current = "";
      return;
    }
    if (phase === "rest") return;
    if (lastSpoken.current === phase) return;
    lastSpoken.current = phase;
    const word = phase === "inhale" ? "Inhale" : phase === "hold" ? "Hold" : "Exhale";
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.rate = 0.72;
    u.pitch = 0.80;
    u.volume = 0.90;
    if (voiceRef.current) u.voice = voiceRef.current;
    window.speechSynthesis.speak(u);
  }, [phase, running]);

  useEffect(() => () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);
}

/* ─────────────────────────────────────────────────────────────
   Tool sub-panel content
   ───────────────────────────────────────────────────────────── */
function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.72;
  u.pitch = 0.80;
  u.volume = 0.90;
  const v = pickVoice();
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

interface SubPanelItem { title: string; guidance: string; }
const SUBPANELS: Record<string, { heading: string; items: SubPanelItem[] }> = {
  Meditation: {
    heading: "Meditation",
    items: [
      { title: "Breath Awareness",   guidance: "Rest attention on the natural breath. Follow each inhale, each exhale, without changing them." },
      { title: "Thought Observation",guidance: "Watch thoughts arise and pass like clouds. You are the sky, not the weather." },
      { title: "Body Softening",     guidance: "Sweep gentle awareness through the body. Soften the jaw, the shoulders, the hands." },
      { title: "Visualisation",      guidance: "Picture still water under moonlight. Let the image hold you. Become part of the scene." },
    ],
  },
  "Sleep Prep": {
    heading: "Sleep Preparation",
    items: [
      { title: "Progressive Release", guidance: "Tense each muscle group for five seconds, then release completely. Move from feet to crown." },
      { title: "Cognitive Offload",   guidance: "Name each unfinished thought, then place it gently outside the room until morning." },
      { title: "4-8 Sleep Breath",    guidance: "Inhale for four counts. Exhale for eight. The long exhale signals the body to descend." },
      { title: "Body Heaviness",      guidance: "Imagine each limb growing warm and heavy, sinking deeper into the surface beneath you." },
    ],
  },
  "Body Scan": {
    heading: "Body Scan",
    items: [
      { title: "Crown → Forehead",  guidance: "Bring awareness to the crown of the head. Soften the forehead. Release the space behind the eyes." },
      { title: "Jaw → Shoulders",   guidance: "Unclench the jaw. Let the tongue rest. Allow the shoulders to drop away from the ears." },
      { title: "Chest → Heart",     guidance: "Feel the breath move through the chest. Sense the steady rhythm beneath the ribs." },
      { title: "Core → Legs",       guidance: "Soften the belly. Release the hips. Let the legs grow heavy, grounded, supported." },
    ],
  },
  Gratitude: {
    heading: "Gratitude Reflection",
    items: [
      { title: "A Person",       guidance: "Bring to mind someone who shaped you. Hold their face. Feel the warmth of that connection." },
      { title: "A Moment",       guidance: "Recall a single moment of beauty from today. The light, the sound, the feeling of being there." },
      { title: "Your Body",      guidance: "Thank the body for carrying you. The breath that continues. The heart that has never stopped." },
      { title: "Your Progress", guidance: "Acknowledge how far you have come. Every quiet effort. Every breath that brought you here." },
    ],
  },
};

function ToolSubPanel({ tool }: { tool: keyof typeof SUBPANELS }) {
  const cfg = SUBPANELS[tool];
  const [selected, setSelected] = useState<number | null>(null);
  useEffect(() => { setSelected(null); }, [tool]);

  return (
    <motion.div
      key={tool}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center"
      style={{ width: "100%", maxWidth: 480 }}
    >
      <h2 style={{
        fontFamily: FONT_DISPLAY,
        fontWeight: 300,
        fontSize: "22px",
        letterSpacing: "0.03em",
        color: PAL.text,
        marginBottom: 28,
      }}>
        {cfg.heading}
      </h2>

      <div className="flex flex-col gap-2 w-full">
        {cfg.items.map((it, i) => {
          const on = selected === i;
          return (
            <button
              key={it.title}
              onClick={() => { setSelected(i); speak(it.guidance); }}
              className="text-left cursor-pointer transition-all"
              style={{
                background: on ? "rgba(74,143,196,0.08)" : "transparent",
                border: `1px solid ${on ? "rgba(100,140,200,0.18)" : "rgba(100,140,200,0.06)"}`,
                borderRadius: 12,
                padding: "14px 18px",
              }}
            >
              <div style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 400,
                fontSize: "16px",
                color: on ? PAL.text : PAL.textDim,
                letterSpacing: "0.02em",
              }}>
                {it.title}
              </div>
              <AnimatePresence>
                {on && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontStyle: "italic",
                      fontWeight: 300,
                      fontSize: "13.5px",
                      lineHeight: 1.55,
                      color: PAL.textDim,
                      marginTop: 8,
                      overflow: "hidden",
                    }}
                  >
                    {it.guidance}
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}



/* ─────────────────────────────────────────────────────────────
   Biometric Stream — evolves per cycle
   ───────────────────────────────────────────────────────────── */
type MetricKey = "fatigue" | "cortisol" | "para" | "hrv";
interface Metric { key: MetricKey; label: string; value: number; dir: -1 | 1; }
const INITIAL_METRICS: Metric[] = [
  { key: "fatigue",  label: "Nervous System",        value: 72, dir: -1 },
  { key: "cortisol", label: "Cortisol Dissolving",   value: 58, dir: -1 },
  { key: "para",     label: "Breathing Coherence",   value: 34, dir:  1 },
  { key: "hrv",      label: "Heart Stabilizing",     value: 28, dir:  1 },
];

/* ─────────────────────────────────────────────────────────────
   Recovery Tools chips
   ───────────────────────────────────────────────────────────── */
const TOOLS = ["Breathwork", "Meditation", "Sleep Prep", "Body Scan", "Gratitude"] as const;

/* ─────────────────────────────────────────────────────────────
   Time helpers
   ───────────────────────────────────────────────────────────── */
function fmt(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ─────────────────────────────────────────────────────────────
   Main component
   ───────────────────────────────────────────────────────────── */
export function RecoveryMode() {
  const { mode, setMode } = useOS();
  const visible = mode === "recovery";

  const [patternIdx, setPatternIdx] = useState(0);
  const [activeTool, setActiveTool] = useState<typeof TOOLS[number]>("Breathwork");
  const [metrics, setMetrics] = useState<Metric[]>(INITIAL_METRICS);

  const { state: breath, start: startBreath, stop: stopBreath, reset: resetBreath } =
    useBreathingEngine({ pattern: BREATH_PATTERNS[patternIdx] });

  const [audio, audioControls] = useAmbientAudio();

  // session timing
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds counting up
  const startedAt = useRef<number>(0);
  const accumulated = useRef<number>(0);
  const tickRef = useRef<number>(0);

  // tick session clock
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const now = Date.now();
      setElapsed(Math.floor((accumulated.current + (now - startedAt.current)) / 1000));
      tickRef.current = requestAnimationFrame(tick);
    };
    tickRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(tickRef.current);
  }, [running]);

  // Persistence — once per cycle
  const lastSavedCycle = useRef(-1);
  useEffect(() => {
    if (breath.cycle !== lastSavedCycle.current) {
      lastSavedCycle.current = breath.cycle;
      try {
        localStorage.setItem("routineos_recovery_state", JSON.stringify({
          patternIdx, cycles: breath.cycle, elapsed, ts: Date.now(),
        }));
      } catch { /* noop */ }

      // Evolve metrics each completed cycle (skip the 0->0 initial render)
      if (breath.cycle > 0) {
        setMetrics(prev => prev.map(m => {
          const step = (2 + Math.random() * 4) * m.dir;
          const next = Math.max(5, Math.min(98, m.value + step));
          return { ...m, value: next };
        }));
      }
    }
  }, [breath.cycle, patternIdx, elapsed]);

  // Smooth orb scale: inhale -> 1.0, exhale -> 0.55, hold -> hold current target
  const targetScale = (() => {
    if (!running) return 0.55;
    if (breath.phase === "inhale") return 1.0;
    if (breath.phase === "exhale") return 0.55;
    if (breath.phase === "hold")   return 1.0;
    return 0.55;
  })();
  const orbScale = useSmoothScale(targetScale);
  useVoiceGuide(breath.phase, running);

  const handleBegin = useCallback(() => {
    if (running) return;
    if (paused) {
      startedAt.current = Date.now();
      setRunning(true);
      setPaused(false);
      startBreath();
      return;
    }
    accumulated.current = 0;
    startedAt.current = Date.now();
    setElapsed(0);
    setRunning(true);
    startBreath();
  }, [running, paused, startBreath]);

  const handlePause = useCallback(() => {
    if (!running) return;
    accumulated.current += Date.now() - startedAt.current;
    setRunning(false);
    setPaused(true);
    stopBreath();
  }, [running, stopBreath]);

  const handleReset = useCallback(() => {
    accumulated.current = 0;
    setRunning(false);
    setPaused(false);
    setElapsed(0);
    resetBreath();
    setMetrics(INITIAL_METRICS);
    try { localStorage.removeItem("routineos_recovery_state"); } catch { /* noop */ }
  }, [resetBreath]);

  const handleExit = useCallback(() => {
    handleReset();
    audioControls.stop();
    setMode("operator");
  }, [handleReset, audioControls, setMode]);

  // Update breathing pattern when changed
  useEffect(() => {
    if (running) {
      // pattern change during run: reset breath internals safely
      resetBreath();
      startBreath();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patternIdx]);

  // Coherence score
  const coherence = breath.cycle >= 3 ? Math.min(95, 40 + breath.cycle * 12) : null;

  // Active protocol
  const protocol = BREATH_PATTERNS[patternIdx];

  // CTA label
  const ctaLabel = running ? "Entering Restoration" : paused ? "Resume" : "Begin Session";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="recovery-sanctuary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 overflow-hidden"
          style={{
            zIndex: 45,
            background: PAL.void,
            fontFamily: FONT_UI,
            color: PAL.text,
          }}
        >
          {/* Canvas environment */}
          <RecoveryEnvironment orbScale={orbScale} phase={breath.phase} active={running} />

          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: 1,
              background:
                "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)",
            }}
          />

          {/* Cinematic state overlay — darkens on session start (interface quiets itself) */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: running ? 1 : 0 }}
            transition={{ duration: 3.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              zIndex: 2,
              background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.45) 90%)",
            }}
          />

          {/* Completion warmth — sunrise tint after sustained restoration */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: breath.cycle >= 6 ? 1 : 0 }}
            transition={{ duration: 6, ease: "easeInOut" }}
            style={{
              zIndex: 3,
              background: "linear-gradient(180deg, transparent 0%, transparent 55%, rgba(255,180,120,0.06) 78%, rgba(255,200,140,0.10) 100%)",
            }}
          />


          {/* HUD: exit */}
          <motion.button
            onClick={handleExit}
            whileHover={{ opacity: 1 }}
            className="absolute top-5 right-6 flex items-center gap-2 cursor-pointer"
            style={{
              zIndex: 20,
              background: "transparent",
              border: "none",
              color: PAL.textMut,
              fontFamily: FONT_UI,
              fontSize: "10px",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
            }}
          >
            <X className="w-3.5 h-3.5" />
            Exit Sanctuary
          </motion.button>

          {/* HUD: identity */}
          <div
            className="absolute top-5 left-6"
            style={{ zIndex: 20 }}
          >
            <div style={{
              fontFamily: FONT_UI,
              fontWeight: 300,
              fontSize: "10px",
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: PAL.textMut,
            }}>
              Routine OS · Recovery
            </div>
          </div>

          {/* ╔══════════════════════════════════════════════════
              THREE-PANEL LAYOUT
              ╚══════════════════════════════════════════════════ */}
          <div
            className="relative w-full h-full flex items-stretch"
            style={{ zIndex: 10 }}
          >
            {/* LEFT — Protocol + Sound */}
            <aside
              className="shrink-0 h-full flex flex-col"
              style={{
                width: 240,
                padding: "80px 22px 28px 28px",
                borderRight: `1px solid ${PAL.hair}`,
              }}
            >
              <PanelHeader title="Restoration Protocol" />
              <div className="flex flex-col gap-1.5 mt-3">
                {BREATH_PATTERNS.map((p, i) => {
                  const active = patternIdx === i;
                  return (
                    <button
                      key={p.name}
                      onClick={() => setPatternIdx(i)}
                      className="text-left cursor-pointer transition-all"
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: "8px 0",
                        borderBottom: `1px solid ${active ? "rgba(100,140,200,0.18)" : "transparent"}`,
                      }}
                    >
                      <div style={{
                        fontFamily: FONT_DISPLAY,
                        fontWeight: 400,
                        fontSize: "16px",
                        letterSpacing: "0.02em",
                        color: active ? PAL.text : PAL.textDim,
                        lineHeight: 1.2,
                      }}>
                        {p.name}
                      </div>
                      <div style={{
                        fontFamily: FONT_UI,
                        fontWeight: 300,
                        fontSize: "9.5px",
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: PAL.textMut,
                        marginTop: 3,
                      }}>
                        {p.inhale}·{p.hold}·{p.exhale}{p.rest ? `·${p.rest}` : ""}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8">
                <PanelHeader title="Atmosphere" />
                <div className="flex flex-col gap-1.5 mt-3">
                  {AMBIENT_PRESETS.slice(0, 6).map((s) => {
                    const on = audio.current === s.id && audio.active;
                    const tint = ATMOSPHERE_TINT[s.id] ?? ATMOSPHERE_TINT.default;
                    return (
                      <motion.button
                        key={s.id}
                        onClick={() => audioControls.toggle(s.id as AmbientSound)}
                        whileHover={{ x: 2 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="text-left cursor-pointer relative overflow-hidden"
                        style={{
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: `1px solid ${on ? tint.border : "rgba(100,140,200,0.05)"}`,
                          background: on
                            ? `linear-gradient(135deg, ${tint.bgA} 0%, ${tint.bgB} 100%)`
                            : "rgba(100,140,200,0.02)",
                          transition: "all 0.6s ease",
                        }}
                      >
                        {on && (
                          <motion.div
                            className="absolute inset-0 pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0.3, 0.55, 0.3] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            style={{
                              background: `radial-gradient(ellipse at 20% 50%, ${tint.glow} 0%, transparent 70%)`,
                            }}
                          />
                        )}
                        <div className="relative flex items-center justify-between">
                          <span style={{
                            fontFamily: FONT_DISPLAY,
                            fontWeight: 300,
                            fontSize: "14px",
                            color: on ? PAL.text : PAL.textDim,
                            letterSpacing: "0.02em",
                          }}>
                            {s.label}
                          </span>
                          <span style={{
                            width: 5, height: 5, borderRadius: 999,
                            background: on ? tint.dot : "rgba(100,140,200,0.18)",
                            boxShadow: on ? `0 0 10px ${tint.dot}` : "none",
                          }} />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>


                {/* Volume */}
                <div className="mt-4">
                  <div style={{
                    fontFamily: FONT_UI,
                    fontWeight: 300,
                    fontSize: "9px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    color: PAL.textMut,
                    marginBottom: 8,
                  }}>
                    Volume · {Math.round(audio.volume * 100)}%
                  </div>
                  <div className="relative h-[2px] rounded-full" style={{ background: "rgba(100,140,200,0.10)" }}>
                    <div
                      className="absolute left-0 top-0 h-full rounded-full"
                      style={{
                        width: `${audio.volume * 100}%`,
                        background: PAL.blue,
                        boxShadow: `0 0 8px ${PAL.blue}`,
                      }}
                    />
                    <input
                      type="range"
                      min={0} max={1} step={0.01}
                      value={audio.volume}
                      onChange={(e) => audioControls.setVolume(parseFloat(e.target.value))}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer"
                      style={{ height: 16, top: -7 }}
                    />
                  </div>
                </div>
              </div>
            </aside>

            {/* CENTER — Orb + controls */}
            <main
              className="flex-1 h-full flex flex-col items-center justify-center relative"
              style={{ padding: "60px 24px 28px" }}
            >
              {/* Phase label */}
              <div className="absolute top-[14%] left-1/2 -translate-x-1/2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={running ? breath.phase : "ready"}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.6 }}
                    style={{
                      fontFamily: FONT_UI,
                      fontWeight: 200,
                      fontSize: "11px",
                      letterSpacing: "0.46em",
                      textTransform: "uppercase",
                      color: PAL.textDim,
                      textAlign: "center",
                    }}
                  >
                    {running
                      ? (breath.phase === "inhale" ? "Inhale"
                        : breath.phase === "hold" ? "Hold"
                        : breath.phase === "exhale" ? "Exhale"
                        : "Rest")
                      : paused ? "Paused" : "Awaiting"}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Orb OR Tool sub-panel */}
              <AnimatePresence mode="wait">
                {activeTool === "Breathwork" ? (
                  <motion.div
                    key="orb-block"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col items-center"
                  >
                    <div
                      style={{
                        width: 160, height: 160,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <div style={{ transform: "scale(0.5)", transformOrigin: "center" }}>
                        <BreathingOrbCanvas scale={orbScale} phase={breath.phase} active={running} />
                      </div>
                    </div>

                    <div className="mt-10 text-center">
                      <div style={{
                        fontFamily: FONT_DISPLAY,
                        fontWeight: 300,
                        fontSize: "64px",
                        lineHeight: 1,
                        letterSpacing: "0.04em",
                        color: PAL.text,
                      }}>
                        {running ? breath.phaseSecondsLeft : "—"}
                      </div>
                      <div style={{
                        fontFamily: FONT_UI,
                        fontWeight: 300,
                        fontSize: "10px",
                        letterSpacing: "0.36em",
                        textTransform: "uppercase",
                        color: PAL.textMut,
                        marginTop: 14,
                      }}>
                        {protocol.name} · cycle {breath.cycle}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <ToolSubPanel key={activeTool} tool={activeTool as keyof typeof SUBPANELS} />
                )}
              </AnimatePresence>


              {/* Controls */}
              <div className="mt-12 flex items-center gap-3">
                <PillButton onClick={handleReset} disabled={!running && !paused && elapsed === 0}>
                  Reset
                </PillButton>
                <PillButton
                  onClick={running ? undefined : handleBegin}
                  primary
                  disabled={running}
                >
                  {ctaLabel}
                </PillButton>
                <PillButton onClick={handlePause} disabled={!running}>
                  Pause
                </PillButton>
              </div>

              {/* Recovery Tools chips */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {TOOLS.map((t) => {
                  const on = activeTool === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setActiveTool(t)}
                      className="cursor-pointer transition-all"
                      style={{
                        fontFamily: FONT_UI,
                        fontWeight: 300,
                        fontSize: "10px",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: on ? PAL.text : PAL.textMut,
                        padding: "7px 14px",
                        borderRadius: 30,
                        border: `1px solid ${on ? "rgba(100,140,200,0.20)" : "transparent"}`,
                        background: on ? "rgba(74,143,196,0.10)" : "transparent",
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </main>

            {/* RIGHT — Biometrics + Session */}
            <aside
              className="shrink-0 h-full flex flex-col"
              style={{
                width: 240,
                padding: "80px 28px 28px 22px",
                borderLeft: `1px solid ${PAL.hair}`,
              }}
            >
              <PanelHeader title="Biometrics" />
              <div className="flex flex-col gap-4 mt-4">
                {metrics.map((m) => (
                  <div key={m.key}>
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span style={{
                        fontFamily: FONT_DISPLAY,
                        fontWeight: 400,
                        fontSize: "13px",
                        color: PAL.textDim,
                        letterSpacing: "0.02em",
                      }}>
                        {m.label}
                      </span>
                      <span style={{
                        fontFamily: FONT_UI,
                        fontWeight: 300,
                        fontSize: "11px",
                        color: PAL.text,
                        fontVariantNumeric: "tabular-nums",
                      }}>
                        {Math.round(m.value)}%
                      </span>
                    </div>
                    <div className="relative h-[2px] rounded-full" style={{ background: "rgba(100,140,200,0.10)" }}>
                      <div
                        className="absolute left-0 top-0 h-full rounded-full"
                        style={{
                          width: `${m.value}%`,
                          background: m.dir === 1 ? PAL.blue : "rgba(140,180,220,0.55)",
                          boxShadow: `0 0 6px ${m.dir === 1 ? "rgba(74,143,196,0.6)" : "rgba(140,180,220,0.4)"}`,
                          transition: "width 1.5s ease",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <PanelHeader title="Session" />
                <div className="flex flex-col gap-2.5 mt-4">
                  <SessionRow label="Duration" value={fmt(elapsed)} mono />
                  <SessionRow label="Cycles" value={String(breath.cycle)} mono />
                  <SessionRow label="Protocol" value={protocol.name} />
                  <SessionRow
                    label="Coherence"
                    value={coherence !== null ? `${coherence}%` : "—"}
                    mono
                    dim={coherence === null}
                  />
                </div>
              </div>

              <div className="mt-auto pt-6">
                <div style={{
                  fontFamily: FONT_DISPLAY,
                  fontWeight: 300,
                  fontStyle: "italic",
                  fontSize: "13px",
                  lineHeight: 1.5,
                  color: PAL.textMut,
                  letterSpacing: "0.01em",
                }}>
                  The nervous system is recovering. Stay. Breathe. You have arrived.
                </div>
              </div>
            </aside>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────────
   Small UI atoms
   ───────────────────────────────────────────────────────────── */
function PanelHeader({ title }: { title: string }) {
  return (
    <div style={{
      fontFamily: FONT_UI,
      fontWeight: 400,
      fontSize: "9.5px",
      letterSpacing: "0.36em",
      textTransform: "uppercase",
      color: PAL.textMut,
      paddingBottom: 10,
      borderBottom: `1px solid ${PAL.hair}`,
    }}>
      {title}
    </div>
  );
}

function SessionRow({ label, value, mono, dim }: { label: string; value: string; mono?: boolean; dim?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span style={{
        fontFamily: FONT_UI,
        fontWeight: 300,
        fontSize: "10px",
        letterSpacing: "0.20em",
        textTransform: "uppercase",
        color: PAL.textMut,
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: mono ? FONT_UI : FONT_DISPLAY,
        fontWeight: mono ? 300 : 400,
        fontSize: mono ? "12px" : "14px",
        color: dim ? PAL.textMut : PAL.text,
        fontVariantNumeric: mono ? "tabular-nums" : "normal",
        letterSpacing: mono ? "0.04em" : "0.01em",
      }}>
        {value}
      </span>
    </div>
  );
}

function PillButton({
  children, onClick, primary, disabled,
}: { children: React.ReactNode; onClick?: () => void; primary?: boolean; disabled?: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.04, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        fontFamily: FONT_UI,
        fontWeight: 400,
        fontSize: "11px",
        letterSpacing: "0.20em",
        textTransform: "uppercase",
        color: disabled ? "rgba(140,170,210,0.25)" : primary ? PAL.text : PAL.textDim,
        padding: "11px 24px",
        borderRadius: 40,
        border: `1px solid ${primary ? "rgba(100,170,240,0.45)" : "rgba(74,143,196,0.30)"}`,
        background: primary ? "rgba(74,143,196,0.18)" : "rgba(74,143,196,0.08)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        boxShadow: primary ? `0 0 28px rgba(74,143,196,0.30), inset 0 1px 0 rgba(255,255,255,0.05)` : "none",
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        (e.currentTarget as HTMLButtonElement).style.background = primary
          ? "rgba(74,143,196,0.28)" : "rgba(74,143,196,0.18)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = primary
          ? "0 0 40px rgba(100,170,240,0.45), inset 0 1px 0 rgba(255,255,255,0.08)"
          : "0 0 18px rgba(74,143,196,0.18)";
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        (e.currentTarget as HTMLButtonElement).style.background = primary
          ? "rgba(74,143,196,0.18)" : "rgba(74,143,196,0.08)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = primary
          ? "0 0 28px rgba(74,143,196,0.30), inset 0 1px 0 rgba(255,255,255,0.05)" : "none";
      }}
    >
      {children}
    </motion.button>
  );
}

