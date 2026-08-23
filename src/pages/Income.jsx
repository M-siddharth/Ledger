import React, { useState } from "react";
import { Plus, Wallet, Banknote, CreditCard, Trash2 } from "lucide-react";
import { fmt, dateBits, timeBits } from "../lib/helpers";
import { Stat, Panel, Empty, MethodTag } from "../components/UI";

const QUICK_SOURCES = ["Salary", "Parents", "Freelance", "Gift", "Refund", "Other"];
const empty = { source: "Salary", customSource: "", amount: "", method: "digital", notes: "" };

export default function Income({ data }) {
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async () => {
    const source = form.source === "Other" ? form.customSource : form.source;
    if (!source || !form.amount) return;
    setBusy(true);
    setErr(null);
    const error = await data.addIncome({
      source,
      amount: Number(form.amount),
      method: form.method,
      notes: form.notes || null,
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setForm(empty);
  };

  const { stats, balanceHistory, income } = data;

  return (
    <>
      <div className="stat-row">
        <Stat label="Cash Balance" value={fmt(stats.cashBalance)} color="var(--forest)" icon={Banknote} />
        <Stat label="Digital Balance" value={fmt(stats.digitalBalance)} color="var(--gold)" icon={CreditCard} />
        <Stat label="Total Balance" value={fmt(stats.totalBalance)} icon={Wallet} />
      </div>

      <div className="panel">
        <div className="panel-title">Add Income</div>
        <div className="form-grid">
          <div className="field">
            <label>Source</label>
            <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              {QUICK_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {form.source === "Other" && (
            <div className="field">
              <label>Describe it</label>
              <input type="text" placeholder="e.g. Cashback, Bonus" value={form.customSource} onChange={(e) => setForm({ ...form, customSource: e.target.value })} />
            </div>
          )}
          <div className="field">
            <label>Amount</label>
            <input type="number" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div className="field">
            <label>Received as</label>
            <div className="toggle-pair">
              <button className={form.method === "cash" ? "active on-neutral" : ""} onClick={() => setForm({ ...form, method: "cash" })}>Cash</button>
              <button className={form.method === "digital" ? "active on-neutral" : ""} onClick={() => setForm({ ...form, method: "digital" })}>Digital</button>
            </div>
          </div>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Notes (optional)</label>
            <input type="text" placeholder="Any detail worth remembering" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        {err && <div className="auth-message error" style={{ marginBottom: 12 }}>{err}</div>}
        <button className="primary-btn" disabled={busy} onClick={submit}>
          <Plus size={15} /> {busy ? "Saving…" : "Add Income"}
        </button>
      </div>

      <Panel title="Balance History">
        {balanceHistory.length === 0 ? (
          <Empty>No income or paid spends yet — this fills in as you go.</Empty>
        ) : (
          balanceHistory.slice(0, 30).map((h) => {
            const ds = dateBits(h.date);
            return (
              <div className="ledger-row" key={h.id}>
                <div className="date-stamp"><div className="d">{ds.day}</div><div className="m">{ds.mon}</div></div>
                <div className="row-main">
                  <div className="row-place">{h.title}</div>
                  <div className="row-meta">{timeBits(h.date)} <MethodTag method={h.method} /></div>
                </div>
                <div className="leader" />
                <div className="row-amount" style={{ color: h.sign > 0 ? "var(--forest)" : "var(--rust)" }}>
                  {h.sign > 0 ? "+" : "−"}{fmt(h.amount)}
                </div>
              </div>
            );
          })
        )}
      </Panel>

      <Panel title="Income Entries">
        {income.length === 0 ? (
          <Empty>Nothing logged yet.</Empty>
        ) : (
          income.map((i) => {
            const ds = dateBits(i.created_at);
            return (
              <div className="ledger-row" key={i.id}>
                <div className="date-stamp"><div className="d">{ds.day}</div><div className="m">{ds.mon}</div></div>
                <div className="row-main">
                  <div className="row-place">{i.source}</div>
                  <div className="row-meta">{timeBits(i.created_at)} <MethodTag method={i.method} />{i.notes ? ` · ${i.notes}` : ""}</div>
                </div>
                <div className="leader" />
                <div className="row-amount" style={{ color: "var(--forest)" }}>{fmt(i.amount)}</div>
                <button className="icon-btn" onClick={() => data.deleteIncome(i.id)} title="Delete"><Trash2 size={13} /></button>
              </div>
            );
          })
        )}
      </Panel>
    </>
  );
}
