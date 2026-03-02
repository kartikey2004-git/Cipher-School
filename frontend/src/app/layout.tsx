import type { Metadata } from "next";
import "@/styles/globals.scss";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "SQL Learn — Interactive SQL Learning Platform",
  description:
    "Practice SQL queries with an interactive editor, instant feedback, and AI-powered hints.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
