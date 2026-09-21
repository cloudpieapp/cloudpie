import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";

/**
 * Landing page for Supabase password-recovery links. Public route.
 */
const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated.");
    navigate("/profile", { replace: true });
  };

  return (
    <AppLayout>
      <SEO title="Reset your password – CloudPie" description="Choose a new password for your CloudPie account." />
      <div className="mx-auto w-full max-w-sm px-5 py-8">
        <h1 className="text-xl font-bold text-foreground">Set a new password</h1>
        {!ready ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Open this page from the reset link in your email to continue.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-2.5">
            <label className="flex items-center gap-2 rounded-xl border border-border bg-card px-3">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                autoComplete="new-password"
                className="min-h-[48px] w-full bg-transparent text-[13px] text-foreground outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-[13px] font-bold text-primary-foreground disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Update password
            </button>
          </form>
        )}
      </div>
    </AppLayout>
  );
};

export default ResetPasswordPage;
