"use client";

import { useState } from "react";
import { Header, AssignmentCard } from "@/components";
import { useAssignments, useAllProgress } from "@/hooks/useAssignments";
import type { Difficulty } from "@/lib/types";
import styles from "./page.module.scss";

type Filter = "all" | Difficulty;

export default function AssignmentsPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const { data: assignments, isLoading, error, refetch } = useAssignments();
  const { data: progressList } = useAllProgress();

  // Build progress lookup
  const progressMap = new Map(
    progressList?.map((p) => [p.assignmentId, p.progress]) ?? [],
  );

  const filtered =
    filter === "all"
      ? assignments
      : assignments?.filter((a) => a.difficulty === filter);

  const filters: { label: string; value: Filter }[] = [
    { label: "All", value: "all" },
    { label: "Easy", value: "easy" },
    { label: "Medium", value: "medium" },
    { label: "Hard", value: "hard" },
  ];

  return (
    <div className={styles.page}>
      <Header />

      <div className={styles.content}>
        <h1 className={styles.pageTitle}>Assignments</h1>
        <p className={styles.pageSubtitle}>
          Choose a SQL challenge and start practicing.
        </p>

        {/* Filters */}
        <div className={styles.filters}>
          {filters.map((f) => (
            <button
              key={f.value}
              className={`${styles.filterBtn} ${filter === f.value ? styles.filterBtnActive : ""}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading && (
          <div className={styles.loading}>Loading assignments…</div>
        )}

        {error && (
          <div className={styles.error}>
            <p>Failed to load assignments.</p>
            <button onClick={() => refetch()}>Retry</button>
          </div>
        )}

        {!isLoading && !error && filtered && filtered.length === 0 && (
          <div className={styles.empty}>No assignments found.</div>
        )}

        {!isLoading && !error && filtered && filtered.length > 0 && (
          <div className={styles.grid}>
            {filtered.map((assignment) => (
              <AssignmentCard
                key={assignment._id}
                assignment={assignment}
                progress={progressMap.get(assignment._id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
