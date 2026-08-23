import React, { useState } from "react";
import { Plus } from "lucide-react";
import { CATEGORIES } from "../lib/helpers";

const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

const emptyBase = { amount: "", place: "", category: "Food", paid: true, method: "digital", notes: "" };

export default function AddSpend({ data, onSaved }) {
  const manual = data.settings.manual_datetime;
  const [form, setForm] = useState({ ...emptyBase, date: todayStr, time: timeStr });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async () => {
    if (!form.amount || !form.place) return;
    setBusy(true);
    setErr(null);
    const payload = {
      amount: Number(form.amount),
      place: form.place,
      category: form.category,
      paid: form.paid,
      method: form.method,
      notes: form.notes || null,
    };
    if (manual && form.date) {
      payload.created_at = new Date(`${form.date}T${form.time || "00:00"}`).toISOString();
    }
    const error = await data.addExpense(payload);
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setForm({ ...emptyBase, date: todayStr, time: timeStr });
    onSaved?.();
  };

  return (
    <div className="panel">
      <div className="panel-title">Log a Spend</div>
      <div className="form-grid">
        <div className="field">
          <label>Amount</label>
          <input type="number" inputMode="decimal" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </div>
        <div className="field">
          <label>Where spent</label>
          <input type="text" placeholder="e.g. Zomato, Auto, Big Bazaar" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} />
        </div>
        <div className="field">
          <label>Category</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Paid with</label>
          <div className="toggle-pair">
            <button className={form.method === "cash" ? "active on-neutral" : ""} onClick={() => setForm({ ...form, method: "cash" })}>Cash</button>
            <button className={form.method === "digital" ? "active on-neutral" : ""} onClick={() => setForm({ ...form, method: "digital" })}>Digital</button>
          </div>
        </div>
        <div className="field">
          <label>Status</label>
          <div className="toggle-pair">
            <button className={form.paid ? "active on-paid" : ""} onClick={() => setForm({ ...form, paid: true })}>Paid</button>
            <button className={!form.paid ? "active on-unpaid" : ""} onClick={() => setForm({ ...form, paid: false })}>Unpaid</button>
          </div>
        </div>

        {manual && (
          <>
            <div className="field">
              <label>Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="field">
              <label>Time</label>
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
          </>
        )}

        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Notes (optional)</label>
          <input type="text" placeholder="Any detail worth remembering" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </div>

      <div className="hint">
        {manual
          ? "You're setting date & time yourself — change this in Profile → Preferences any time."
          : `Date & time are stamped automatically. Marking this "Paid" deducts it from your ${form.method} balance right away.`}
      </div>
      {err && <div className="auth-message error" style={{ marginBottom: 12 }}>{err}</div>}
      <button className="primary-btn" disabled={busy} onClick={submit}>
        <Plus size={15} /> {busy ? "Saving…" : "Add to Ledger"}
      </button>
    </div>
  );
}
