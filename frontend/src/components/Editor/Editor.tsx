"use client";

import { useRef, useCallback, useEffect } from "react";
import Editor from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useEditorStore } from "@/store/editorStore";
import { useUiStore } from "@/store/uiStore";
import styles from "./Editor.module.scss";

interface Props {
  assignmentId: string;
  onRun: (query: string) => void;
  onSubmit: (query: string) => void;
  isExecuting: boolean;
  isGrading: boolean;
}

export default function SqlEditor({
  assignmentId,
  onRun,
  onSubmit,
  isExecuting,
  isGrading,
}: Props) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const content = useEditorStore((s) => s.getContent(assignmentId));
  const setContent = useEditorStore((s) => s.setContent);

  const isBusy = isExecuting || isGrading;
  const isEmpty = !content.trim();

  const handleEditorDidMount = useCallback(
    (editorInstance: editor.IStandaloneCodeEditor) => {
      editorRef.current = editorInstance;

      editorInstance.addAction({
        id: "run-query",
        label: "Run Query",
        keybindings: [2048 | 3],
        run: () => {
          const value = editorInstance.getValue().trim();
          if (value && !isBusy) onRun(value);
        },
      });

      editorInstance.addAction({
        id: "submit-query",
        label: "Submit for Grading",
        keybindings: [2048 | 1024 | 3],
        run: () => {
          const value = editorInstance.getValue().trim();
          if (value && !isBusy) onSubmit(value);
        },
      });

      editorInstance.focus();
    },
    [onRun, onSubmit, isBusy],
  );

  const handleChange = useCallback(
    (value: string | undefined) => {
      setContent(assignmentId, value ?? "");
    },
    [assignmentId, setContent],
  );

  const handleRun = () => {
    if (!isEmpty && !isBusy) onRun(content.trim());
  };

  const handleSubmit = () => {
    if (!isEmpty && !isBusy) onSubmit(content.trim());
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.langBadge}>SQL</span>
          <span className={styles.shortcut}>Ctrl+Enter to run</span>
        </div>
        <div className={styles.toolbarRight}>
          <button
            className={styles.runBtn}
            onClick={handleRun}
            disabled={isEmpty || isBusy}
          >
            {isExecuting ? <span className={styles.spinner} /> : "▶"}
            Run
          </button>
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={isEmpty || isBusy}
          >
            {isGrading ? <span className={styles.spinner} /> : "✓"}
            Submit
          </button>
        </div>
      </div>

      <div className={styles.editorContainer}>
        <Editor
          height="100%"
          language="sql"
          theme="vs-dark"
          value={content}
          onChange={handleChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "var(--font-mono)",
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            padding: { top: 12 },
            suggestOnTriggerCharacters: true,
          }}
        />
      </div>
    </div>
  );
}
