"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Header } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { getIdentityId } from "@/lib/api";
import styles from "../login/page.module.scss"; // reuse login styles

export default function SignupPage() {
  const router = useRouter();
  const { login, migrate, isGuest, isMigrating } = useAuth();

  const [userId, setUserId] = useState("");
  const [displayName, setDisplayName] = useState("");
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
      // If currently a guest, migrate data
      const currentId = getIdentityId();
      if (currentId && currentId.startsWith("guest_")) {
        await migrate(trimmedId);
        toast.success("Account created and guest data migrated!");
      } else {
        login(trimmedId);
        toast.success("Account created!");
      }

      router.push("/assignments");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    }
  };

  return (
    <div className={styles.page}>
      <Header />

      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Sign Up</h1>
          <p className={styles.subtitle}>
            Create an account to save your progress permanently.
          </p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="displayName" className={styles.label}>
                Display Name (optional)
              </label>
              <input
                id="displayName"
                type="text"
                className={styles.input}
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoFocus
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="userId" className={styles.label}>
                User ID
              </label>
              <input
                id="userId"
                type="text"
                className={styles.input}
                placeholder="Choose a unique ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isMigrating}
            >
              {isMigrating ? "Creating…" : "Create Account"}
            </button>
          </form>

          {isGuest && (
            <div className={styles.guestNotice}>
              Your current guest progress will be automatically transferred to
              your new account.
            </div>
          )}

          <div className={styles.footer}>
            Already have an account? <Link href="/login">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
