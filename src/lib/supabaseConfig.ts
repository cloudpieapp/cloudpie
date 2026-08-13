// Central backend config. Falls back to the generated client values so the app
// keeps working when the VITE_* env vars are missing (e.g. after a remix).
const FALLBACK_URL = "https://afdgiwuweggbtgtduhvb.supabase.co";
const FALLBACK_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmZGdpd3V3ZWdnYnRndGR1aHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1ODEyNTYsImV4cCI6MjEwMjE1NzI1Nn0.BbsnYvCxoN3NkHkfVaGMIMZkmOnJF__EaesMwuojhJE";

const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const envRef = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const SUPABASE_URL =
  envUrl || (envRef ? `https://${envRef}.supabase.co` : FALLBACK_URL);

export const SUPABASE_PROJECT_REF =
  envRef || SUPABASE_URL.replace("https://", "").split(".")[0];

export const SUPABASE_ANON_KEY = envKey || FALLBACK_KEY;

export const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;

export const fn = (name: string) => `${FUNCTIONS_BASE}/${name}`;
