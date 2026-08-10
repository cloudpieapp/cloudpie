import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Mail, Lock, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import SEO from "@/components/SEO";
import {
  useAuth,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  sendPasswordReset,
} from "@/hooks/useAuth";

type Mode = "signin" | "signup";

const GoogleMark = () => (
  <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.3 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6.1C12.3 13.3 17.6 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.8-.4-4.1H24v8.4h12.7c-.3 2.1-1.6 5.2-4.7 7.3l7.6 5.9c4.5-4.2 6.9-10.3 6.9-17.5z" />
    <path fill="#FBBC05" d="M10.4 28.6a14.8 14.8 0 0 1 0-9.2l-7.8-6.1a24 24 0 0 0 0 21.4l7.8-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.6-5.9l-7.6-5.9c-2.1 1.4-4.8 2.3-8 2.3-6.4 0-11.7-3.8-13.6-9.9l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
);

const AuthPage = ({ initialMode = "signin" }: { initialMode?: Mode }) => {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<Mode>((params.get("mode") as Mode) || initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/profile", { replace: true });
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await signUpWithEmail(email.trim(), password, name.trim() || undefined);
        if (error) throw error;
        if (!data.session) {
          setConfirmSent(true);
          toast.success("Check your email to confirm your account.");
          return;
        }
        toast.success("Welcome to BingBloom!");
      } else {
        const { error } = await signInWithEmail(email.trim(), password);
        if (error) throw error;
        toast.success("Signed in.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setBusy(false);
      toast.error(error.message);
    }
  };

  const reset = async () => {
    if (!email.trim()) return toast.error("Enter your email first.");
    const { error } = await sendPasswordReset(email.trim());
    if (error) return toast.error(error.message);
    toast.success("Password reset link sent.");
  };

  const isSignup = mode === "signup";

  return (
    <AppLayout>
      <SEO
        title={isSignup ? "Create your BingBloom account" : "Sign in to BingBloom"}
        description="Sign in or create a free BingBloom account to sync your watchlist, likes and downloads across devices."
      />
      <div className="mx-auto w-full max-w-sm px-5 py-8">
        <h1 className="text-xl font-bold text-foreground">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {isSignup
            ? "Free forever. Sync your watchlist and likes everywhere."
            : "Sign in to pick up where you left off."}
        </p>

        <button
          type="button"
          onClick={google}
          disabled={busy}
          className="mt-5 flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-card text-[13px] font-bold text-foreground disabled:opacity-60"
        >
          <GoogleMark /> Continue with Google
        </button>

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        {confirmSent ? (
          <div className="rounded-xl border border-border/60 bg-card p-4 text-center">
            <p className="text-sm font-bold text-foreground">Confirm your email</p>
            <p className="mt-1 text-xs text-muted-foreground">
              We sent a confirmation link to {email}. Open it to finish creating your account.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-2.5">
            {isSignup && (
              <label className="flex items-center gap-2 rounded-xl border border-border bg-card px-3">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Display name"
                  autoComplete="name"
                  className="min-h-[48px] w-full bg-transparent text-[13px] text-foreground outline-none"
                />
              </label>
            )}
            <label className="flex items-center gap-2 rounded-xl border border-border bg-card px-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                autoComplete="email"
                className="min-h-[48px] w-full bg-transparent text-[13px] text-foreground outline-none"
              />
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-border bg-card px-3">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                className="min-h-[48px] w-full bg-transparent text-[13px] text-foreground outline-none"
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-[13px] font-bold text-primary-foreground disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSignup ? "Create account" : "Sign in"}
            </button>
          </form>
        )}

        <div className="mt-4 space-y-2 text-center">
          {!isSignup && (
            <button type="button" onClick={reset} className="text-[11.5px] font-semibold text-muted-foreground underline">
              Forgot your password?
            </button>
          )}
          <p className="text-[12px] text-muted-foreground">
            {isSignup ? "Already have an account?" : "New to BingBloom?"}{" "}
            <button
              type="button"
              onClick={() => {
                setConfirmSent(false);
                setMode(isSignup ? "signin" : "signup");
              }}
              className="font-bold text-primary"
            >
              {isSignup ? "Sign in" : "Create one free"}
            </button>
          </p>
          <p className="text-[10.5px] text-muted-foreground">
            By continuing you agree to our <Link to="/terms" className="underline">Terms</Link> and{" "}
            <Link to="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default AuthPage;
