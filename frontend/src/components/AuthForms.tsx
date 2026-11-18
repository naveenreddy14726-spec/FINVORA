"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

const input = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";
const button = "w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60";

function SetupNotice() {
  return (
    <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      Authentication is not configured. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
      <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>frontend/.env.local</code>.
    </p>
  );
}

function Message({ error, info }: { error?: string; info?: string }) {
  if (error) return <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>;
  if (info) return <p role="status" className="mt-3 text-sm text-emerald-700">{info}</p>;
  return null;
}

export function SignupForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  if (!isSupabaseConfigured()) return <SetupNotice />;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setError(""); setInfo("");
    const { error } = await getSupabase().auth.signUp({
      email: String(f.get("email")),
      password: String(f.get("password")),
      options: {
        data: { full_name: String(f.get("name")) },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setInfo("Check your email and click the verification link, then log in.");
  }

  return (
    <form onSubmit={onSubmit}>
      <h1 className="mb-4 text-center text-xl font-bold">Create your free account</h1>
      <label className="block text-sm">Name
        <input name="name" required className={input} autoComplete="name" />
      </label>
      <label className="mt-3 block text-sm">Email
        <input name="email" type="email" required className={input} autoComplete="email" />
      </label>
      <label className="mt-3 block text-sm">Password (min 8 characters)
        <input name="password" type="password" required minLength={8} className={input} autoComplete="new-password" />
      </label>
      <button disabled={busy} className={`${button} mt-4`}>{busy ? "Creating..." : "Create account"}</button>
      <Message error={error} info={info} />
      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account? <Link href="/login" className="font-medium text-indigo-600">Log in</Link>
      </p>
    </form>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!isSupabaseConfigured()) return <SetupNotice />;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setError("");
    const { error } = await getSupabase().auth.signInWithPassword({
      email: String(f.get("email")),
      password: String(f.get("password")),
    });
    setBusy(false);
    if (error) setError(error.message);
    else router.push("/dashboard");
  }

  return (
    <form onSubmit={onSubmit}>
      <h1 className="mb-4 text-center text-xl font-bold">Log in</h1>
      <label className="block text-sm">Email
        <input name="email" type="email" required className={input} autoComplete="email" />
      </label>
      <label className="mt-3 block text-sm">Password
        <input name="password" type="password" required className={input} autoComplete="current-password" />
      </label>
      <button disabled={busy} className={`${button} mt-4`}>{busy ? "Logging in..." : "Log in"}</button>
      <Message error={error} />
      <p className="mt-4 text-center text-sm text-slate-600">
        <Link href="/forgot-password" className="font-medium text-indigo-600">Forgot password?</Link>
        {" · "}
        <Link href="/signup" className="font-medium text-indigo-600">Sign up</Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  if (!isSupabaseConfigured()) return <SetupNotice />;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email"));
    setBusy(true); setError(""); setInfo("");
    const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) setError(error.message);
    else setInfo("If that email has an account, a reset link has been sent.");
  }

  return (
    <form onSubmit={onSubmit}>
      <h1 className="mb-4 text-center text-xl font-bold">Reset your password</h1>
      <label className="block text-sm">Email
        <input name="email" type="email" required className={input} autoComplete="email" />
      </label>
      <button disabled={busy} className={`${button} mt-4`}>{busy ? "Sending..." : "Send reset link"}</button>
      <Message error={error} info={info} />
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) return;
    // Supabase puts a recovery session in the URL; this fires when it is picked up.
    const { data } = getSupabase().auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, [configured]);

  if (!configured) return <SetupNotice />;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password"));
    setBusy(true); setError("");
    const { error } = await getSupabase().auth.updateUser({ password });
    setBusy(false);
    if (error) setError(error.message);
    else router.push("/dashboard");
  }

  if (!ready) {
    return <p className="text-center text-sm text-slate-600">Open this page from the link in your reset email.</p>;
  }
  return (
    <form onSubmit={onSubmit}>
      <h1 className="mb-4 text-center text-xl font-bold">Choose a new password</h1>
      <label className="block text-sm">New password (min 8 characters)
        <input name="password" type="password" required minLength={8} className={input} autoComplete="new-password" />
      </label>
      <button disabled={busy} className={`${button} mt-4`}>{busy ? "Saving..." : "Update password"}</button>
      <Message error={error} />
    </form>
  );
}
