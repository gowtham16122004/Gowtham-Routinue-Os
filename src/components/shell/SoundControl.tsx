import { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";

// Simple ambient sound toggle using Web Audio API
const soundFiles: Record<string, string> = {
  "Deep Space": "/assets/sounds/deep-space.mp3",
  "Rain": "/assets/sounds/rain.mp3",
  "Neural Hum": "/assets/sounds/neural-hum.mp3",
  "Brown Noise": "/assets/sounds/brown-noise.mp3",
  "Focus Tone": "/assets/sounds/focus-tone.mp3",
};

export function SoundControl() {
  const [enabled, setEnabled] = useState(false);
  const [preset, setPreset] = useState<keyof typeof soundFiles>("Deep Space");
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  // Initialize Audio element once
  useEffect(() => {
    const el = new Audio(soundFiles[preset]);
    el.loop = true;
    el.volume = 0.3;
    setAudio(el);
    return () => {
      el.pause();
    };
  }, [preset]);

  // Play/pause based on enabled flag
  useEffect(() => {
    if (!audio) return;
    if (enabled) audio.play(); else audio.pause();
  }, [enabled, audio]);

  return (
    <button
      onClick={() => setEnabled(!enabled)}
      className="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs bg-white/[0.03] hover:bg-white/[0.07] transition-colors"
      title={enabled ? `Playing: ${preset}` : "Enable ambient sound"}
    >
      {enabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
      <span>{enabled ? "On" : "Off"}</span>
    </button>
  );
}
