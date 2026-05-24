import { motion } from "framer-motion";

interface MountainBackgroundProps {
  ambientTone?: string;
  sessionRunning?: boolean;
  breathPhase?: string;
  breathProgress?: number;
}

const PALETTES: Record<string, {
  skyTop: string;
  skyBottom: string;
  moonGlow: string;
  mountainFar: string;
  mountainMid: string;
  mountainClose: string;
  reflectionTone: string;
  mistTone: string;
}> = {
  ocean: {
    skyTop: "rgba(1, 2, 8, 1)",
    skyBottom: "rgba(3, 8, 22, 1)",
    moonGlow: "rgba(50, 130, 240, 0.08)",
    mountainFar: "rgba(6, 12, 38, 0.35)",
    mountainMid: "rgba(4, 9, 28, 0.55)",
    mountainClose: "rgba(2, 4, 14, 0.78)",
    reflectionTone: "rgba(50, 130, 240, 0.08)",
    mistTone: "rgba(40, 110, 200, 0.07)",
  },
  forest: {
    skyTop: "rgba(1, 3, 6, 1)",
    skyBottom: "rgba(2, 12, 18, 1)",
    moonGlow: "rgba(80, 210, 140, 0.07)",
    mountainFar: "rgba(6, 22, 18, 0.32)",
    mountainMid: "rgba(4, 15, 12, 0.52)",
    mountainClose: "rgba(2, 6, 5, 0.76)",
    reflectionTone: "rgba(80, 210, 140, 0.07)",
    mistTone: "rgba(60, 180, 120, 0.06)",
  },
  space: {
    skyTop: "rgba(1, 1, 5, 1)",
    skyBottom: "rgba(3, 4, 15, 1)",
    moonGlow: "rgba(140, 100, 255, 0.08)",
    mountainFar: "rgba(12, 8, 38, 0.32)",
    mountainMid: "rgba(8, 5, 26, 0.52)",
    mountainClose: "rgba(3, 2, 12, 0.76)",
    reflectionTone: "rgba(140, 100, 255, 0.08)",
    mistTone: "rgba(110, 75, 220, 0.06)",
  },
  healing: {
    skyTop: "rgba(2, 1, 6, 1)",
    skyBottom: "rgba(8, 3, 18, 1)",
    moonGlow: "rgba(195, 110, 255, 0.07)",
    mountainFar: "rgba(18, 6, 38, 0.32)",
    mountainMid: "rgba(12, 4, 26, 0.52)",
    mountainClose: "rgba(5, 1, 12, 0.76)",
    reflectionTone: "rgba(195, 110, 255, 0.07)",
    mistTone: "rgba(160, 90, 220, 0.06)",
  },
  default: {
    skyTop: "rgba(1, 2, 6, 1)",
    skyBottom: "rgba(3, 5, 15, 1)",
    moonGlow: "rgba(100, 150, 255, 0.07)",
    mountainFar: "rgba(10, 15, 38, 0.35)",
    mountainMid: "rgba(6, 10, 26, 0.55)",
    mountainClose: "rgba(3, 5, 14, 0.78)",
    reflectionTone: "rgba(90, 140, 255, 0.07)",
    mistTone: "rgba(80, 120, 240, 0.07)",
  },
};

