import { create } from "zustand";

interface HintCooldown {
  perAssignment: Record<string, number[]>;
  global: number[];
}

interface UiState {
  hintPanelOpen: boolean;
  schemaViewerOpen: boolean;
  isExecuting: boolean;
  isGrading: boolean;
  sandboxStatus: "initializing" | "ready" | "error";
  hintCooldown: HintCooldown;
  toggleHintPanel: () => void;
  setHintPanelOpen: (open: boolean) => void;
  toggleSchemaViewer: () => void;
  setSchemaViewerOpen: (open: boolean) => void;
  setIsExecuting: (v: boolean) => void;
  setIsGrading: (v: boolean) => void;
  setSandboxStatus: (status: "initializing" | "ready" | "error") => void;
  recordHintRequest: (assignmentId: string) => void;
  canRequestHint: (assignmentId: string) => boolean;
  getHintCooldownInfo: (assignmentId: string) => {
    globalRemaining: number;
    assignmentRemaining: number;
  };
}

const GLOBAL_HINT_LIMIT = 10;
const GLOBAL_HINT_WINDOW_MS = 60 * 60 * 1000;
const ASSIGNMENT_HINT_LIMIT = 3;
const ASSIGNMENT_HINT_WINDOW_MS = 10 * 60 * 1000;

function pruneTimestamps(timestamps: number[], windowMs: number): number[] {
  const cutoff = Date.now() - windowMs;
  return timestamps.filter((t) => t > cutoff);
}

export const useUiStore = create<UiState>()((set, get) => ({
  hintPanelOpen: false,
  schemaViewerOpen: true,
  isExecuting: false,
  isGrading: false,
  sandboxStatus: "initializing",
  hintCooldown: { perAssignment: {}, global: [] },

  toggleHintPanel: () => set((s) => ({ hintPanelOpen: !s.hintPanelOpen })),
  setHintPanelOpen: (open) => set({ hintPanelOpen: open }),
  toggleSchemaViewer: () =>
    set((s) => ({ schemaViewerOpen: !s.schemaViewerOpen })),
  setSchemaViewerOpen: (open) => set({ schemaViewerOpen: open }),
  setIsExecuting: (v) => set({ isExecuting: v }),
  setIsGrading: (v) => set({ isGrading: v }),
  setSandboxStatus: (status) => set({ sandboxStatus: status }),

  recordHintRequest: (assignmentId) =>
    set((state) => {
      const now = Date.now();
      const globalTs = [...state.hintCooldown.global, now];
      const assignmentTs = [
        ...(state.hintCooldown.perAssignment[assignmentId] ?? []),
        now,
      ];
      return {
        hintCooldown: {
          global: pruneTimestamps(globalTs, GLOBAL_HINT_WINDOW_MS),
          perAssignment: {
            ...state.hintCooldown.perAssignment,
            [assignmentId]: pruneTimestamps(
              assignmentTs,
              ASSIGNMENT_HINT_WINDOW_MS,
            ),
          },
        },
      };
    }),

  canRequestHint: (assignmentId) => {
    const { hintCooldown } = get();
    const globalCount = pruneTimestamps(
      hintCooldown.global,
      GLOBAL_HINT_WINDOW_MS,
    ).length;
    const assignmentCount = pruneTimestamps(
      hintCooldown.perAssignment[assignmentId] ?? [],
      ASSIGNMENT_HINT_WINDOW_MS,
    ).length;
    return (
      globalCount < GLOBAL_HINT_LIMIT && assignmentCount < ASSIGNMENT_HINT_LIMIT
    );
  },

  getHintCooldownInfo: (assignmentId) => {
    const { hintCooldown } = get();
    const globalCount = pruneTimestamps(
      hintCooldown.global,
      GLOBAL_HINT_WINDOW_MS,
    ).length;
    const assignmentCount = pruneTimestamps(
      hintCooldown.perAssignment[assignmentId] ?? [],
      ASSIGNMENT_HINT_WINDOW_MS,
    ).length;
    return {
      globalRemaining: Math.max(0, GLOBAL_HINT_LIMIT - globalCount),
      assignmentRemaining: Math.max(0, ASSIGNMENT_HINT_LIMIT - assignmentCount),
    };
  },
}));
