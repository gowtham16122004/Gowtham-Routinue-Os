import { motion, AnimatePresence } from "framer-motion";
import {
  Droplets, Waves, TreePine, Star, Radio,
  Zap, Wind, Moon, Volume2, VolumeX, Loader2,
} from "lucide-react";
import type { AmbientSound, AmbientAudioState, AmbientAudioControls } from "./useAmbientAudio";
import { AMBIENT_PRESETS } from "./useAmbientAudio";

const ICONS: Record<AmbientSound, React.ElementType> = {
  rain: Droplets,
  ocean: Waves,
  forest: TreePine,
  space: Star,
  noise: Radio,
  healing: Zap,
  wind: Wind,
  night: Moon,
};

const TONE_COLORS: Record<string, { text: string; bg: string; ring: string; glow: string }> = {
  ocean:   { text: "rgba(100,185,255,0.90)", bg: "rgba(255,255,255,0.03)", ring: "rgba(100,185,255,0.22)", glow: "rgba(60,140,230,0.12)" },
  forest:  { text: "rgba(100,215,140,0.90)", bg: "rgba(255,255,255,0.03)", ring: "rgba(100,215,140,0.22)", glow: "rgba(50,180,90,0.12)"  },
  space:   { text: "rgba(150,130,255,0.90)", bg: "rgba(255,255,255,0.03)", ring: "rgba(150,130,255,0.22)", glow: "rgba(100,80,230,0.12)" },
  noise:   { text: "rgba(185,155,110,0.90)", bg: "rgba(255,255,255,0.03)", ring: "rgba(185,155,110,0.22)", glow: "rgba(150,110,60,0.12)" },
  healing: { text: "rgba(200,140,255,0.90)", bg: "rgba(255,255,255,0.03)", ring: "rgba(200,140,255,0.22)", glow: "rgba(160,100,240,0.12)"},
  wind:    { text: "rgba(140,200,230,0.90)", bg: "rgba(255,255,255,0.03)", ring: "rgba(140,200,230,0.22)", glow: "rgba(80,160,210,0.12)" },
  night:   { text: "rgba(120,140,220,0.90)", bg: "rgba(255,255,255,0.03)", ring: "rgba(120,140,220,0.22)", glow: "rgba(70,90,190,0.12)"  },
  default: { text: "rgba(140,170,255,0.85)", bg: "rgba(255,255,255,0.03)", ring: "rgba(140,170,255,0.22)", glow: "rgba(80,120,240,0.12)" },
};

interface AmbientAudioPanelProps {
  audio: AmbientAudioState;
  controls: AmbientAudioControls;
  className?: string;
}

export function AmbientAudioPanel({ audio, controls, className = "" }: AmbientAudioPanelProps) {
  const currentPreset = AMBIENT_PRESETS.find(p => p.id === audio.current);

  return (
    <div className={`w-full flex flex-col gap-4 select-none ${className}`}>
      {/* ── Minimalist Header ── */}
      <div className="flex items-center justify-between border-b border-white/[0.03] pb-3 mb-1">
        <div>
          <span className="text-[0.56rem] font-semibold tracking-[0.32em] text-white/30 uppercase block mb-1">
            Sound Atmospheres
          </span>
          <h3 className="text-[0.72rem] font-medium text-white/70 tracking-[0.02em]">
            Binaural Acoustics
          </h3>
        </div>

        {/* Dynamic active status pill */}
        <AnimatePresence>
          {audio.active && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.05]"
            >
              <motion.span
                className="w-1 h-1 rounded-full bg-emerald-400"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              />
              <span className="text-[0.50rem] font-semibold tracking-[0.12em] text-emerald-400/80 uppercase">
                Active
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Spatial Grid of Tonal Selectors ── */}
      <div className="grid grid-cols-2 gap-2">
        {AMBIENT_PRESETS.map((preset) => {
          const Icon = ICONS[preset.id];
          const isActive = audio.current === preset.id && audio.active;
          const isLoading = audio.loading && audio.current === preset.id;
          const colors = TONE_COLORS[preset.toneClass] ?? TONE_COLORS.default;

          return (
            <motion.button
              key={preset.id}
              onClick={() => controls.toggle(preset.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={`relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-left border transition-all duration-300 overflow-hidden cursor-pointer ${
                isActive
                  ? "bg-white/[0.03]"
                  : "bg-transparent border-white/[0.03] hover:border-white/[0.07]"
              }`}
              style={{
                borderColor: isActive ? colors.ring : "rgba(255,255,255,0.03)",
                boxShadow: isActive ? `0 0 16px ${colors.glow}` : "none",
              }}
            >
              {/* Core Icon Indicator */}
              <div
                className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/[0.02]"
                style={{
                  border: `1px solid ${isActive ? colors.ring : "rgba(255,255,255,0.04)"}`,
                }}
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: colors.text }} />
                ) : (
                  <Icon className="w-3.5 h-3.5" style={{ color: isActive ? colors.text : "rgba(255,255,255,0.25)" }} />
                )}
              </div>

              {/* Selector Wording */}
              <div className="min-w-0 flex-1">
                <span
                  className="text-[0.62rem] font-medium block truncate transition-colors duration-300"
                  style={{ color: isActive ? colors.text : "rgba(255,255,255,0.50)" }}
                >
                  {preset.label}
                </span>
                <span className="text-[0.50rem] text-white/20 block truncate mt-0.5 font-medium">
                  {preset.desc}
                </span>
              </div>

              {/* Sleek dynamic visual waveform */}
              {isActive && (
                <div className="flex items-end gap-[1.5px] h-3.5 shrink-0 pl-1">
                  {[0.4, 0.9, 0.6, 0.35].map((h, index) => (
                    <motion.div
                      key={index}
                      className="w-[1.5px] rounded-full"
                      style={{ background: colors.text }}
                      animate={{ height: [`${h * 10}px`, `${(1.1 - h) * 10}px`, `${h * 10}px`] }}
                      transition={{
                        duration: 0.8 + index * 0.1,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.08,
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* ── Volumetric Volume Controller ── */}
      <div className="mt-3 pt-3 border-t border-white/[0.03]">
        <div className="flex items-center gap-3 px-1">
          <button
            onClick={() => controls.setVolume(audio.volume === 0 ? 0.3 : 0)}
            className="text-white/20 hover:text-white/40 cursor-pointer transition-colors"
          >
            {audio.volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Minimal capsule slider track */}
          <div className="flex-1 relative h-1 rounded-full bg-white/[0.04]">
            <motion.div
              className="absolute left-0 top-0 bottom-0 rounded-full bg-white/40"
              style={{ width: `${audio.volume * 100}%` }}
              animate={{ width: `${audio.volume * 100}%` }}
              transition={{ duration: 0.1 }}
            />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={audio.volume}
              onChange={e => controls.setVolume(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Atmospheric Volume"
            />
          </div>

          <span className="text-[0.52rem] font-medium font-mono text-white/30 w-8 text-right">
            {Math.round(audio.volume * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
