import React, { useEffect, useState } from "react";
import { hasSupabaseConfig, supabase } from "./supabaseClient";
import Auth from "./Auth.jsx";
import Ledger from "./Ledger.jsx";

export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return undefined;

    let active = true;
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (active) setSession(error ? null : data.session);
      })
      .catch(() => {
        if (active) setSession(null);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (active) setSession(newSession);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!hasSupabaseConfig) {
    return (
      <main className="loading-screen" style={{ padding: 24, maxWidth: 680, margin: "40px auto", lineHeight: 1.6 }}>
        <h1>The Ledger</h1>
        <h2>Supabase setup required</h2>
        <p>The app loaded, but authentication and saved data need your Supabase project settings.</p>
        <p>Create a <code>.env.local</code> file in the project root (next to <code>package.json</code>) and add:</p>
        <pre style={{ whiteSpace: "pre-wrap", padding: 16, borderRadius: 8, background: "rgba(127,127,127,.12)" }}>{`VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY`}</pre>
        <p>Replace the example values with your Supabase project URL and publishable/anon key. Save the file, stop Vite with Ctrl+C, then run <code>npm run dev:emulator</code> again.</p>
        <p>Do not use a service-role key in browser code.</p>
      </main>
    );
  }

  if (session === undefined) {
    return <div className="loading-screen">Opening the ledger…</div>;
  }

  if (!session) return <Auth />;

  return <Ledger user={session.user} />;
}
