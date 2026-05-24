/**
 * deepModeStore.tsx
 *
 * Thin wrapper around the existing OS store.
 * We deliberately avoid adding a Zustand dependency — the project uses React context.
 * This re-exports the OS store actions needed by deep-mode components.
 */
export { useOS as useDeepMode } from "@/lib/os-store";