export function MountainBackground({
  ambientTone = "default",
  sessionRunning = false,
  breathPhase = "exhale",
  breathProgress = 0,
}: MountainBackgroundProps) {
  const pal = PALETTES[ambientTone] ?? PALETTES.default;

  // React to breathing cycles: Inhale brightens moon glow slightly, exhale dims
  const getGlowIntensity = () => {
    if (!sessionRunning) return 0.5;
    if (breathPhase === "inhale") return 0.6 + breathProgress * 0.4;
    if (breathPhase === "hold") return 1.0;
    if (breathPhase === "exhale") return 1.0 - breathProgress * 0.4;
    return 0.6;
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* ── Sky Canvas Base ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${pal.skyTop} 0%, ${pal.skyBottom} 60%, rgba(2, 3, 10, 1) 100%)`,
        }}
      />

      {/* ── Volumetric Moon Light bloom ── */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 500,
          height: 500,
          top: "-15%",
          left: "50%",
          transform: "translateX(-50%)",
          background: `radial-gradient(circle, ${pal.moonGlow} 0%, rgba(0,0,0,0) 70%)`,
          filter: "blur(60px)",
        }}
        animate={{
          opacity: getGlowIntensity(),
          scale: sessionRunning && breathPhase === "inhale" ? 1.08 : 1.0,
        }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />

      {/* ── Fine stars field ── */}
      <svg
        className="absolute inset-0 w-full"
        style={{ height: "65%", opacity: sessionRunning ? 0.78 : 0.45 }}
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Soft distant milky path */}
        <ellipse
          cx="720"
          cy="220"
          rx="520"
          ry="70"
          fill="rgba(255, 255, 255, 0.005)"
          stroke={pal.moonGlow.replace("0.07", "0.02").replace("0.08", "0.02")}
          strokeWidth="60"
          style={{ filter: "blur(40px)" }}
        />

        {/* Dynamic Stars */}
        {Array.from({ length: 65 }, (_, i) => {
          const x = (i * 73 + 47) % 1440;
          const y = (i * 41 + 19) % 450;
          const r = [0.55, 0.7, 0.9, 1.2][i % 4];
          const op = [0.12, 0.25, 0.35, 0.45][i % 4];
          
          return (
            <motion.circle
              key={i}
              cx={x}
              cy={y}
              r={r}
              fill="#ffffff"
              animate={sessionRunning ? { opacity: [op, op * 0.4, op] } : { opacity: op }}
              transition={{
                duration: 4.5 + (i % 3) * 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: (i % 5) * 0.5,
              }}
            />
          );
        })}

        {/* Soft Volumetric Moonbeam */}
        <line
          x1="720"
          y1="0"
          x2="720"
          y2="500"
          stroke="rgba(255, 255, 255, 0.015)"
          strokeWidth="3"
          style={{ filter: "blur(8px)" }}
        />
      </svg>

      {/* ── Layered Parallax Mountains ── */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="ridgeGlowGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.015)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* Farthest Mountain Layer */}
        <motion.path
          d="M0,900 L0,520 C90,490 170,530 250,500 C330,470 410,510 500,480 C590,450 670,490 760,460 C850,430 930,470 1020,440 C1110,410 1190,450 1280,420 C1370,390 1410,410 1440,390 L1440,900 Z"
          fill={pal.mountainFar}
          animate={sessionRunning && breathPhase === "inhale" ? { y: 1.5 } : { y: 0 }}
          transition={{ duration: 3.5, ease: "easeInOut" }}
        />

        {/* Middle Mountain Layer */}
        <motion.path
          d="M0,900 L0,620 C100,590 180,630 270,600 C360,570 440,610 540,580 C640,550 720,590 820,560 C920,530 1000,570 1100,540 C1200,510 1280,550 1380,520 C1410,510 1430,520 1440,510 L1440,900 Z"
          fill={pal.mountainMid}
          animate={sessionRunning && breathPhase === "inhale" ? { y: 0.8 } : { y: 0 }}
          transition={{ duration: 3.5, ease: "easeInOut" }}
        />

        {/* Closest Silhouette Mountain Layer */}
        <path
          d="M0,900 L0,720 C110,695 190,735 290,705 C390,675 470,715 570,685 C670,655 750,695 850,665 C950,635 1030,675 1130,645 C1230,615 1310,655 1410,625 C1430,615 1435,620 1440,615 L1440,900 Z"
          fill={pal.mountainClose}
        />
        
        {/* Soft edge highlight for structural depth */}
        <path
          d="M0,720 C110,695 190,735 290,705 C390,675 470,715 570,685 C670,655 750,695 850,665 C950,635 1030,675 1130,645 C1230,615 1310,655 1410,625"
          fill="none"
          stroke="url(#ridgeGlowGrad)"
          strokeWidth="1.0"
        />

        {/* ── Soft Lake Water Overlay (occupies bottom 25% of viewport) ── */}
        <rect x="0" y="760" width="1440" height="140" fill="rgba(1, 2, 7, 0.90)" />

        {/* Subtle Water reflection boundaries */}
        <line x1="0" y1="760" x2="1440" y2="760" stroke="rgba(255,255,255,0.015)" strokeWidth="1" />
      </svg>

      {/* ── Drifting Volumetric Mist Layers (Drifts softly over mountains) ── */}
      <div className="absolute inset-x-0 bottom-[18%] top-0 overflow-hidden pointer-events-none" style={{ height: "40%" }}>
        <motion.div
          className="absolute"
          style={{
            bottom: "10%",
            left: "-15%",
            width: "55%",
            height: "22%",
            background: `radial-gradient(ellipse, ${pal.mistTone} 0%, rgba(0,0,0,0) 75%)`,
            filter: "blur(32px)",
            opacity: sessionRunning ? 0.78 : 0.4,
          }}
          animate={{ x: [0, 60, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute"
          style={{
            bottom: "5%",
            right: "-20%",
            width: "60%",
            height: "25%",
            background: `radial-gradient(ellipse, ${pal.mistTone} 0%, rgba(0,0,0,0) 75%)`,
            filter: "blur(36px)",
            opacity: sessionRunning ? 0.65 : 0.35,
          }}
          animate={{ x: [0, -75, 0] }}
          transition={{ duration: 32, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
      </div>

      {/* ── Breathing Lake Reflection ── */}
      {/* Placed at the bottom to reflect the central Breathing Reactor */}
      <div className="absolute bottom-0 inset-x-0 flex justify-center pointer-events-none" style={{ height: "20%" }}>
        <motion.div
          style={{
            width: 320,
            height: "100%",
            background: `radial-gradient(ellipse at top center, ${pal.reflectionTone} 0%, rgba(0,0,0,0) 65%)`,
            filter: "blur(18px)",
          }}
          animate={sessionRunning && breathPhase === "inhale"
            ? { scaleX: 1.25, opacity: 0.95 }
            : sessionRunning && breathPhase === "hold"
            ? { scaleX: [1.25, 1.26, 1.25], opacity: [0.75, 0.82, 0.75] }
            : { scaleX: 0.92, opacity: 0.35 }
          }
          transition={sessionRunning && breathPhase === "hold" ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : { duration: 2.5 }}
        />

        {/* Faint shimmering horizontal ripples on reflection */}
        <div className="absolute inset-0 flex flex-col gap-3 justify-center items-center opacity-40">
          {[0.8, 1.3, 0.9].map((s, i) => (
            <motion.div
              key={i}
              className="h-[1.5px] rounded-full bg-white/10"
              style={{ width: 120 * s }}
              animate={sessionRunning ? { scaleX: [1, 1.15, 1], opacity: [0.4, 0.9, 0.4] } : {}}
              transition={{ duration: 3.5 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
