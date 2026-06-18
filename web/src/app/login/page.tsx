"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm bg-surface rounded-xl border border-line shadow-sm p-8">
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="w-11 h-11 rounded-lg bg-coral flex items-center justify-center text-white text-lg font-bold mb-3">
            F
          </span>
          <h1 className="text-lg font-bold text-ink">
            FACE Prep <span className="text-coral">Archive</span>
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Sign in to browse the archive
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-ink mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-line rounded-md text-sm text-ink focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral"
              autoComplete="email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-ink mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-line rounded-md text-sm text-ink focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-coral text-white text-sm font-semibold py-2.5 rounded-md hover:bg-coral-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-xs text-ink-soft mt-6 text-center">
          Access is restricted to authorised FACE Prep users.
        </p>
      </div>
    </div>
  );
}
