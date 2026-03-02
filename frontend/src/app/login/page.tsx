"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Header } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { getIdentityId } from "@/lib/api";
import styles from "./page.module.scss";

export default function LoginPage() {
  const router = useRouter();
  const { login, migrate, isGuest, isMigrating } = useAuth();

  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedId = userId.trim();
    if (!trimmedId) {
      setError("Please enter a user ID.");
      return;
    }
    if (trimmedId.startsWith("guest_")) {
      setError('User ID cannot start with "guest_".');
      return;
    }

    try {
      // If currently a guest, migrate data first
      const currentId = getIdentityId();
      if (currentId && currentId.startsWith("guest_")) {
        await migrate(trimmedId);
        toast.success("Guest data migrated successfully!");
      } else {
        login(trimmedId);
      }

      toast.success("Logged in!");
      router.push("/assignments");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    }
  };

  return (
    <div className={styles.page}>
      <Header />

      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Log In</h1>
          <p className={styles.subtitle}>
            Enter your user ID to access your account and progress.
          </p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="userId" className={styles.label}>
                User ID
              </label>
              <input
                id="userId"
                type="text"
                className={styles.input}
                placeholder="e.g., firebase_uid_abc123"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                autoFocus
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isMigrating}
            >
              {isMigrating ? "Migrating…" : "Log In"}
            </button>
          </form>

          {isGuest && (
            <div className={styles.guestNotice}>
              You currently have a guest session. Logging in will migrate all
              your progress, sandboxes, and hints to your user account.
            </div>
          )}

          <div className={styles.footer}>
            Don&apos;t have an account? <Link href="/signup">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
