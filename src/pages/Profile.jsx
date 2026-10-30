import React, { useMemo, useState } from "react";
import { User, Save, Clock, ListOrdered, Tags, Plus } from "lucide-react";
import { supabase } from "../supabaseClient";
import { Panel } from "../components/UI";
import { CATEGORIES } from "../lib/helpers";

export default function Profile({ user, data }) {
  const [form, setForm] = useState(data.settings);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [categoryMessage, setCategoryMessage] = useState("");

  const joined = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

  const categories = useMemo(() => [...new Set([
    ...CATEGORIES,
    ...(data.customCategories || []).filter(c => !c.archived).map(c => c.name),
  ])].sort((a,b) => a.localeCompare(b)), [data.customCategories]);

  const save = async () => {
    setBusy(true);
    const error = await data.saveSettings(form);
    setBusy(false);
    if (!error) setSaved(true);
  };

  const addCategory = async () => {
    const name = categoryName.trim().replace(/\s+/g, " ");
    if (!name) return;
    if (categories.some(c => c.toLowerCase() === name.toLowerCase())) {
      setCategoryMessage("This category already exists.");
      return;
    }
    setCategoryBusy(true);
    setCategoryMessage("");
    const error = await data.saveCustomLabel("custom_categories", { name, archived: false });
    setCategoryBusy(false);
    if (error) setCategoryMessage(error.message || "Could not save category.");
    else { setCategoryName(""); setCategoryMessage("Category added."); }
  };

  const signOut = () => supabase.auth.signOut();

  return <>
    <div className="panel">
      <div className="panel-title"><User size={17} /> Account</div>
      <div className="profile-row"><span>Email</span><b>{user.email}</b></div>
      <div className="profile-row"><span>Member since</span><b>{joined}</b></div>
      <button className="link-btn" style={{ marginTop: 14 }} onClick={signOut}>Sign out</button>
    </div>

    <Panel title="Preferences">
      <div className="setting-row">
        <div className="setting-text">
          <div className="setting-title"><Clock size={14} /> Set date &amp; time myself when logging a spend</div>
          <div className="setting-desc">Off by default — every spend is stamped with the exact moment you save it. Turn this on to backdate spends.</div>
        </div>
        <label className="switch">
          <input type="checkbox" checked={!!form.manual_datetime} onChange={e => setForm({ ...form, manual_datetime: e.target.checked })} />
          <span className="switch-track"><span className="switch-thumb" /></span>
        </label>
      </div>
      <div className="setting-row">
        <div className="setting-text">
          <div className="setting-title"><ListOrdered size={14} /> Recent spends shown on Dashboard</div>
          <div className="setting-desc">How many latest spends appear in the Recent Spends list.</div>
        </div>
        <input type="number" min="1" max="20" className="count-input" value={form.recent_spends_count} onChange={e => setForm({ ...form, recent_spends_count: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })} />
      </div>
      <button className="primary-btn" disabled={busy} onClick={save} style={{ marginTop: 6 }}><Save size={15} /> {busy ? "Saving…" : saved ? "Saved" : "Save Preferences"}</button>
    </Panel>

    <Panel title={<><Tags size={15} /> Personal categories</>}>
      <p className="hint">Create categories here or directly while adding a spend. Existing transactions keep their original category labels.</p>
      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        <input style={{ flex:"1 1 180px", minWidth:0, padding:"9px 11px", border:"1px solid var(--rule-light)", borderRadius:8 }} value={categoryName} onChange={e=>setCategoryName(e.target.value)} placeholder="e.g. PG expenses, Pet care" />
        <button className="primary-btn" disabled={categoryBusy || !categoryName.trim()} onClick={addCategory}><Plus size={14}/>{categoryBusy ? "Adding…" : "Add category"}</button>
      </div>
      {categoryMessage && <div className="hint" role="status">{categoryMessage}</div>}
      {categories.map(name => <div className="profile-row" key={name}><span>{CATEGORIES.includes(name) ? "Default" : "Personal"}</span><b>{name}</b></div>)}
    </Panel>
  </>;
}
