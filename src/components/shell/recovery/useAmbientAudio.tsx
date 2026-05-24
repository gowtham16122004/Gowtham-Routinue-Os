import { useEffect, useRef, useState } from "react";

export type AmbientSound =
  | "rain"
  | "ocean"
  | "forest"
  | "space"
  | "noise"
  | "healing"
  | "wind"
  | "night";

export const AMBIENT_PRESETS: Array<{
  id: AmbientSound;
  label: string;
  desc: string;
  toneClass: string;
}> = [
  { id: "rain",    label: "Rain",               desc: "Gentle rainfall",       toneClass: "ocean"   },
  { id: "ocean",   label: "Ocean",              desc: "Coastal wave cycles",   toneClass: "ocean"   },
  { id: "forest",  label: "Forest Mist",        desc: "Deep woodland quiet",   toneClass: "forest"  },
  { id: "space",   label: "Deep Space",         desc: "Cosmic resonance",      toneClass: "space"   },
  { id: "noise",   label: "Brown Noise",        desc: "Rich depth texture",    toneClass: "noise"   },
  { id: "healing", label: "Healing Frequencies",desc: "432Hz restoration",     toneClass: "healing" },
  { id: "wind",    label: "Wind",               desc: "Open mountain air",     toneClass: "wind"    },
  { id: "night",   label: "Night Atmosphere",   desc: "Still & restoring",     toneClass: "night"   },
];

/* ─── Web Audio synthesis engine ─────────────────────────────────────────── */

function buildNoiseBuffer(ctx: AudioContext, id: AmbientSound): AudioBufferSourceNode {
  const sr  = ctx.sampleRate;
  const len = sr * 12; // 12s buffer
  const buf = ctx.createBuffer(2, len, sr);

  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0;

    switch (id) {
      case "rain": {
        // Bandpass-ish bright white noise + low rumble
        for (let i = 0; i < len; i++) {
          const w = Math.random() * 2 - 1;
          b0 = 0.988 * b0 + w * 0.12;
          d[i] = (b0 + w * 0.22) * 0.25;
        }
        break;
      }
      case "ocean": {
        // Slow undulating pink + low band for waves
        for (let i = 0; i < len; i++) {
          const w = Math.random() * 2 - 1;
          b0 = 0.9986 * b0 + w * 0.004;
          b1 = 0.9920 * b1 + w * 0.095;
          b2 = 0.9000 * b2 + w * 0.280;
          const wave = Math.sin(i / sr * 0.12) * 0.4 + 0.6; // slow wave envelope
          d[i] = (b0 + b1 + b2 * 0.5) * 0.12 * wave;
        }
        break;
      }
      case "forest": {
        // Very soft pink with gentle mid-range
        for (let i = 0; i < len; i++) {
          const w = Math.random() * 2 - 1;
          b0 = 0.9986 * b0 + w * 0.055;
          b1 = 0.9932 * b1 + w * 0.072;
          b2 = 0.9690 * b2 + w * 0.139;
          b3 = 0.8665 * b3 + w * 0.308;
          d[i] = (b0 + b1 + b2 + b3) * 0.09;
        }
        break;
      }
      case "space": {
        // Very deep sub-bass resonance
        for (let i = 0; i < len; i++) {
          const w = Math.random() * 2 - 1;
          b0 = 0.99990 * b0 + w * 0.003;
          b1 = 0.99600 * b1 + w * 0.055;
          b2 = 0.92000 * b2 + w * 0.200;
          const pulse = Math.sin(i / sr * 0.06) * 0.3 + 0.7;
          d[i] = (b0 + b1 * 0.5 + b2 * 0.3) * 0.10 * pulse;
        }
        break;
      }
      case "noise": {
        // Brown noise
        for (let i = 0; i < len; i++) {
          const w = Math.random() * 2 - 1;
          b0 = (b0 + 0.018 * w) / 1.018;
          d[i] = b0 * 2.8;
        }
        break;
      }
      case "healing": {
        // 432Hz sine tones with harmonics — no noise
        for (let i = 0; i < len; i++) {
          const t = i / sr;
          d[i] = (
            Math.sin(2 * Math.PI * 432 * t)  * 0.12 +
            Math.sin(2 * Math.PI * 528 * t)  * 0.08 +
            Math.sin(2 * Math.PI * 396 * t)  * 0.06 +
            Math.sin(2 * Math.PI * 174 * t)  * 0.10
          ) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 0.05 * t)); // slow AM
        }
        break;
      }
      case "wind": {
        // Filtered white noise with slow modulation
        for (let i = 0; i < len; i++) {
          const w = Math.random() * 2 - 1;
          b0 = 0.9920 * b0 + w * 0.085;
          b1 = 0.8665 * b1 + w * 0.250;
          b5 = Math.sin(i / sr * 0.08) * 0.5 + 0.5; // envelope
          d[i] = (b0 + b1 * 0.6) * 0.15 * b5;
        }
        break;
      }
      case "night": {
        // Very soft low-level pink, near silence with occasional chirps
        for (let i = 0; i < len; i++) {
          const w = Math.random() * 2 - 1;
          b0 = 0.9990 * b0 + w * 0.020;
          b1 = 0.9850 * b1 + w * 0.060;
          // occasional high cricket-like tone
          const cricket = Math.sin(i / sr * 3200 * 2 * Math.PI) * (Math.random() < 0.00005 ? 0.12 : 0);
          d[i] = (b0 + b1 * 0.5) * 0.06 + cricket;
        }
        break;
      }
    }

    // Crossfade edges to eliminate loop clicks
    const fade = Math.min(8192, Math.floor(len * 0.02));
    for (let i = 0; i < fade; i++) {
      d[i]         *= i / fade;
      d[len - 1 - i] *= i / fade;
    }
  }

  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop      = true;
  src.loopStart = 0.08;
  src.loopEnd   = 12 - 0.08;
  return src;
}

