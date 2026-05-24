import { useEffect, useRef, useState, useCallback } from "react";

export type BreathPhase = "inhale" | "hold" | "exhale" | "rest";

export interface BreathPattern {
  name: string;
  inhale: number; // seconds
  hold: number;
  exhale: number;
  rest?: number;
  description: string;
}

export const BREATH_PATTERNS: BreathPattern[] = [
  { name: "4-7-8 Recovery",   inhale: 4, hold: 7, exhale: 8, rest: 0, description: "Autonomic nervous system reset" },
  { name: "Box Breathing",    inhale: 4, hold: 4, exhale: 4, rest: 4, description: "Performance centering" },
  { name: "Resonant Coherent",inhale: 5, hold: 0, exhale: 5, rest: 0, description: "HRV alignment" },
  { name: "Deep Recovery",    inhale: 6, hold: 2, exhale: 8, rest: 0, description: "Nervous system depth" },
  { name: "Cleansing Sigh",   inhale: 4, hold: 2, exhale: 6, rest: 0, description: "Immediate cortisol release" },
];

export interface BreathState {
  phase: BreathPhase;
  progress: number; // 0.0 -> 1.0 within the active phase
  cycle: number;
  pattern: BreathPattern;
  running: boolean;
  phaseSecondsLeft: number;
}

interface UseBreathingEngineOptions {
  pattern?: BreathPattern;
  autoStart?: boolean;
}

export function useBreathingEngine({
  pattern = BREATH_PATTERNS[0],
  autoStart = false,
}: UseBreathingEngineOptions = {}) {
  const [state, setState] = useState<BreathState>({
    phase: "inhale",
    progress: 0,
    cycle: 0,
    pattern,
    running: false,
    phaseSecondsLeft: pattern.inhale,
  });

  const runningRef = useRef(false);
  const rafRef = useRef<number>(0);
  
  // Track high-resolution timing
  const lastTickRef = useRef<number>(0);
  const phaseIndexRef = useRef<number>(0);
  const elapsedInPhaseRef = useRef<number>(0); // ms elapsed inside current phase
  const cycleRef = useRef<number>(0);
  
  const patternRef = useRef<BreathPattern>(pattern);
  useEffect(() => {
    patternRef.current = pattern;
    // Reset indices if pattern changes
    phaseIndexRef.current = 0;
    elapsedInPhaseRef.current = 0;
  }, [pattern]);

  // Translate pattern to flat list of active phases
  const getPhases = useCallback((p: BreathPattern) => {
    const list: Array<{ name: BreathPhase; durationMs: number }> = [];
    if (p.inhale > 0) list.push({ name: "inhale", durationMs: p.inhale * 1000 });
    if (p.hold > 0)   list.push({ name: "hold",   durationMs: p.hold * 1000 });
    if (p.exhale > 0) list.push({ name: "exhale", durationMs: p.exhale * 1000 });
    if (p.rest && p.rest > 0) list.push({ name: "rest", durationMs: p.rest * 1000 });
    return list;
  }, []);

  const stop = useCallback(() => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    setState(s => ({ ...s, running: false }));
  }, []);

  const start = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    lastTickRef.current = performance.now();

    const tick = (now: number) => {
      if (!runningRef.current) return;

      const p = patternRef.current;
      const phases = getPhases(p);
      if (phases.length === 0) return;

      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      // Increment elapsed time in current phase
      elapsedInPhaseRef.current += delta;

      let currentPhase = phases[phaseIndexRef.current];
      
      // Roll over to next phases if we exceed current duration
      while (elapsedInPhaseRef.current >= currentPhase.durationMs) {
        elapsedInPhaseRef.current -= currentPhase.durationMs;
        phaseIndexRef.current = (phaseIndexRef.current + 1) % phases.length;
        
        // If we completed a full loop back to the start phase, increment cycle
        if (phaseIndexRef.current === 0) {
          cycleRef.current += 1;
        }
        
        currentPhase = phases[phaseIndexRef.current];
      }

      const progress = Math.min(1.0, elapsedInPhaseRef.current / currentPhase.durationMs);
      const remainingSeconds = Math.ceil((currentPhase.durationMs - elapsedInPhaseRef.current) / 1000);

      setState({
        phase: currentPhase.name,
        progress,
        cycle: cycleRef.current,
        pattern: p,
        running: true,
        phaseSecondsLeft: remainingSeconds,
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [getPhases]);

  const toggle = useCallback(() => {
    if (runningRef.current) stop();
    else start();
  }, [start, stop]);

  const reset = useCallback(() => {
    stop();
    phaseIndexRef.current = 0;
    elapsedInPhaseRef.current = 0;
    cycleRef.current = 0;
    setState({
      phase: "inhale",
      progress: 0,
      cycle: 0,
      pattern: patternRef.current,
      running: false,
      phaseSecondsLeft: patternRef.current.inhale,
    });
  }, [stop]);

  useEffect(() => {
    if (autoStart) start();
    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [autoStart, start]);

  return { state, start, stop, toggle, reset };
}
