import { create } from "zustand";
import { persist } from "zustand/middleware";

interface EditorState {
  contents: Record<string, string>;
  activeAssignmentId: string | null;
  setContent: (assignmentId: string, content: string) => void;
  getContent: (assignmentId: string) => string;
  setActiveAssignment: (id: string | null) => void;
  clearContent: (assignmentId: string) => void;
  clearStaleContent: (currentAssignmentId: string) => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      contents: {},
      activeAssignmentId: null,

      setContent: (assignmentId, content) =>
        set((state) => ({
          contents: { ...state.contents, [assignmentId]: content },
        })),

      getContent: (assignmentId) => get().contents[assignmentId] ?? "",

      setActiveAssignment: (id) =>
        set((state) => {
          if (id) {
            const currentAssignmentKey = id as string;
            const { [currentAssignmentKey]: current, ...staleContent } =
              state.contents;
            return {
              activeAssignmentId: id,
              contents: staleContent,
            };
          }
          return { activeAssignmentId: id };
        }),

      clearContent: (assignmentId) =>
        set((state) => {
          const { [assignmentId]: _, ...rest } = state.contents;
          return { contents: rest };
        }),

      clearStaleContent: (currentAssignmentId) =>
        set((state) => {
          const { [currentAssignmentId]: current, ...staleContent } =
            state.contents;
          return { contents: staleContent };
        }),
    }),
    {
      name: "sql-learn-editor",
      partialize: (state) => ({ contents: state.contents }),
    },
  ),
);
