"use client";

import { useState } from "react";
import type { ExecuteQueryResponse, GradingResponse } from "@/lib/types";
import { formatDuration, MAX_RESULT_ROWS } from "@/lib/utils";
import styles from "./ResultsPanel.module.scss";

type ResultTab = "results" | "grading";

interface Props {
  queryResult: ExecuteQueryResponse | null;
  gradingResult: GradingResponse | null;
  queryError: string | null;
  isLoading: boolean;
}

export default function ResultsPanel({
  queryResult,
  gradingResult,
  queryError,
  isLoading,
}: Props) {
  const [activeTab, setActiveTab] = useState<ResultTab>("results");

  const hasResults = queryResult !== null;
  const hasGrading = gradingResult !== null;

  return (
    <div className={styles.panel}>
      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${activeTab === "results" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("results")}
        >
          Results
        </button>
        <button
          className={`${styles.tab} ${activeTab === "grading" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("grading")}
        >
          Grading
        </button>
      </div>

      {activeTab === "results" && hasResults && (
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.title}>Query Output</span>
          </div>
          <div className={styles.meta}>
            <span className={styles.metaItem}>
              {queryResult.rowCount} row{queryResult.rowCount !== 1 ? "s" : ""}
            </span>
            <span className={styles.metaItem}>
              {formatDuration(queryResult.executionTime)}
            </span>
          </div>
        </div>
      )}

      <div className={styles.body}>
        {isLoading && (
          <div className={styles.placeholder}>Executing query…</div>
        )}

        {!isLoading && activeTab === "results" && (
          <>
            {queryError && <div className={styles.errorBox}>{queryError}</div>}

            {hasResults && !queryError && (
              <>
                {queryResult.rowCount >= MAX_RESULT_ROWS && (
                  <div className={styles.truncationWarning}>
                    Results may be truncated. Showing first {MAX_RESULT_ROWS}{" "}
                    rows.
                  </div>
                )}

                {queryResult.rows.length === 0 ? (
                  <div className={styles.placeholder}>
                    Query returned 0 rows.
                  </div>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        {queryResult.columns.map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.rows.map((row, i) => (
                        <tr key={i}>
                          {queryResult.columns.map((col) => (
                            <td key={col}>
                              {row[col] === null ? "NULL" : String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {!hasResults && !queryError && (
              <div className={styles.placeholder}>
                Run a query to see results here.
              </div>
            )}
          </>
        )}

        {!isLoading && activeTab === "grading" && (
          <>
            {hasGrading ? (
              <div
                className={`${styles.gradingResult} ${
                  gradingResult.passed ? styles.passed : styles.failed
                }`}
              >
                <div className={styles.gradingTitle}>
                  {gradingResult.passed ? "✅ Passed!" : "❌ Not Passed"}
                </div>
                <div className={styles.meta}>
                  <span className={styles.metaItem}>
                    {gradingResult.rowCount} row
                    {gradingResult.rowCount !== 1 ? "s" : ""}
                  </span>
                  <span className={styles.metaItem}>
                    {formatDuration(gradingResult.executionTime)}
                  </span>
                </div>
                {gradingResult.reason && (
                  <div className={styles.gradingReason}>
                    {gradingResult.reason}
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.placeholder}>
                Submit your query for grading to see results.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
