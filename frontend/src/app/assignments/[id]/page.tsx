"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAssignment } from "@/hooks/useAssignments";
import { useSandboxInit, useProgress } from "@/hooks/useSandbox";
import { useExecuteQuery, useGradeQuery } from "@/hooks/useExecuteQuery";
import { useEditorStore } from "@/store/editorStore";
import { useUiStore } from "@/store/uiStore";
import { handleApiError } from "@/lib/utils";
import { SqlEditor, ResultsPanel, SchemaViewer, HintPanel } from "@/components";
import type { ExecuteQueryResponse, GradingResponse } from "@/lib/types";
import styles from "./page.module.scss";

export default function AssignmentWorkspacePage() {
  const params = useParams();
  const id = params.id as string;

  // ── Data fetching ──
  const {
    data: assignment,
    isLoading: assignLoading,
    error: assignError,
  } = useAssignment(id);
  const sandboxInit = useSandboxInit(id);
  const { data: progress, refetch: refetchProgress } = useProgress(id);
  const executeMutation = useExecuteQuery(id);
  const gradeMutation = useGradeQuery(id);

  // ── Zustand state ──
  const setContent = useEditorStore((s) => s.setContent);
  const setActiveAssignment = useEditorStore((s) => s.setActiveAssignment);
  const hintPanelOpen = useUiStore((s) => s.hintPanelOpen);
  const toggleHintPanel = useUiStore((s) => s.toggleHintPanel);
  const isExecuting = useUiStore((s) => s.isExecuting);
  const isGrading = useUiStore((s) => s.isGrading);

  // ── Local state for results display ──
  const [queryResult, setQueryResult] = useState<ExecuteQueryResponse | null>(
    null,
  );
  const [gradingResult, setGradingResult] = useState<GradingResponse | null>(
    null,
  );
  const [queryError, setQueryError] = useState<string | null>(null);

  // ── Initialize sandbox on mount ──
  useEffect(() => {
    if (id && assignment) {
      sandboxInit.mutate(undefined, {
        onSuccess: () => {
          // Only set active assignment after sandbox is ready
          setActiveAssignment(id);
        },
        onError: (err) => {
          handleApiError(err);
          // Still set active assignment on error to allow retry
          setActiveAssignment(id);
        },
      });
    }
    return () => setActiveAssignment(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, assignment?._id]);

  // ── Auto-retry sandbox initialization if it fails ──
  useEffect(() => {
    if (id && assignment && sandboxInit.isError) {
      const retryTimer = setTimeout(() => {
        sandboxInit.mutate(undefined, {
          onSuccess: () => {
            setActiveAssignment(id);
          },
          onError: (err) => {
            handleApiError(err);
            setActiveAssignment(id);
          },
        });
      }, 2000); // Retry after 2 seconds

      return () => clearTimeout(retryTimer);
    }
  }, [id, assignment?._id, sandboxInit.isError]);

  // ── Restore last query from progress ──
  useEffect(() => {
    if (progress?.lastQuery) {
      const store = useEditorStore.getState();
      // Only restore if editor is empty (don't overwrite user's work)
      if (!store.getContent(id)) {
        setContent(id, progress.lastQuery);
      }
    }
  }, [progress?.lastQuery, id, setContent]);

  // ── Run query handler ──
  const handleRun = useCallback(
    (query: string) => {
      // CRITICAL FIX: Block execution if sandbox is not ready
      if (sandboxInit.isError || !sandboxInit.data) {
        setQueryError("Sandbox not initialized. Please wait...");
        return;
      }

      setQueryError(null);
      executeMutation.mutate(query, {
        onSuccess: (data) => {
          setQueryResult(data);
          setQueryError(null);
        },
        onError: (err) => {
          setQueryError(err.message);
          setQueryResult(null);
          handleApiError(err);
        },
      });
    },
    [executeMutation, sandboxInit],
  );

  // ── Submit for grading handler ──
  const handleSubmit = useCallback(
    (query: string) => {
      // CRITICAL FIX: Block grading if sandbox is not ready
      if (sandboxInit.isError || !sandboxInit.data) {
        setQueryError("Sandbox not initialized. Please wait...");
        return;
      }

      gradeMutation.mutate(query, {
        onSuccess: (data) => {
          setGradingResult(data);
          if (data.passed) {
            toast.success("🎉 Your solution is correct!");
            refetchProgress(); // Refresh to show completion badge
          } else {
            toast.error(data.reason ?? "Submission did not pass.");
          }
        },
        onError: (err) => {
          handleApiError(err);
        },
      });
    },
    [gradeMutation, refetchProgress, sandboxInit],
  );

  // ── Loading / error states ──
  if (assignLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>Loading assignment…</div>
      </div>
    );
  }

  if (assignError || !assignment) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <p>Failed to load assignment.</p>
          <Link href="/assignments">
            <button>Back to Assignments</button>
          </Link>
        </div>
      </div>
    );
  }

  const diffClass = styles[assignment.difficulty] ?? "";

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Link href="/assignments" className={styles.backLink}>
            ← Back
          </Link>
          <h1 className={styles.assignTitle}>{assignment.title}</h1>
        </div>
        <div className={styles.topBarRight}>
          <span className={`${styles.diffBadge} ${diffClass}`}>
            {assignment.difficulty}
          </span>
          {progress?.isCompleted && (
            <span className={styles.completedBadge}>✓ Completed</span>
          )}
          <button
            className={`${styles.hintToggle} ${hintPanelOpen ? styles.hintToggleActive : ""}`}
            onClick={toggleHintPanel}
          >
            💡 Hints
          </button>
        </div>
      </div>

      {/* Workspace */}
      <div className={styles.workspace}>
        {/* Left: question + schema */}
        <div className={styles.leftPanel}>
          <div className={styles.questionSection}>
            <div className={styles.sectionTitle}>Question</div>
            <p className={styles.questionText}>{assignment.question}</p>
          </div>
          <div className={styles.schemaSection}>
            <div className={styles.sectionTitle}>Schema</div>
            <SchemaViewer tables={assignment.sampleTables} />
          </div>
          {progress && (
            <div className={styles.progressBar}>
              Attempts: {progress.attemptCount}
              {progress.isCompleted && " • ✓ Solved"}
            </div>
          )}

          {/* Sandbox initialization status */}
          {sandboxInit.isError && (
            <div className={styles.sandboxStatus}>
              <p style={{ color: "var(--color-error)", marginBottom: "8px" }}>
                Sandbox initialization failed
              </p>
              <button
                onClick={() => sandboxInit.mutate(undefined)}
                style={{
                  padding: "4px 8px",
                  fontSize: "12px",
                  backgroundColor: "var(--color-accent)",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Retry Sandbox Init
              </button>
            </div>
          )}

          {sandboxInit.isPending && (
            <div className={styles.sandboxStatus}>
              <p style={{ color: "var(--color-text-secondary)" }}>
                Initializing sandbox...
              </p>
            </div>
          )}
        </div>

        {/* Center: editor + results */}
        <div className={styles.centerPanel}>
          <div className={styles.editorPane}>
            <SqlEditor
              assignmentId={id}
              onRun={handleRun}
              onSubmit={handleSubmit}
              isExecuting={isExecuting}
              isGrading={isGrading}
            />
          </div>
          <div className={styles.resultsPane}>
            <ResultsPanel
              queryResult={queryResult}
              gradingResult={gradingResult}
              queryError={queryError}
              isLoading={isExecuting || isGrading}
            />
          </div>
        </div>

        {/* Right: hints */}
        {hintPanelOpen && (
          <div className={styles.rightPanel}>
            <HintPanel assignmentId={id} />
          </div>
        )}
      </div>
    </div>
  );
}
