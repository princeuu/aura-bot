"use client";
import { auth, googleProvider } from "@/app/lib/firebase-client";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from "firebase/auth";
import { useEffect, useState } from "react";
import Link from "next/link";

type Mode = "signin" | "signup" | "reset";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  if (!user) {
    // Show login form when NOT signed in
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-neutral-900 dark:to-neutral-950">
        {/* soft background blobs (optional) */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-20 -left-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
        </div>

        {/* 👇 AuthCard shows Google + Email/Password login */}
        <AuthCard />
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-neutral-900 dark:to-neutral-950 text-center space-y-6 px-4">
      <h1 className="text-4xl font-semibold text-gray-900 dark:text-gray-100">
        Hey, {user.displayName || user.email} 👋
      </h1>
      <div className="flex gap-3">
        <Link
          href="/threads"
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-white font-medium transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
        >
          Go to Chats
        </Link>
        <button
          onClick={() => auth.signOut()}
          className="rounded-lg border border-black/10 px-5 py-2.5 font-medium text-gray-700 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-white/10 dark:text-gray-200 dark:hover:bg-neutral-800 cursor-pointer"
        >
          Sign out
        </button>
      </div>
    </main>
  );
}

function AuthCard() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // for signup displayName
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{
    type: "error" | "info";
    text: string;
  } | null>(null);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        if (name.trim())
          await updateProfile(cred.user, { displayName: name.trim() });
      } else if (mode === "reset") {
        await sendPasswordResetEmail(auth, email.trim());
        setMsg({
          type: "info",
          text: "Password reset email sent. Check your inbox and spam folder.",
        });
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "auth/unknown";
      setMsg({ type: "error", text: humanizeFirebaseError(code) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white/70 p-6 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-neutral-900/70">
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
          Welcome to{" "}
          <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            AuraGPT
          </span>
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {mode === "signin" && "Sign in to continue."}
          {mode === "signup" && "Create your account."}
          {mode === "reset" && "Reset your password."}
        </p>
      </div>

      {/* Email form */}
      <form onSubmit={handleEmailAuth} className="space-y-3">
        {mode === "signup" && (
          <input
            type="text"
            autoComplete="name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-black/10 bg-white/90 px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:border-white/10 dark:bg-neutral-800/90"
          />
        )}

        <input
          type="email"
          autoComplete="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-black/10 bg-white/90 px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:border-white/10 dark:bg-neutral-800/90"
        />

        {mode !== "reset" && (
          <input
            type="password"
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-black/10 bg-white/90 px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:border-white/10 dark:bg-neutral-800/90"
          />
        )}

        {msg && (
          <div
            className={`text-sm ${
              msg.type === "error"
                ? "text-red-600 dark:text-red-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {msg.text}
          </div>
        )}

        <button
          type="submit"
          disabled={busy || (mode !== "reset" && (!email || !password))}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-medium transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 cursor-pointer"
        >
          {busy
            ? "Please wait…"
            : mode === "signin"
            ? "Sign in"
            : mode === "signup"
            ? "Create account"
            : "Send reset email"}
        </button>
      </form>

      {/* OAuth separator */}
      {mode !== "reset" && (
        <div className="my-4 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
          or
          <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
        </div>
      )}

      {/* Google sign-in */}
      {mode !== "reset" && (
        <button
          onClick={() => signInWithPopup(auth, googleProvider)}
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm ring-1 ring-black/10 transition hover:bg-gray-50 dark:bg-neutral-800 dark:text-gray-100 dark:ring-white/10 dark:hover:bg-neutral-700 cursor-pointer"
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.15 0 5.95 1.08 8.16 2.85l6.1-6.1C34.05 3.15 29.4 1 24 1..."
            />
            <path
              fill="#34A853"
              d="M46.98 24.55c0-1.61-.15-3.15-.43-4.65H24v9.04h13..."
            />
            <path
              fill="#FBBC05"
              d="M10.36 28.06A14.5 14.5 0 0 1 9.5 24c0-1.39..."
            />
            <path
              fill="#4285F4"
              d="M24 47c6.48 0 11.93-2.13 15.9-5.83l-7.4-5.77..."
            />
          </svg>
          Sign in with Google
        </button>
      )}

      {/* Mode links */}
      <div className="mt-4 text-center text-xs text-gray-600 dark:text-gray-400 space-x-4">
        {mode !== "signin" && (
          <button
            onClick={() => setMode("signin")}
            className="underline hover:text-blue-600 dark:hover:text-blue-400"
          >
            Sign in
          </button>
        )}
        {mode !== "signup" && (
          <button
            onClick={() => setMode("signup")}
            className="underline hover:text-blue-600 dark:hover:text-blue-400"
          >
            Create account
          </button>
        )}
        {mode !== "reset" && (
          <button
            onClick={() => setMode("reset")}
            className="underline hover:text-blue-600 dark:hover:text-blue-400"
          >
            Forgot password?
          </button>
        )}
      </div>
    </div>
  );
}

function humanizeFirebaseError(code: string) {
  // map common auth error codes to friendly messages
  switch (code) {
    case "auth/invalid-email":
      return "That email looks invalid.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
      return "No account found with that email.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/email-already-in-use":
      return "That email is already in use.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    default:
      return code.replace(/^auth\//, "").replace(/-/g, " ");
  }
}
