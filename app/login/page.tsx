"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Aperture, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PillButton } from "@/components/ui/Pill";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l3.99-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.28 6.61l3.99 3.11C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/app";

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-ink">
            <Aperture className="h-6 w-6 text-accent" strokeWidth={1.75} />
            Vantage
          </Link>
          <p className="mt-2 text-sm text-muted">Sign in to start rendering tours.</p>
        </div>

        <div className="rounded-2xl border border-hairline bg-white p-7 shadow-card">
          {status === "sent" ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-accent-dark" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-medium text-ink">Check your inbox</p>
              <p className="mt-1 text-sm text-muted">
                We sent a sign-in link to <span className="text-ink">{email}</span>.
              </p>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                className="flex w-full items-center justify-center gap-2 rounded-pill border border-hairline bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-hairline" />
                <span className="text-xs text-muted">or</span>
                <div className="h-px flex-1 bg-hairline" />
              </div>

              <form onSubmit={handleMagicLink} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="you@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-hairline px-4 py-2.5 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-ink"
                />
                <PillButton
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full"
                >
                  {status === "sending" && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send magic link
                </PillButton>
                {status === "error" && <p className="text-xs text-red-600">{errorMsg}</p>}
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
