import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Row { id: string; label: string; base: string; sort: number; enabled: boolean }

const AdminPage = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
    supabase.from("player_servers").select("*").order("sort").then(({ data }) => setRows((data as Row[]) || []));
  }, [session]);

  const signIn = async (signup: boolean) => {
    setBusy(true);
    const { error } = signup
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (signup) toast.success("Check your email to confirm your account, then sign in.");
  };

  const update = (id: string, patch: Partial<Row>) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const save = async (row: Row) => {
    const { error } = await supabase.from("player_servers")
      .update({ label: row.label, base: row.base.trim().replace(/\/+$/, ""), enabled: row.enabled, updated_at: new Date().toISOString() })
      .eq("id", row.id);
    if (error) toast.error(error.message); else toast.success(`${row.label} saved — live for everyone`);
  };

  const input = "w-full h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground";

  if (!session) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-4">
        <div className="w-full max-w-sm space-y-3 rounded-xl border border-border bg-card p-6">
          <h1 className="text-xl text-foreground">CloudPie Admin</h1>
          <input className={input} placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={input} placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button disabled={busy} onClick={() => signIn(false)} className="w-full h-10 rounded-md bg-primary text-primary-foreground font-semibold">Sign in</button>
          <button disabled={busy} onClick={() => signIn(true)} className="w-full h-10 rounded-md border border-border text-foreground">Create account</button>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-4 text-center text-foreground">
        <div className="space-y-3">
          <p>This account is not an admin.</p>
          <button onClick={() => supabase.auth.signOut()} className="text-primary underline">Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl text-foreground">Player servers</h1>
          <button onClick={() => supabase.auth.signOut()} className="text-sm text-muted-foreground hover:text-foreground">Sign out</button>
        </div>
        <p className="text-xs text-muted-foreground">Enter the source link (e.g. https://cinesrc.st/embed). Movies open at link/movie/ID and episodes at link/tv/ID/season/episode.</p>
        {rows.map((r) => (
          <div key={r.id} className="grid gap-2 rounded-xl border border-border bg-card p-4 sm:grid-cols-[140px_1fr_auto_auto] sm:items-center">
            <input className={input} value={r.label} onChange={(e) => update(r.id, { label: e.target.value })} />
            <input className={input} value={r.base} onChange={(e) => update(r.id, { base: e.target.value })} />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={r.enabled} onChange={(e) => update(r.id, { enabled: e.target.checked })} /> On
            </label>
            <button onClick={() => save(r)} className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">Save</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPage;
