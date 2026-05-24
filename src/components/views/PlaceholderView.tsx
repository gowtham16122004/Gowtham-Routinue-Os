import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  body?: string;
  children?: React.ReactNode;
}

export function PlaceholderView({ icon: Icon, title, subtitle, body, children }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass relative overflow-hidden rounded-2xl p-8">
      <div className="fog" style={{ top: -80, right: -80, width: 320, height: 320 }} />
      <div className="relative max-w-2xl">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 ring-1 ring-primary/30 breathe">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="mt-4 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{subtitle}</div>
        <h2 className="mt-1 font-display text-3xl tracking-tight">{title}</h2>
        {body && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{body}</p>}
        {children}
      </div>
    </motion.div>
  );
}
