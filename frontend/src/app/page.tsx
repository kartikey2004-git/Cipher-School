import Link from "next/link";
import { Header } from "@/components";
import styles from "./page.module.scss";

export default function HomePage() {
  return (
    <div className={styles.home}>
      <Header />

      <section className={styles.hero}>
        <h1 className={styles.title}>
          Master SQL with <span>Hands-On Practice</span>
        </h1>
        <p className={styles.subtitle}>
          Write real SQL queries in an isolated sandbox, get instant feedback,
          AI-powered hints, and track your progress — all in your browser.
        </p>
        <Link href="/assignments" className={styles.cta}>
          Start Learning →
        </Link>
      </section>

      <div className={styles.features}>
        <div className={styles.feature}>
          
          <h3 className={styles.featureTitle}>Isolated Sandbox</h3>
          <p className={styles.featureDesc}>
            Each assignment runs in its own PostgreSQL schema. Experiment
            freely.
          </p>
        </div>
        <div className={styles.feature}>
          
          <h3 className={styles.featureTitle}>Instant Feedback</h3>
          <p className={styles.featureDesc}>
            Run queries and see results instantly. Submit for automatic grading.
          </p>
        </div>
        <div className={styles.feature}>
        
          <h3 className={styles.featureTitle}>Smart Hints</h3>
          <p className={styles.featureDesc}>
            Stuck? Get contextual hints that guide you without giving away the
            answer.
          </p>
        </div>
      </div>
    </div>
  );
}
