"use client";
import { useFirebaseUser } from "@/app/lib/use-firebase-user";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Msg = { role: "user" | "assistant"; content: string };
type Thread = { id: string; title?: string; createdAt?: { _seconds?: number } };

export default function ChatLayout({
  params,
}: {
  params: { threadId: string };
}) {
  const { user, authReady } = useFirebaseUser();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const keepAtBottomRef = useRef(false);
  const SCROLL_THRESHOLD = 40;

  // Load threads for sidebar
  useEffect(() => {
    (async () => {
      if (!authReady || !user) return;
      setLoadingThreads(true);
      const idToken = await user.getIdToken();
      const res = await fetch("/api/threads", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      setThreads(data.threads ?? []);
      setLoadingThreads(false);
    })();
  }, [authReady, user]);

  // Load current thread messages
  useEffect(() => {
    (async () => {
      if (!authReady || !user) return;
      setLoadingMsgs(true);
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/threads/${params.threadId}/messages`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      setMessages(data.messages ?? []);
      setLoadingMsgs(false);
      requestAnimationFrame(() => scrollToBottom(false));
    })();
  }, [authReady, user, params.threadId]);

  function isNearBottom(el: HTMLElement) {
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distance <= SCROLL_THRESHOLD;
  }

  function scrollToBottom(smooth = true) {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    keepAtBottomRef.current = isNearBottom(el);
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (isNearBottom(el) || keepAtBottomRef.current) scrollToBottom(true);
  }, [messages]);

  async function createThread() {
    if (!user) return;
    const idToken = await user.getIdToken();
    const res = await fetch("/api/threads", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: "New Chat" }),
    });
    const data = await res.json();
    location.href = `/chat/${data.threadId}`;
  }

  async function send() {
    if (!input.trim() || !user || sending) return;
    setSending(true);
    keepAtBottomRef.current = true;

    const idToken = await user.getIdToken();
    const userMsg: Msg = { role: "user", content: input.trim() };

    setMessages((m) => [...m, userMsg, { role: "assistant", content: "" }]);
    setInput("");

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          threadId: params.threadId,
          content: userMsg.content,
        }),
      });

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk
          .split("\n")
          .filter((line) => line.trim().startsWith("data: "));

        for (const line of lines) {
          const data = line.replace(/^data:\s*/, "");
          if (data === "[DONE]") break;
          try {
            const json = JSON.parse(data);
            const token = json.choices?.[0]?.delta?.content || "";
            acc += token;
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = { role: "assistant", content: acc };
              return copy;
            });
          } catch {}
        }
      }
    } finally {
      setSending(false);
      keepAtBottomRef.current = false;
    }
  }

  if (!authReady)
    return (
      <main className="grid h-screen place-items-center text-gray-500 dark:text-gray-400">
        Loading session…
      </main>
    );

  if (!user)
    return (
      <main className="grid h-screen place-items-center text-gray-500 dark:text-gray-400">
        Please sign in on the home page.
      </main>
    );

  return (
    <main className="flex h-screen bg-linear-to-b from-gray-50 to-gray-100 dark:from-neutral-900 dark:to-neutral-950 text-gray-900 dark:text-gray-100">
      {/* 🧭 Sidebar */}
      <aside className="w-64 border-r border-black/5 dark:border-white/10 bg-white/60 dark:bg-neutral-900/60 backdrop-blur p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Chats</h2>
          <button
            onClick={createThread}
            className="text-sm rounded-md bg-blue-600 text-white px-3 py-1.5 hover:bg-blue-700 transition cursor-pointer"
          >
            + New
          </button>
        </div>

        {loadingThreads ? (
          <div className="text-sm text-gray-500">Loading threads…</div>
        ) : threads.length === 0 ? (
          <div className="text-sm text-gray-500">No chats yet</div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 sidebar-scroll">
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => router.push(`/chat/${t.id}`)}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition hover:bg-blue-50 dark:hover:bg-neutral-800 ${
                  t.id === params.threadId
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40"
                    : ""
                }`}
              >
                {t.title || "Untitled Chat"}
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* 💬 Chat area */}
      <section className="flex-1 flex flex-col min-h-0">
        {/* Scrollable message area with guaranteed space for input */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 space-y-3 min-h-[calc(100vh-70px)]"
        >
          {loadingMsgs ? (
            <div className="flex h-full items-center justify-center text-gray-500">
              Loading messages…
            </div>
          ) : messages.length > 0 ? (
            messages.map((m, i) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={i}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm whitespace-pre-wrap wrap-break-words ${
                      isUser
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white/80 text-gray-900 rounded-bl-sm dark:bg-neutral-800/80 dark:text-gray-100"
                    }`}
                  >
                    <div className="mb-1 text-[11px] opacity-70">
                      {isUser ? "You" : "AuraGPT"}
                    </div>
                    {m.content}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400 text-sm">
              Start a conversation below 👇
            </div>
          )}
        </div>

        {/* Fixed input area always visible */}
        <div className="border-t border-black/5 dark:border-white/10 p-3 flex gap-2 sticky bottom-0 bg-white/70 dark:bg-neutral-900/70 backdrop-blur supports-backdrop-filter:bg-white/60">
          <input
            className="flex-1 rounded-lg border border-black/10 bg-white/90 px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:border-white/10 dark:bg-neutral-900/70 dark:focus:ring-blue-900"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Send a message…"
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-medium transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 cursor-pointer"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </section>
    </main>
  );
}