/* ─── Hook ────────────────────────────────────────────────────────────────── */

export interface AmbientAudioState {
  active:   boolean;
  current:  AmbientSound | null;
  volume:   number;
  loading:  boolean;
}

export interface AmbientAudioControls {
  toggle: (id: AmbientSound) => Promise<void>;
  setVolume: (v: number) => void;
  stop: () => Promise<void>;
}

export function useAmbientAudio(): [AmbientAudioState, AmbientAudioControls] {
  const ctxRef    = useRef<AudioContext | null>(null);
  const gainRef   = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const srcRef    = useRef<AudioBufferSourceNode | null>(null);
  const volRef    = useRef(0.30);

  const [state, setState] = useState<AmbientAudioState>({
    active:  false,
    current: null,
    volume:  0.30,
    loading: false,
  });

  const stopCurrent = async (fadeMs = 700): Promise<void> => {
    return new Promise((resolve) => {
      const g   = gainRef.current;
      const ctx = ctxRef.current;
      if (!g || !ctx) { resolve(); return; }

      const t = ctx.currentTime;
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0.0001, t + fadeMs / 1000);

      setTimeout(() => {
        try { srcRef.current?.stop(); } catch { /* already stopped */ }
        srcRef.current = null;
        resolve();
      }, fadeMs + 80);
    });
  };

  const play = async (id: AmbientSound) => {
    setState(s => ({ ...s, loading: true }));

    if (srcRef.current) await stopCurrent(500);

    const Ctor = window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;

    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new Ctor();
    }
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") await ctx.resume();

    // Build audio graph
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gainRef.current = gain;

    // Apply tonal filter per preset
    const filt = ctx.createBiquadFilter();
    switch (id) {
      case "rain":    filt.type = "bandpass"; filt.frequency.value = 4000; filt.Q.value = 0.4; break;
      case "ocean":   filt.type = "lowpass";  filt.frequency.value = 600;  filt.Q.value = 0.6; break;
      case "forest":  filt.type = "lowpass";  filt.frequency.value = 2200; filt.Q.value = 0.5; break;
      case "space":   filt.type = "lowpass";  filt.frequency.value = 200;  filt.Q.value = 0.8; break;
      case "noise":   filt.type = "lowpass";  filt.frequency.value = 900;  filt.Q.value = 0.5; break;
      case "healing": filt.type = "lowpass";  filt.frequency.value = 1200; filt.Q.value = 0.4; break;
      case "wind":    filt.type = "bandpass"; filt.frequency.value = 800;  filt.Q.value = 0.3; break;
      case "night":   filt.type = "lowpass";  filt.frequency.value = 1800; filt.Q.value = 0.5; break;
    }
    filterRef.current = filt;

    const src = buildNoiseBuffer(ctx, id);
    src.connect(filt);
    filt.connect(gain);
    gain.connect(ctx.destination);
    src.start(0);
    srcRef.current = src;

    // Fade in
    gain.gain.linearRampToValueAtTime(volRef.current, ctx.currentTime + 1.2);

    setState({ active: true, current: id, volume: volRef.current, loading: false });
  };

  const stop = async () => {
    await stopCurrent(700);
    setState(s => ({ ...s, active: false, current: null, loading: false }));
  };

  const toggle = async (id: AmbientSound) => {
    if (state.current === id && state.active) {
      await stop();
    } else {
      await play(id);
    }
  };

  const setVolume = (v: number) => {
    volRef.current = v;
    if (gainRef.current && ctxRef.current) {
      gainRef.current.gain.setTargetAtTime(v, ctxRef.current.currentTime, 0.1);
    }
    setState(s => ({ ...s, volume: v }));
  };

  useEffect(() => {
    return () => {
      try {
        srcRef.current?.stop();
        ctxRef.current?.close();
      } catch { /* ignore */ }
    };
  }, []);

  return [state, { toggle, setVolume, stop }];
}
