import React, { useState } from "react";
import { Plus, Pause, Play, Trash2 } from "lucide-react";
import { CATEGORIES, fmt, dateBits, nextDueDate } from "../lib/helpers";
import { Panel, Empty } from "../components/UI";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const empty = { name: "", amount: "", frequency: "monthly", due_day: "1", due_month: "1", category: "Bills" };

export default function Recurring({ data }) {
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!form.name || !form.amount) return;
    setBusy(true);
    const error = await data.addRecurring({
      name: form.name,
      amount: Number(form.amount),
      frequency: form.frequency,
      due_day: Number(form.due_day),
      due_month: form.frequency === "yearly" ? Number(form.due_month) : null,
      category: form.category,
    });
    setBusy(false);
    if (!error) setForm(empty);
  };

  const { recurring } = data;

  return (
    <>
      <div className="panel">
        <div className="panel-title">Add Regular Payment</div>
        <div className="form-grid">
          <div className="field">
            <label>Name</label>
            <input type="text" placeholder="e.g. Netflix, Rent, Insurance" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Amount</label>
            <input type="number" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div className="field">
            <label>Frequency</label>
            <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value, due_day: "1" })}>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {form.frequency === "monthly" && (
            <div className="field">
              <label>Day of month</label>
              <input type="number" min="1" max="28" value={form.due_day} onChange={(e) => setForm({ ...form, due_day: e.target.value })} />
            </div>
          )}
          {form.frequency === "weekly" && (
            <div className="field">
              <label>Day of week</label>
              <select value={form.due_day} onChange={(e) => setForm({ ...form, due_day: e.target.value })}>
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
          )}
          {form.frequency === "yearly" && (
            <>
              <div className="field">
                <label>Month</label>
                <select value={form.due_month} onChange={(e) => setForm({ ...form, due_month: e.target.value })}>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Day</label>
                <input type="number" min="1" max="28" value={form.due_day} onChange={(e) => setForm({ ...form, due_day: e.target.value })} />
              </div>
            </>
          )}

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <button className="primary-btn" disabled={busy} onClick={submit}><Plus size={15} /> {busy ? "Saving…" : "Add Recurring Payment"}</button>
      </div>

      <Panel title="Regular Payments">
        {recurring.length === 0 ? (
          <Empty>No recurring payments set up yet.</Empty>
        ) : (
          recurring.map((r) => {
            const ds = dateBits(nextDueDate(r));
            return (
              <div className="ledger-row" key={r.id}>
                <div className="date-stamp"><div className="d">{ds.day}</div><div className="m">{ds.mon}</div></div>
                <div className="row-main">
                  <div className="row-place">{r.name}{!r.active && <span className="badge unpaid" style={{ marginLeft: 6 }}>Paused</span>}</div>
                  <div className="row-meta">{r.category} · {r.frequency}</div>
                </div>
                <div className="leader" />
                <div className="row-amount" style={{ color: "var(--gold)" }}>{fmt(r.amount)}</div>
                <div style={{ display: "flex", gap: 6, marginLeft: 10 }}>
                  <button className="icon-btn" onClick={() => data.toggleRecurringActive(r)} title={r.active ? "Pause" : "Resume"}>
                    {r.active ? <Pause size={13} /> : <Play size={13} />}
                  </button>
                  <button className="icon-btn" onClick={() => data.deleteRecurring(r.id)} title="Delete"><Trash2 size={13} /></button>
                </div>
              </div>
            );
          })
        )}
      </Panel>
    </>
  );
}
