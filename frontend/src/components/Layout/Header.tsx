"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import styles from "./Header.module.scss";

export default function Header() {
  const { identityId, isGuest } = useAuth();

  const displayId = identityId
    ? identityId.length > 20
      ? `${identityId.slice(0, 20)}…`
      : identityId
    : "No identity";

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        SQL<span>Learn</span>
      </Link>

      <nav className={styles.nav}>
        <Link href="/assignments" className={styles.navLink}>
          Assignments
        </Link>

        {isGuest ? (
          <Link href="/login" className={styles.navLink}>
            Log in
          </Link>
        ) : (
          <span className={styles.navLink}>Dashboard</span>
        )}

        <div className={styles.identityBadge}>
          <span className={isGuest ? styles.guestDot : styles.userDot} />
          {displayId}
        </div>
      </nav>
    </header>
  );
}
