"use client";
import { auth } from "@/app/lib/firebase-client";
import { onAuthStateChanged, type User } from "firebase/auth";
import Link from "next/link";
import { useEffect, useState } from "react";

type Thread = {
  id: string;
  title?: string;
  createdAt?: { _seconds?: number };
};

export default function ThreadsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    (async () => {
      if (!user) return;
      setLoading(true);
      const idToken = await user.getIdToken();
      const res = await fetch("/api/threads", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data: { threads?: Thread[] } = await res.json();
      setThreads(data.threads ?? []);
      setLoading(false);
    })();
  }, [user]);

  async function createThread() {
    if (!user || creating) return;
    setCreating(true);
    const idToken = await user.getIdToken();
    const res = await fetch("/api/threads", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: "New Chat" }),
    });
    const data: { threadId: string } = await res.json();
    // client-side nav to avoid full reload
    window.location.assign(`/chat/${data.threadId}`);
  }

  if (!user) {
    return (
      <main className="p-8 text-center text-gray-700 dark:text-gray-300">
        Please sign in on the home page. (ignore this if you are already logged
        in 🙂)
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-linear-to-b from-gray-50 to-gray-100 dark:from-neutral-900 dark:to-neutral-950">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
              Your Chats
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Pick up where you left off or start something new.
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              (P.S. AuraGPT is a big Lebron Fan 👑)
            </p>
          </div>
          <button
            onClick={createThread}
            disabled={creating}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-white font-medium transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 cursor-pointer"
          >
            {creating ? "Creating…" : "New Chat"}
          </button>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white/70 p-4 shadow-sm backdrop-blur supports-backdrop-filter:bg-white/60 dark:border-white/10 dark:bg-neutral-900/60">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-black/5 bg-white/70 p-4 shadow-sm animate-pulse dark:border-white/10 dark:bg-neutral-900/60"
                >
                  <div className="h-4 w-2/3 rounded bg-black/10 dark:bg-white/10" />
                  <div className="mt-3 h-3 w-1/2 rounded bg-black/10 dark:bg-white/10" />
                </div>
              ))}
            </div>
          ) : threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="text-xl font-medium text-gray-800 dark:text-gray-100">
                No chats yet
              </div>
              <p className="max-w-sm text-sm text-gray-600 dark:text-gray-400">
                Create your first conversation to get started.
              </p>
              <button
                onClick={createThread}
                disabled={creating}
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-white font-medium transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
              >
                {creating ? "Creating…" : "New Chat"}
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {threads.map((t) => {
                const ts = t.createdAt?._seconds
                  ? new Date(t.createdAt._seconds * 1000)
                  : null;
                return (
                  <Link
                    key={t.id}
                    href={`/chat/${t.id}`}
                    className="group rounded-xl border border-black/5 bg-white/80 p-4 shadow-sm transition hover:shadow-md hover:bg-white dark:border-white/10 dark:bg-neutral-900/70 dark:hover:bg-neutral-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-medium text-gray-900 line-clamp-1 dark:text-gray-100">
                        {t.title || "Untitled Chat"}
                      </div>
                      <span className="text-xs text-gray-500 opacity-80 transition group-hover:opacity-100 dark:text-gray-400">
                        Open →
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {ts ? ts.toLocaleString() : "Just now"}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
