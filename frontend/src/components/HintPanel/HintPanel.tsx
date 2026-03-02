"use client";

import { useState } from "react";
import { useHintHistory, useRequestHint } from "@/hooks/useHints";
import { useEditorStore } from "@/store/editorStore";
import { useUiStore } from "@/store/uiStore";
import { handleApiError } from "@/lib/utils";
import type { HintType } from "@/lib/types";
import styles from "./HintPanel.module.scss";

interface Props {
  assignmentId: string;
}

export default function HintPanel({ assignmentId }: Props) {
  const [selectedType, setSelectedType] = useState<HintType>("approach");

  const setHintPanelOpen = useUiStore((s) => s.setHintPanelOpen);
  const canRequest = true;
  const cooldownInfo = { globalRemaining: 10, assignmentRemaining: 3 };

  const content = useEditorStore((s) => s.getContent(assignmentId));

  const {
    data: history,
    isLoading: historyLoading,
    refetch,
  } = useHintHistory(assignmentId);
  const hintMutation = useRequestHint(assignmentId);

  const handleRequestHint = async () => {
    if (!canRequest) return;
    try {
      await hintMutation.mutateAsync({
        userQuery: content || "",
        hintType: selectedType,
      });
      refetch();
    } catch (err) {
      handleApiError(err);
    }
  };

  const hintTypes: HintType[] = ["syntax", "logic", "approach"];

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>💡 Hints</span>
        <button
          className={styles.closeBtn}
          onClick={() => setHintPanelOpen(false)}
        >
          ×
        </button>
      </div>

      <div className={styles.actions}>
        {hintTypes.map((ht) => (
          <button
            key={ht}
            className={`${styles.hintTypeBtn} ${selectedType === ht ? styles.hintTypeBtnActive : ""}`}
            onClick={() => setSelectedType(ht)}
          >
            {ht}
          </button>
        ))}
        <button
          className={styles.requestBtn}
          onClick={handleRequestHint}
          disabled={!canRequest || hintMutation.isPending}
        >
          {hintMutation.isPending ? (
            <span className={styles.spinner} />
          ) : (
            "Get Hint"
          )}
        </button>
      </div>

      <div className={styles.cooldownInfo}>
        {cooldownInfo.globalRemaining}/10 global •{" "}
        {cooldownInfo.assignmentRemaining}/3 for this assignment
      </div>

      <div className={styles.body}>
        {historyLoading && (
          <div className={styles.emptyHints}>Loading hints…</div>
        )}

        {!historyLoading && history && history.length === 0 && (
          <div className={styles.emptyHints}>
            No hints yet. Request one above!
          </div>
        )}

        {!historyLoading &&
          history?.map((item, i) => (
            <div key={i} className={styles.hintItem}>
              <div className={styles.hintMeta}>
                <span className={styles.hintTypeBadge}>{item.hintType}</span>
                <span className={styles.hintDate}>
                  {new Date(item.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <p className={styles.hintText}>{item.hint}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
