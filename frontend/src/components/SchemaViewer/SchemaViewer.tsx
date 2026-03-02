"use client";

import { useState } from "react";
import type { ITable } from "@/lib/types";
import styles from "./SchemaViewer.module.scss";

interface Props {
  tables: ITable[];
}

export default function SchemaViewer({ tables }: Props) {
  return (
    <div className={styles.viewer}>
      {tables.map((table) => (
        <TableBlock key={table.tableName} table={table} />
      ))}
    </div>
  );
}

function TableBlock({ table }: { table: ITable }) {
  const [open, setOpen] = useState(true);

  return (
    <div className={styles.tableBlock}>
      <div className={styles.tableHeader} onClick={() => setOpen((v) => !v)}>
        <div>
          <span className={styles.tableName}>{table.tableName}</span>
          <span className={styles.rowCount}>
            {" "}
            ({table.rows.length} row{table.rows.length !== 1 ? "s" : ""})
          </span>
        </div>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}>
          ▸
        </span>
      </div>

      {open && (
        <>
          <div className={styles.columns}>
            {table.columns.map((col) => (
              <div key={col.columnName} className={styles.column}>
                <span className={styles.columnName}>{col.columnName}</span>
                <span className={styles.columnType}>{col.dataType}</span>
              </div>
            ))}
          </div>

          {table.rows.length > 0 && (
            <div className={styles.sampleData}>
              <table className={styles.sampleTable}>
                <thead>
                  <tr>
                    {table.columns.map((col) => (
                      <th key={col.columnName}>{col.columnName}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      {table.columns.map((col) => (
                        <td key={col.columnName}>
                          {row[col.columnName] === null ||
                          row[col.columnName] === undefined
                            ? "NULL"
                            : String(row[col.columnName])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {table.rows.length > 5 && (
                <div
                  style={{
                    padding: "6px 8px",
                    fontSize: 11,
                    color: "var(--color-text-muted)",
                  }}
                >
                  … and {table.rows.length - 5} more rows
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
