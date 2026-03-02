"use client";

import Link from "next/link";
import type { AssignmentListItem, ProgressData } from "@/lib/types";
import styles from "./AssignmentCard.module.scss";

interface Props {
  assignment: AssignmentListItem;
  progress?: ProgressData;
}

export default function AssignmentCard({ assignment, progress }: Props) {
  const difficultyClass = styles[assignment.difficulty] ?? "";

  return (
    <Link href={`/assignments/${assignment._id}`} className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{assignment.title}</h3>
        <span className={`${styles.badge} ${difficultyClass}`}>
          {assignment.difficulty}
        </span>
      </div>

      <p className={styles.description}>{assignment.description}</p>

      <div className={styles.footer}>
        <div className={styles.progressInfo}>
          {progress ? (
            <>
              <span>{progress.attemptCount} attempts</span>
              {progress.isCompleted && (
                <span className={styles.completedBadge}>✓ Completed</span>
              )}
            </>
          ) : (
            <span>Not started</span>
          )}
        </div>
        <span className={styles.arrow}>→</span>
      </div>
    </Link>
  );
}
