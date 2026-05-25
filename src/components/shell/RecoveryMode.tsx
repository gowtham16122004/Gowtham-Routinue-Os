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

    // Rising particles
    const parts = Array.from({ length: 60 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vy: 0.00018 + Math.random() * 0.00035,
      r: Math.random() * 1.4 + 0.3,
      a: Math.random() * 0.35 + 0.08,
      p: Math.random() * Math.PI * 2,
    }));

    // Fog bands
    const fogBands = [
      { y: 0.58, h: 0.18, speed: 0.000020, off: 0,     alpha: 0.10 },
      { y: 0.62, h: 0.22, speed: 0.000035, off: 200,   alpha: 0.08 },
      { y: 0.66, h: 0.16, speed: 0.000055, off: 400,   alpha: 0.07 },
      { y: 0.70, h: 0.14, speed: 0.000080, off: 600,   alpha: 0.06 },
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

      // Water shimmer tied to orb scale
      const shimmerA = 0.04 + (os - 0.55) * 0.10;
      ctx.fillStyle = `rgba(120,170,230,${shimmerA})`;
      for (let i = 0; i < 14; i++) {
        const y = H * 0.80 + i * (H * 0.018);
        const wob = Math.sin(t * 0.0006 + i * 0.7) * 6;
        ctx.fillRect(W * 0.20 + wob, y, W * 0.60, 0.6);
      }

      // Moon reflection on water
      const ry = H * 0.82;
      const rg = ctx.createRadialGradient(cx, ry, 0, cx, ry, W * 0.22);
      rg.addColorStop(0, `rgba(180,210,250,${0.18 + lift * 0.10})`);
      rg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(0, H * 0.78, W, H * 0.22);

      // Rising particles
      for (const p of parts) {
        const speed = ph === "inhale" ? 1.6 : ph === "exhale" ? 0.7 : 1.0;
        p.y -= p.vy * dt * speed;
        if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
        // alpha fades at top/bottom edges
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

      // Layer 2 — core sphere (with offset highlight)
      const sg = ctx.createRadialGradient(
        cx - r * 0.30, cy - r * 0.30, r * 0.05,
        cx, cy, r
      );
      sg.addColorStop(0, "rgba(235,245,255,0.95)");
      sg.addColorStop(0.25, "rgba(160,200,245,0.85)");
      sg.addColorStop(0.65, "rgba(74,143,196,0.55)");
      sg.addColorStop(1, "rgba(20,50,100,0.20)");
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

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
   Biometric Stream — evolves per cycle
   ───────────────────────────────────────────────────────────── */
type MetricKey = "fatigue" | "cortisol" | "para" | "hrv";
interface Metric { key: MetricKey; label: string; value: number; dir: -1 | 1; }
const INITIAL_METRICS: Metric[] = [
  { key: "fatigue",  label: "Cognitive Fatigue",     value: 72, dir: -1 },
  { key: "cortisol", label: "Cortisol Level",        value: 58, dir: -1 },
  { key: "para",     label: "Parasympathetic Tone",  value: 34, dir:  1 },
  { key: "hrv",      label: "HRV Coherence",         value: 28, dir:  1 },
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
  const ctaLabel = running ? "Running" : paused ? "Resume" : "Begin Session";

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
              <PanelHeader title="Protocol" />
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
                <div className="flex flex-col gap-1 mt-3">
                  {AMBIENT_PRESETS.slice(0, 6).map((s) => {
                    const on = audio.current === s.id && audio.active;
                    return (
                      <button
                        key={s.id}
                        onClick={() => audioControls.toggle(s.id as AmbientSound)}
                        className="text-left cursor-pointer flex items-center justify-between"
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: "6px 0",
                        }}
                      >
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
                          width: 6, height: 6, borderRadius: 999,
                          background: on ? PAL.blueHi : "rgba(100,140,200,0.18)",
                          boxShadow: on ? `0 0 10px ${PAL.blueHi}` : "none",
                        }} />
                      </button>
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
                      : paused ? "Paused" : "Stillness"}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Orb (CSS scaled to 160) */}
              <div
                style={{
                  width: 160, height: 160,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transform: "scale(1)",
                }}
              >
                <div style={{ transform: "scale(0.5)", transformOrigin: "center" }}>
                  <BreathingOrbCanvas scale={orbScale} phase={breath.phase} active={running} />
                </div>
              </div>

              {/* Timer beneath orb */}
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
                  Still water. Quiet mind. You have arrived somewhere safe.
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
    <button
      onClick={onClick}
      disabled={disabled}
      className="transition-all"
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
        transition: "all 0.35s ease",
        boxShadow: primary ? `0 0 24px rgba(74,143,196,0.25)` : "none",
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        (e.currentTarget as HTMLButtonElement).style.background = primary
          ? "rgba(74,143,196,0.28)" : "rgba(74,143,196,0.18)";
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        (e.currentTarget as HTMLButtonElement).style.background = primary
          ? "rgba(74,143,196,0.18)" : "rgba(74,143,196,0.08)";
      }}
    >
      {children}
    </button>
  );
}
