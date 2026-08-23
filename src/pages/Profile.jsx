import React, { useState } from "react";
import { User, Save, Clock, ListOrdered } from "lucide-react";
import { supabase } from "../supabaseClient";
import { Panel, Stat } from "../components/UI";

export default function Profile({ user, data }) {
  const [form, setForm] = useState(data.settings);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const joined = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

  const save = async () => {
    setBusy(true);
    const error = await data.saveSettings(form);
    setBusy(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  };

  const signOut = () => supabase.auth.signOut();

  return (
    <>
      <div className="panel">
        <div className="panel-title"><User size={17} style={{ marginRight: 4 }} /> Account</div>
        <div className="profile-row"><span>Email</span><b>{user.email}</b></div>
        <div className="profile-row"><span>Member since</span><b>{joined}</b></div>
        <button className="link-btn" style={{ marginTop: 14 }} onClick={signOut}>Sign out</button>
      </div>

      <Panel title="Preferences">
        <div className="setting-row">
          <div className="setting-text">
            <div className="setting-title"><Clock size={14} /> Set date &amp; time myself when logging a spend</div>
            <div className="setting-desc">
              Off by default — every spend is stamped with the exact moment you save it. Turn this on if you sometimes log
              spends after the fact and want to backdate them.
            </div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={form.manual_datetime}
              onChange={(e) => setForm({ ...form, manual_datetime: e.target.checked })}
            />
            <span className="switch-track"><span className="switch-thumb" /></span>
          </label>
        </div>

        <div className="setting-row">
          <div className="setting-text">
            <div className="setting-title"><ListOrdered size={14} /> Recent spends shown on Dashboard</div>
            <div className="setting-desc">How many of your latest spends appear in the "Recent Spends" list.</div>
          </div>
          <input
            type="number"
            min="1"
            max="20"
            className="count-input"
            value={form.recent_spends_count}
            onChange={(e) => setForm({ ...form, recent_spends_count: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })}
          />
        </div>

        <button className="primary-btn" disabled={busy} onClick={save} style={{ marginTop: 6 }}>
          <Save size={15} /> {busy ? "Saving…" : saved ? "Saved" : "Save Preferences"}
        </button>
      </Panel>
    </>
  );
}
