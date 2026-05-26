import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOS } from "@/lib/os-store";

/* ─── Palette: Deep ocean trench at midnight ─── */
const PAL = {
  bg:        "#020a0e",
  bgMid:     "#041418",
  bgBot:     "#020c10",
  teal:      "#0d4f5c",
  accent:    "#1a9aaa",
  glow:      "rgba(26,154,170,0.85)",
  particle:  "rgba(80,200,220,0.4)",
  text:      "rgba(200,230,235,0.88)",
  textMut:   "rgba(100,160,170,0.45)",
  border:    "rgba(26,154,170,0.07)",
  ring:      "rgba(26,154,170,0.6)",
  active:    "rgba(26,154,170,0.18)",
};
const FONT_DISPLAY = `"Cormorant Garamond", Georgia, serif`;
const FONT_UI = `"DM Sans", ui-sans-serif, system-ui, sans-serif`;

const LS_KEY = "deepmode_state_v2";
const fmtTime = (s: number) => {
  s = Math.max(0, Math.round(s));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

/* ──────────────────────────────────────────────
   Background canvas: ocean trench
   ────────────────────────────────────────────── */
function OceanCanvas({ running, elapsedRatio }: { running: boolean; elapsedRatio: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ running, elapsedRatio });
  useEffect(() => { stateRef.current = { running, elapsedRatio }; }, [running, elapsedRatio]);

  useEffect(() => {
    const cvs = ref.current; if (!cvs) return;
    const ctx = cvs.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    const resize = () => {
      W = cvs.clientWidth; H = cvs.clientHeight;
      cvs.width = W * dpr; cvs.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(cvs);

    interface P { x:number; y:number; vx:number; vy:number; r:number; a:number; phase:number; life:number; max:number; }
    const mkParticle = (edge = false): P => {
      const a = Math.random() * 0.35 + 0.1;
      let x = Math.random() * W, y = Math.random() * H;
      if (edge) {
        const side = Math.floor(Math.random() * 4);
        if (side === 0) { x = -10; y = Math.random() * H; }
        else if (side === 1) { x = W + 10; y = Math.random() * H; }
        else if (side === 2) { x = Math.random() * W; y = -10; }
        else { x = Math.random() * W; y = H + 10; }
      }
      return {
        x, y,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.4 + 0.8,
        a,
        phase: Math.random() * Math.PI * 2,
        life: 0,
        max: Math.random() * 1400 + 800,
      };
    };
    const particles: P[] = Array.from({ length: 120 }, () => mkParticle(false));

    interface Ring { r:number; alpha:number; }
    const rings: Ring[] = [];
    let ringTimer = 0;

    let t = 0;
    let raf = 0;
    const loop = () => {
      t += 1;
      const { running, elapsedRatio } = stateRef.current;
      const speedMul = running ? 1.8 : 1;
      const opMul = running ? 1.5 : 1;
      const densityBoost = 1 + 0.4 * elapsedRatio;
      const darkenBoost = 1 - 0.08 * elapsedRatio;

      // Layer 1: gradient base
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      const shade = (hex: string) => {
        // simple darken by darkenBoost
        const r = parseInt(hex.slice(1,3),16) * darkenBoost;
        const g = parseInt(hex.slice(3,5),16) * darkenBoost;
        const b = parseInt(hex.slice(5,7),16) * darkenBoost;
        return `rgb(${r|0},${g|0},${b|0})`;
      };
      grad.addColorStop(0, shade(PAL.bg));
      grad.addColorStop(0.5, shade(PAL.bgMid));
      grad.addColorStop(1, shade(PAL.bgBot));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Layer 2: depth pulse rings
      ringTimer += 1;
      if (ringTimer > 240) { ringTimer = 0; rings.push({ r: 20, alpha: 1 }); }
      const cx = W / 2, cy = H / 2;
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.r += 0.3;
        r.alpha = Math.max(0, 1 - r.r / Math.max(W, H));
        if (r.alpha <= 0.001) { rings.splice(i, 1); continue; }
        const baseAlpha = 0.04 * (1 + 0.5 * elapsedRatio);
        ctx.strokeStyle = `rgba(26,154,170,${baseAlpha * r.alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r.r, r.r * 0.7, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Layer 4: drifting horizontal haze bands
      [0.3, 0.55, 0.75].forEach((yf, i) => {
        const drift = Math.sin(t * 0.003 + i) * 60;
        const y = H * yf;
        const g2 = ctx.createLinearGradient(0, y - 40, 0, y + 40);
        g2.addColorStop(0, "rgba(13,79,92,0)");
        g2.addColorStop(0.5, "rgba(13,79,92,0.04)");
        g2.addColorStop(1, "rgba(13,79,92,0)");
        ctx.fillStyle = g2;
        ctx.fillRect(drift - 100, y - 40, W + 200, 80);
      });

      // Layer 3: bioluminescent particles
      const target = Math.floor(120 * densityBoost);
      while (particles.length < target) particles.push(mkParticle(true));
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += 1;
        p.x += p.vx * speedMul;
        p.y += p.vy * speedMul;
        if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20 || p.life > p.max) {
          particles.splice(i, 1);
          if (particles.length < target) particles.push(mkParticle(true));
          continue;
        }
        const lifeFade = Math.sin((p.life / p.max) * Math.PI);
        const twinkle = 0.6 + 0.4 * Math.sin(t * 0.04 + p.phase);
        const a = p.a * opMul * lifeFade * twinkle;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(80,200,220,${a})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }} />;
}

/* ──────────────────────────────────────────────
   Focus energy waveform
   ────────────────────────────────────────────── */
function WaveformCanvas({ status }: { status: "idle" | "running" | "paused" | "completed" }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(status);
  useEffect(() => { stateRef.current = status; }, [status]);
  useEffect(() => {
    const cvs = ref.current; if (!cvs) return;
    const ctx = cvs.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => { cvs.width = cvs.clientWidth * dpr; cvs.height = cvs.clientHeight * dpr; ctx.setTransform(dpr,0,0,dpr,0,0); };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(cvs);
    let t = 0; let amp = 4; let spd = 0.04; let raf = 0;
    const loop = () => {
      const s = stateRef.current;
      const targetAmp = s === "running" ? 14 : s === "paused" ? 1.5 : 4;
      const targetSpd = s === "running" ? 0.09 : s === "paused" ? 0.015 : 0.04;
      amp += (targetAmp - amp) * 0.04;
      spd += (targetSpd - spd) * 0.04;
      t += spd;
      const W = cvs.clientWidth, H = cvs.clientHeight;
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(26,154,170,0.5)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const y = H / 2 + Math.sin(x * 0.05 + t) * amp + Math.sin(x * 0.12 + t * 1.4) * amp * 0.3;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} className="w-full h-full" />;
}

/* ──────────────────────────────────────────────
   Web Audio ambient engine
   ────────────────────────────────────────────── */
type SoundKey = "silence" | "neural" | "rain" | "brown" | "space" | "focus432";
const SOUNDS: { key: SoundKey; label: string; sub: string }[] = [
  { key: "silence",  label: "Silence",            sub: "default" },
  { key: "neural",   label: "Neural Atmosphere",  sub: "40Hz gamma waves" },
  { key: "rain",     label: "Rain",               sub: "gentle rainfall" },
  { key: "brown",    label: "Brown Noise",        sub: "deep frequency" },
  { key: "space",    label: "Deep Space",         sub: "cosmic ambience" },
  { key: "focus432", label: "Focus Frequencies",  sub: "binaural 40Hz" },
];

function useAmbient() {
  const [active, setActive] = useState<SoundKey>("silence");
  const [vol, setVol] = useState(0.5);
  const [muted, setMuted] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);
  const masterRef = useRef<GainNode | null>(null);

  const stopAll = useCallback(() => {
    const master = masterRef.current;
    const ac = ctxRef.current;
    if (master && ac) {
      try {
        master.gain.cancelScheduledValues(ac.currentTime);
        master.gain.setValueAtTime(master.gain.value, ac.currentTime);
        master.gain.linearRampToValueAtTime(0, ac.currentTime + 1.5);
      } catch { /* noop */ }
    }
    setTimeout(() => {
      nodesRef.current.forEach(n => { try { (n as OscillatorNode).stop?.(); } catch { /* noop */ } try { n.disconnect(); } catch { /* noop */ } });
      nodesRef.current = [];
      masterRef.current = null;
    }, 1600);
  }, []);

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    return ctxRef.current!;
  }, []);

  const makeNoise = (ac: AudioContext, type: "white" | "brown" | "pink") => {
    const bufferSize = 2 * ac.sampleRate;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    if (type === "brown") {
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02;
        data[i] = last * 3.5;
      }
    } else if (type === "pink") {
      let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
      for (let i = 0; i < bufferSize; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886*b0 + w*0.0555179;
        b1 = 0.99332*b1 + w*0.0750759;
        b2 = 0.96900*b2 + w*0.1538520;
        b3 = 0.86650*b3 + w*0.3104856;
        b4 = 0.55000*b4 + w*0.5329522;
        b5 = -0.7616*b5 - w*0.0168980;
        data[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    } else {
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    }
    const src = ac.createBufferSource();
    src.buffer = buffer; src.loop = true; src.start();
    return src;
  };

  const play = useCallback((key: SoundKey) => {
    stopAll();
    if (key === "silence") return;
    setTimeout(() => {
      const ac = ensureCtx();
      if (ac.state === "suspended") ac.resume();
      const master = ac.createGain();
      master.gain.value = 0;
      master.connect(ac.destination);
      masterRef.current = master;
      const nodes: AudioNode[] = [master];

      const targetGain = muted ? 0 : vol * 0.28;
      master.gain.linearRampToValueAtTime(targetGain, ac.currentTime + 2);

      if (key === "neural") {
        const merger = ac.createChannelMerger(2);
        const oscL = ac.createOscillator(); oscL.frequency.value = 200; oscL.type = "sine";
        const oscR = ac.createOscillator(); oscR.frequency.value = 240; oscR.type = "sine";
        const gL = ac.createGain(); gL.gain.value = 0.06;
        const gR = ac.createGain(); gR.gain.value = 0.06;
        oscL.connect(gL).connect(merger, 0, 0);
        oscR.connect(gR).connect(merger, 0, 1);
        merger.connect(master);
        oscL.start(); oscR.start();
        nodes.push(oscL, oscR, gL, gR, merger);
      } else if (key === "rain") {
        const noise = makeNoise(ac, "pink");
        const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2800; bp.Q.value = 1.2;
        noise.connect(bp).connect(master);
        nodes.push(noise, bp);
      } else if (key === "brown") {
        const noise = makeNoise(ac, "brown");
        const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 100;
        noise.connect(lp).connect(master);
        nodes.push(noise, lp);
      } else if (key === "space") {
        const noise = makeNoise(ac, "brown");
        const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 80;
        const lfo = ac.createOscillator(); lfo.frequency.value = 0.05; lfo.type = "sine";
        const lfoG = ac.createGain(); lfoG.gain.value = 30;
        lfo.connect(lfoG).connect(lp.frequency);
        lfo.start();
        noise.connect(lp).connect(master);
        nodes.push(noise, lp, lfo, lfoG);
      } else if (key === "focus432") {
        const osc = ac.createOscillator(); osc.frequency.value = 432; osc.type = "sine";
        const g = ac.createGain(); g.gain.value = 0.05;
        osc.connect(g).connect(master);
        osc.start();
        // 40Hz binaural layer
        const merger = ac.createChannelMerger(2);
        const oscL = ac.createOscillator(); oscL.frequency.value = 200;
        const oscR = ac.createOscillator(); oscR.frequency.value = 240;
        const gL = ac.createGain(); gL.gain.value = 0.04;
        const gR = ac.createGain(); gR.gain.value = 0.04;
        oscL.connect(gL).connect(merger, 0, 0);
        oscR.connect(gR).connect(merger, 0, 1);
        merger.connect(master);
        oscL.start(); oscR.start();
        nodes.push(osc, g, oscL, oscR, gL, gR, merger);
      }
      nodesRef.current = nodes;
    }, key === active ? 0 : 100);
  }, [active, vol, muted, ensureCtx, stopAll]);

  // update master gain when volume/muted changes
  useEffect(() => {
    const master = masterRef.current; const ac = ctxRef.current;
    if (!master || !ac) return;
    const target = muted ? 0 : vol * 0.28;
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.linearRampToValueAtTime(target, ac.currentTime + 0.3);
  }, [vol, muted]);

  const select = useCallback((key: SoundKey) => {
    setActive(key);
    play(key);
  }, [play]);

  // chime
  const chime = useCallback(() => {
    const ac = ensureCtx();
    if (ac.state === "suspended") ac.resume();
    const osc = ac.createOscillator(); osc.frequency.value = 528; osc.type = "sine";
    const g = ac.createGain(); g.gain.value = 0;
    osc.connect(g).connect(ac.destination);
    const t0 = ac.currentTime;
    g.gain.linearRampToValueAtTime(0.25, t0 + 0.8);
    g.gain.linearRampToValueAtTime(0, t0 + 2.5);
    osc.start(t0); osc.stop(t0 + 2.6);
  }, [ensureCtx]);

  // pause/resume external control
  const suspend = useCallback(() => { ctxRef.current?.suspend?.(); }, []);
  const resume = useCallback(() => { ctxRef.current?.resume?.(); }, []);

  useEffect(() => () => { stopAll(); try { ctxRef.current?.close(); } catch { /* noop */ } }, [stopAll]);

  return { active, select, vol, setVol, muted, setMuted, chime, suspend, resume };
}

/* ──────────────────────────────────────────────
   Persisted state
   ────────────────────────────────────────────── */
interface Persisted {
  mission: string;
  description: string;
  cycleCount: number;
  thoughts: { ts: number; text: string }[];
  cyclesToday: number;
  todayKey: string;
}
const todayKey = () => new Date().toISOString().slice(0,10);
const loadPersisted = (): Persisted => {
  if (typeof window === "undefined") return { mission: "Deep Work: AI System", description: "Focused build session — single mission, no interruptions.", cycleCount: 0, thoughts: [], cyclesToday: 0, todayKey: todayKey() };
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) throw 0;
    const p = JSON.parse(raw) as Persisted;
    if (p.todayKey !== todayKey()) { p.cyclesToday = 0; p.todayKey = todayKey(); }
    return p;
  } catch {
    return { mission: "Deep Work: AI System", description: "Focused build session — single mission, no interruptions.", cycleCount: 0, thoughts: [], cyclesToday: 0, todayKey: todayKey() };
  }
};

/* ──────────────────────────────────────────────
   Main FocusMode component
   ────────────────────────────────────────────── */
export function FocusMode() {
  const {
    focusMode, setFocusMode, setMode,
    sessionStatus, sessionSeconds, sessionDuration,
    startSession, pauseSession, resumeSession, endSession, addTime,
  } = useOS();

  const [persisted, setPersisted] = useState<Persisted>(loadPersisted);
  const savePersisted = useCallback((next: Persisted) => {
    setPersisted(next);
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* noop */ }
  }, []);

  const [editingMission, setEditingMission] = useState(false);
  const [missionDraft, setMissionDraft] = useState(persisted.mission);
  const [thoughtOpen, setThoughtOpen] = useState(false);
  const [thoughtText, setThoughtText] = useState("");
  const [keyFlash, setKeyFlash] = useState(false);
  const [thoughtFlash, setThoughtFlash] = useState(false);
  const [insightIdx, setInsightIdx] = useState(0);
  const [flowAchieved, setFlowAchieved] = useState(false);
  const [lastMouseMove, setLastMouseMove] = useState(Date.now());
  const [edgeHover, setEdgeHover] = useState(false);
  const [completionShown, setCompletionShown] = useState(false);
  const audio = useAmbient();
  const audioRef = useRef(audio); useEffect(() => { audioRef.current = audio; }, [audio]);

  const isRunning = sessionStatus === "running";
  const isPaused = sessionStatus === "paused";
  const isIdle = sessionStatus === "idle" && !completionShown;
  const elapsed = sessionStatus === "idle" ? 0 : Math.max(0, sessionDuration - sessionSeconds);
  const elapsedRatio = sessionDuration > 0 ? Math.min(1, elapsed / (25 * 60)) : 0;
  const progress = sessionDuration > 0 ? elapsed / sessionDuration : 0;

  // Begin session
  const begin = useCallback(() => {
    if (sessionStatus === "running") { pauseSession(); audioRef.current.suspend(); return; }
    if (sessionStatus === "paused") { resumeSession(); audioRef.current.resume(); return; }
    setCompletionShown(false);
    startSession("deep-work", 25);
  }, [sessionStatus, startSession, pauseSession, resumeSession]);

  // End session
  const finish = useCallback(() => {
    if (sessionStatus !== "idle") {
      endSession(false);
    }
  }, [sessionStatus, endSession]);

  // Detect natural completion
  const prevStatus = useRef(sessionStatus);
  useEffect(() => {
    if (prevStatus.current === "running" && sessionStatus === "idle" && sessionSeconds === 0) {
      // session ended naturally
      audioRef.current.chime();
      setCompletionShown(true);
      const next = { ...persisted, cycleCount: persisted.cycleCount + 1, cyclesToday: persisted.cyclesToday + 1 };
      savePersisted(next);
    }
    prevStatus.current = sessionStatus;
  }, [sessionStatus, sessionSeconds, persisted, savePersisted]);

  // Exit Deep Mode
  const exit = useCallback(() => {
    if (sessionStatus === "running" || sessionStatus === "paused") {
      if (!confirm("End the active session and exit Deep Mode?")) return;
      endSession(true);
    }
    setFocusMode(false);
    setMode("operator");
  }, [sessionStatus, endSession, setFocusMode, setMode]);

  const gotoRecovery = useCallback(() => {
    if (sessionStatus === "running" || sessionStatus === "paused") {
      if (!confirm("End session and enter Recovery Mode?")) return;
      endSession(true);
    }
    setFocusMode(false);
    setMode("recovery");
  }, [sessionStatus, endSession, setFocusMode, setMode]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!focusMode) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inInput = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (e.key === "Escape") {
        if (thoughtOpen) { setThoughtOpen(false); setThoughtText(""); e.preventDefault(); return; }
        if (editingMission) { setEditingMission(false); e.preventDefault(); return; }
      }
      if (inInput) return;
      if (e.code === "Space") { e.preventDefault(); begin(); return; }
      if (e.key === "t" || e.key === "T") { e.preventDefault(); setThoughtOpen(true); return; }
      if (e.key === "r" || e.key === "R") { e.preventDefault(); gotoRecovery(); return; }
      // any other key during running → flash
      if (isRunning) { setKeyFlash(true); setTimeout(() => setKeyFlash(false), 400); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusMode, begin, gotoRecovery, isRunning, thoughtOpen, editingMission]);

  // mouse movement tracking for FLOW ACHIEVED
  useEffect(() => {
    if (!focusMode) return;
    const W = window.innerWidth;
    const onMove = (e: MouseEvent) => {
      setLastMouseMove(Date.now());
      setEdgeHover(e.clientX < 30 || e.clientX > W - 30);
    };
    window.addEventListener("mousemove", onMove);
    const id = setInterval(() => {
      const idle = Date.now() - lastMouseMove;
      if (isRunning && elapsed >= 900 && idle >= 90_000) setFlowAchieved(true);
      else if (!isRunning) setFlowAchieved(false);
    }, 1000);
    return () => { window.removeEventListener("mousemove", onMove); clearInterval(id); };
  }, [focusMode, isRunning, elapsed, lastMouseMove]);

  // Insight rotation
  const INSIGHTS = useMemo(() => [
    { main: "Distraction probability low", subs: ["Sensory load balanced", "Cognitive entry detected"] },
    { main: "Peak focus window: now",       subs: ["Neural coherence stable", "Maintain posture"] },
    { main: "Momentum building. Stay.",     subs: ["Depth approaching baseline", "Resist context switches"] },
    { main: "You are 4 minutes from flow state.", subs: ["Breathing slowing", "Heart rate variability rising"] },
    { main: "Flow state detected.",         subs: ["Time perception altering", "Do not interrupt yourself"] },
  ], []);
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setInsightIdx(i => (i + 1) % INSIGHTS.length), 180_000);
    return () => clearInterval(id);
  }, [isRunning, INSIGHTS.length]);
  useEffect(() => { if (isRunning) setInsightIdx(Math.floor(elapsed / 180) % INSIGHTS.length); }, [isRunning, elapsed, INSIGHTS.length]);

  // Submit thought
  const submitThought = () => {
    const t = thoughtText.trim();
    if (!t) { setThoughtOpen(false); return; }
    const next = { ...persisted, thoughts: [{ ts: Date.now(), text: t }, ...persisted.thoughts].slice(0, 200) };
    savePersisted(next);
    setThoughtText("");
    setThoughtOpen(false);
    setThoughtFlash(true);
    setTimeout(() => setThoughtFlash(false), 1500);
  };

  // Mission edit save
  const saveMission = () => {
    const v = missionDraft.trim() || "Deep Work";
    savePersisted({ ...persisted, mission: v });
    setEditingMission(false);
  };

  // Momentum stage
  const momentum = useMemo(() => {
    const m = elapsed / 60;
    if (m >= 22) return { label: "Flow State",  color: "rgba(26,154,170,0.95)" };
    if (m >= 18) return { label: "Peak",        color: "rgba(80,200,220,0.9)" };
    if (m >= 10) return { label: "Established", color: "rgba(80,180,200,0.75)" };
    if (m >= 5)  return { label: "Building",    color: "rgba(120,180,200,0.55)" };
    return { label: "Initiating", color: "rgba(100,160,170,0.4)" };
  }, [elapsed]);

  // Depth rings (one per 5 min completed)
  const depthRingCount = Math.min(5, Math.floor(elapsed / 300));

  // Panel opacity (mission lock)
  const panelOpacity = isRunning && !edgeHover ? 0.35 : 1;
  const topBarHeight = isRunning ? 32 : 48;

  if (!focusMode) return null;

  const statusLabel = flowAchieved ? "FLOW ACHIEVED" : isRunning ? "DEEP FOCUS" : isPaused ? "PAUSED" : completionShown ? "COMPLETE" : "ENTERING FLOW";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex: 50, background: PAL.bg, color: PAL.text, fontFamily: FONT_UI }}
    >
      <OceanCanvas running={isRunning} elapsedRatio={elapsedRatio} />

      {/* Keyflash dim */}
      <AnimatePresence>
        {keyFlash && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none" style={{ background: "rgba(0,0,0,0.4)", zIndex: 1 }} />
        )}
      </AnimatePresence>

      <div className="relative h-full w-full flex flex-col" style={{ zIndex: 2 }}>
        {/* TOP BAR */}
        <motion.div
          animate={{ height: topBarHeight }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between px-6"
          style={{ borderBottom: `1px solid ${PAL.border}` }}
        >
          <div className="flex items-center gap-3">
            <span className="relative inline-block">
              <span className="block rounded-full" style={{ width: 7, height: 7, background: PAL.accent, boxShadow: `0 0 12px ${PAL.glow}` }} />
              <motion.span
                animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 rounded-full"
                style={{ background: PAL.accent }}
              />
            </span>
            <span style={{ fontSize: isRunning ? 9 : 10, letterSpacing: "0.22em", textTransform: "uppercase", color: PAL.text }}>{statusLabel}</span>
          </div>
          <div style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: isRunning ? 12 : 13, letterSpacing: "0.15em", color: "rgba(150,200,210,0.45)" }}>
            {isIdle ? "Silence the world. Begin when ready." : persisted.mission}
          </div>
          <button onClick={exit} className="transition-colors hover:text-white" style={{ fontSize: isRunning ? 10 : 11, letterSpacing: "0.18em", color: PAL.textMut, textTransform: "uppercase" }}>
            Exit Deep Mode ×
          </button>
        </motion.div>

        {/* MAIN GRID */}
        <div className="flex-1 grid min-h-0" style={{ gridTemplateColumns: "230px 1fr 230px" }}>
          {/* LEFT PANEL */}
          <motion.aside animate={{ opacity: panelOpacity }} transition={{ duration: 0.6 }}
            className="flex flex-col gap-7 px-5 py-7 overflow-y-auto"
            style={{ borderRight: `1px solid ${PAL.border}` }}>
            {/* MISSION */}
            <section>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", color: PAL.textMut, textTransform: "uppercase", marginBottom: 10 }}>Mission</div>
              {editingMission ? (
                <input
                  autoFocus
                  value={missionDraft}
                  onChange={e => setMissionDraft(e.target.value)}
                  onBlur={saveMission}
                  onKeyDown={e => { if (e.key === "Enter") saveMission(); if (e.key === "Escape") { setEditingMission(false); setMissionDraft(persisted.mission); } }}
                  className="w-full bg-transparent outline-none"
                  style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 300, color: PAL.text, borderBottom: `1px solid ${PAL.accent}` }}
                />
              ) : (
                <button onClick={() => { setMissionDraft(persisted.mission); setEditingMission(true); }}
                  className="text-left w-full hover:opacity-80 transition-opacity"
                  style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 300, color: PAL.text, lineHeight: 1.2 }}>
                  {persisted.mission}
                </button>
              )}
              <p style={{ fontSize: 11, color: PAL.textMut, marginTop: 8, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{persisted.description}</p>
              <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(26,154,170,0.5)", marginTop: 10, textTransform: "uppercase" }}>
                Session {persisted.cyclesToday + (isRunning || isPaused ? 1 : 0)} of {Math.max(4, persisted.cyclesToday + 1)} today
              </div>
            </section>

            {/* FOCUS ENERGY */}
            <section>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", color: PAL.textMut, textTransform: "uppercase", marginBottom: 10 }}>Focus Energy</div>
              <div style={{ height: 40, width: "100%" }}>
                <WaveformCanvas status={sessionStatus} />
              </div>
            </section>

            {/* ATMOSPHERE */}
            <section>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", color: PAL.textMut, textTransform: "uppercase", marginBottom: 10 }}>Atmosphere</div>
              <div className="flex flex-col gap-1.5">
                {SOUNDS.map(s => {
                  const isActive = audio.active === s.key;
                  return (
                    <button key={s.key} onClick={() => audio.select(s.key)}
                      className="text-left transition-colors"
                      style={{
                        padding: "9px 12px",
                        borderRadius: 8,
                        background: isActive ? PAL.active : "transparent",
                        border: `1px solid ${isActive ? "rgba(26,154,170,0.25)" : "transparent"}`,
                      }}>
                      <div style={{ fontSize: 11, color: PAL.text }}>{s.label}</div>
                      <div style={{ fontSize: 10, color: PAL.textMut, marginTop: 2 }}>{s.sub}</div>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => audio.setMuted(!audio.muted)} style={{ fontSize: 10, color: PAL.textMut }}>{audio.muted ? "🔇" : "🔊"}</button>
                <input type="range" min={0} max={1} step={0.01} value={audio.vol} onChange={e => audio.setVol(parseFloat(e.target.value))}
                  className="flex-1" style={{ accentColor: PAL.accent }} />
              </div>
            </section>
          </motion.aside>

          {/* CENTER */}
          <main className="relative flex flex-col items-center justify-center px-6">
            <AnimatePresence mode="wait">
              {completionShown ? (
                <motion.div key="complete" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center text-center">
                  <div style={{ fontSize: 10, letterSpacing: "0.35em", color: PAL.textMut, textTransform: "uppercase", marginBottom: 18 }}>Session Complete</div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 300, fontSize: 48, color: PAL.text, lineHeight: 1 }}>25 minutes of deep work</div>
                  <div style={{ fontSize: 12, color: PAL.textMut, marginTop: 10 }}>
                    Cycle {persisted.cycleCount} complete · {persisted.thoughts.length} thoughts captured
                  </div>
                  <div className="flex gap-3 mt-10">
                    <button onClick={gotoRecovery}
                      style={{ padding: "12px 22px", borderRadius: 999, background: PAL.active, border: `1px solid ${PAL.accent}`, color: PAL.text, fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                      Begin Recovery
                    </button>
                    <button onClick={() => { setCompletionShown(false); }}
                      style={{ padding: "12px 22px", borderRadius: 999, background: "transparent", border: `1px solid ${PAL.border}`, color: PAL.textMut, fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                      Start New Session
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="chamber" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center">
                  {/* TIMER RING */}
                  <div className="relative" style={{ width: 280, height: 280 }}>
                    {/* depth rings expanding */}
                    {Array.from({ length: depthRingCount }).map((_, i) => (
                      <motion.div key={i}
                        initial={{ scale: 1, opacity: 0.4 }}
                        animate={{ scale: 1 + (i + 1) * 0.18, opacity: 0 }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeOut", delay: i * 0.8 }}
                        className="absolute inset-0 rounded-full pointer-events-none"
                        style={{ border: "1px solid rgba(26,154,170,0.15)" }}
                      />
                    ))}
                    {/* inner pulsing rings */}
                    <motion.div className="absolute rounded-full pointer-events-none"
                      style={{ width: 220, height: 220, top: 30, left: 30, border: "1px solid rgba(26,154,170,0.07)" }}
                      animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
                    <motion.div className="absolute rounded-full pointer-events-none"
                      style={{ width: 160, height: 160, top: 60, left: 60, border: "1px solid rgba(26,154,170,0.05)" }}
                      animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }} />

                    <svg width={280} height={280} className="absolute inset-0 -rotate-90">
                      <circle cx={140} cy={140} r={138} fill="none" stroke="rgba(26,154,170,0.12)" strokeWidth={1} />
                      <circle cx={140} cy={140} r={134} fill="none"
                        stroke={PAL.ring} strokeWidth={2} strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 134}
                        strokeDashoffset={2 * Math.PI * 134 * (1 - progress)}
                        style={{ filter: "drop-shadow(0 0 8px rgba(26,154,170,0.4))", transition: "stroke-dashoffset 0.8s linear" }} />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div style={{ fontSize: 10, letterSpacing: "0.35em", color: "rgba(150,200,210,0.5)", textTransform: "uppercase", marginBottom: 8 }}>
                        {isRunning ? "Deep Focus" : isPaused ? "Paused" : "Ready"}
                      </div>
                      <motion.div key={Math.floor(sessionSeconds || sessionDuration || 1500)}
                        initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}
                        style={{ fontFamily: FONT_DISPLAY, fontWeight: 300, fontSize: 72, color: "rgba(210,238,242,0.92)", lineHeight: 1, letterSpacing: "0.02em" }}>
                        {fmtTime(sessionStatus === "idle" ? (sessionDuration || 25 * 60) : sessionSeconds)}
                      </motion.div>
                      <div style={{ fontSize: 10, color: PAL.textMut, marginTop: 10, letterSpacing: "0.1em" }}>
                        {isIdle ? "of 25:00" : `cycle ${persisted.cycleCount + 1} · ${Math.round((sessionDuration || 1500) / 60)} min total`}
                      </div>
                    </div>
                  </div>

                  {/* CONTROLS */}
                  <div className="flex items-end gap-6 mt-10">
                    <ControlButton size={44} onClick={() => addTime(15)} label="+15 min" disabled={sessionStatus === "idle"}>
                      <span style={{ fontSize: 18, color: PAL.text }}>＋</span>
                    </ControlButton>
                    <ControlButton size={58} primary onClick={begin} label={isRunning ? "Pause" : isPaused ? "Resume" : "Begin [Space]"}>
                      <span style={{ fontSize: 22, color: PAL.text }}>{isRunning ? "⏸" : "▶"}</span>
                    </ControlButton>
                    <ControlButton size={44} onClick={finish} label="End Session" disabled={sessionStatus === "idle"}>
                      <span style={{ fontSize: 16, color: PAL.text }}>✓</span>
                    </ControlButton>
                  </div>

                  {/* THOUGHT VAULT */}
                  <div className="mt-12 w-full flex flex-col items-center" style={{ minHeight: 60 }}>
                    {thoughtOpen ? (
                      <input
                        autoFocus
                        value={thoughtText}
                        onChange={e => setThoughtText(e.target.value)}
                        onBlur={() => { if (!thoughtText.trim()) setThoughtOpen(false); }}
                        onKeyDown={e => { if (e.key === "Enter") submitThought(); if (e.key === "Escape") { setThoughtOpen(false); setThoughtText(""); } }}
                        placeholder="Thought, breakthrough, or question..."
                        className="bg-transparent outline-none text-center"
                        style={{ width: 380, maxWidth: "90%", fontFamily: FONT_UI, fontSize: 12, color: PAL.text, padding: "8px 0", borderBottom: "1px solid rgba(26,154,170,0.3)" }}
                      />
                    ) : (
                      <button onClick={() => setThoughtOpen(true)}
                        style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: 12, color: "rgba(100,160,170,0.3)" }}>
                        — press T to capture a thought —
                      </button>
                    )}
                    <AnimatePresence>
                      {thoughtFlash && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          style={{ fontSize: 10, color: PAL.accent, letterSpacing: "0.2em", marginTop: 10, textTransform: "uppercase" }}>
                          Thought captured
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {persisted.thoughts.length > 0 && (
                      <div className="absolute right-6 bottom-4" style={{ fontSize: 9, color: PAL.textMut, letterSpacing: "0.15em" }}>
                        {persisted.thoughts.length} thoughts captured
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* RIGHT PANEL */}
          <motion.aside animate={{ opacity: panelOpacity }} transition={{ duration: 0.6 }}
            className="flex flex-col gap-7 px-5 py-7 overflow-y-auto"
            style={{ borderLeft: `1px solid ${PAL.border}` }}>
            {/* INTELLIGENCE */}
            <section>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", color: PAL.textMut, textTransform: "uppercase", marginBottom: 10 }}>Intelligence</div>
              <AnimatePresence mode="wait">
                <motion.div key={insightIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                  <div style={{ fontSize: 12, color: "rgba(180,220,225,0.75)", lineHeight: 1.4 }}>{INSIGHTS[insightIdx].main}</div>
                  <div className="flex flex-col gap-1.5 mt-3">
                    {INSIGHTS[insightIdx].subs.map((s, i) => (
                      <motion.div key={s} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.5 }}
                        className="flex items-center gap-2" style={{ fontSize: 10, color: PAL.textMut }}>
                        <span className="rounded-full" style={{ width: 3, height: 3, background: PAL.accent }} />
                        {s}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </section>

            {/* SESSION DEPTH */}
            <section>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", color: PAL.textMut, textTransform: "uppercase", marginBottom: 12 }}>Session Depth</div>
              <Metric label="Flow Quality" value={Math.round(progress * 100)} />
              <Metric label="Focus Depth"  value={Math.min(100, Math.round((elapsed / 60) * 4))} />
              <div className="mt-3">
                <div style={{ fontSize: 10, color: PAL.textMut, marginBottom: 4 }}>Session Momentum</div>
                <div style={{ fontSize: 13, color: momentum.color, letterSpacing: "0.1em" }}>{momentum.label}</div>
              </div>
            </section>

            {/* UP NEXT */}
            <section>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", color: PAL.textMut, textTransform: "uppercase", marginBottom: 8 }}>Up Next</div>
              <button onClick={gotoRecovery} className="text-left hover:underline" style={{ fontSize: 11, color: PAL.text, lineHeight: 1.4 }}>
                Recovery — recommended after this session
              </button>
            </section>

            {/* SESSION LOG */}
            <section>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", color: PAL.textMut, textTransform: "uppercase", marginBottom: 10 }}>Session Log</div>
              <LogRow label="Duration"          value={fmtTime(elapsed)} />
              <LogRow label="Cycles today"      value={String(persisted.cyclesToday)} />
              <LogRow label="Thoughts captured" value={String(persisted.thoughts.length)} />
              <LogRow label="Break due in"      value={isRunning || isPaused ? fmtTime(sessionSeconds) : "—"} />
            </section>
          </motion.aside>
        </div>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   Sub components
   ────────────────────────────────────────────── */
function ControlButton({ size, primary, onClick, label, disabled, children }: {
  size: number; primary?: boolean; onClick: () => void; label: string; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        whileHover={disabled ? {} : { scale: 1.05 }}
        whileTap={disabled ? {} : { scale: 0.95 }}
        onClick={onClick}
        disabled={disabled}
        className="rounded-full flex items-center justify-center transition-all"
        style={{
          width: size, height: size,
          background: primary ? "rgba(26,154,170,0.2)" : "rgba(26,154,170,0.05)",
          border: `1px solid ${primary ? "rgba(26,154,170,0.45)" : "rgba(26,154,170,0.2)"}`,
          boxShadow: primary ? "0 0 24px rgba(26,154,170,0.25)" : "none",
          opacity: disabled ? 0.3 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {children}
      </motion.button>
      <div style={{ fontSize: 9, color: "rgba(150,200,210,0.55)", letterSpacing: "0.15em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between" style={{ fontSize: 10, color: PAL.textMut, marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ color: "rgba(180,220,225,0.7)" }}>{value}%</span>
      </div>
      <div className="w-full rounded-full overflow-hidden" style={{ height: 3, background: "rgba(26,154,170,0.08)" }}>
        <motion.div animate={{ width: `${value}%` }} transition={{ duration: 1.5, ease: "easeOut" }}
          className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${PAL.teal}, ${PAL.accent})` }} />
      </div>
    </div>
  );
}

function LogRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${PAL.border}` }}>
      <span style={{ fontSize: 10, color: PAL.textMut, letterSpacing: "0.1em" }}>{label}</span>
      <span style={{ fontSize: 11, color: PAL.text }}>{value}</span>
    </div>
  );
}
