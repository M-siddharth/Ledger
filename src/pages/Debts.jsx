import React, { useState } from "react";
import { Plus, Check, Undo2, Trash2 } from "lucide-react";
import { fmt, dateBits } from "../lib/helpers";
import { Stat, Panel, Empty, MethodTag } from "../components/UI";

const empty = { person: "", amount: "", direction: "i_owe", due_date: "", notes: "" };

export default function Debts({ data }) {
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [methodChoice, setMethodChoice] = useState({}); // { [debtId]: 'cash'|'digital' }

  const submit = async () => {
    if (!form.person || !form.amount) return;
    setBusy(true);
    const error = await data.addDebt({
      person: form.person,
      amount: Number(form.amount),
      direction: form.direction,
      due_date: form.due_date || null,
      notes: form.notes || null,
    });
    setBusy(false);
    if (!error) setForm(empty);
  };

  const { stats, debts } = data;

  return (
    <>
      <div className="stat-row">
        <Stat label="You Owe" value={fmt(stats.owedByMe)} color="var(--rust)" />
        <Stat label="Owed To You" value={fmt(stats.owedToMe)} color="var(--forest)" />
      </div>

      <div className="panel">
        <div className="panel-title">Add a Debt</div>
        <div className="form-grid">
          <div className="field">
            <label>Person</label>
            <input type="text" placeholder="Name" value={form.person} onChange={(e) => setForm({ ...form, person: e.target.value })} />
          </div>
          <div className="field">
            <label>Amount</label>
            <input type="number" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div className="field">
            <label>Direction</label>
            <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}>
              <option value="i_owe">I owe them</option>
              <option value="owed_to_me">They owe me</option>
            </select>
          </div>
          <div className="field">
            <label>Due date (optional)</label>
            <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Notes</label>
            <input type="text" placeholder="What's it for?" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <button className="primary-btn" disabled={busy} onClick={submit}><Plus size={15} /> {busy ? "Saving…" : "Add Debt"}</button>
      </div>

      <Panel title="All Debts">
        {debts.length === 0 ? (
          <Empty>No debts recorded.</Empty>
        ) : (
          debts.map((d) => {
            const chosen = methodChoice[d.id] || "digital";
            return (
              <div className="ledger-row" key={d.id}>
                <div className="row-main">
                  <div className="row-place">
                    {d.person}{" "}
                    {d.settled && <span className="badge paid" style={{ marginLeft: 6 }}>Settled <MethodTag method={d.settled_method} /></span>}
                  </div>
                  <div className="row-meta">
                    {d.direction === "i_owe" ? "You owe" : "Owes you"}
                    {d.due_date ? ` · due ${dateBits(d.due_date).full}` : ""}
                    {d.notes ? ` · ${d.notes}` : ""}
                  </div>
                </div>
                <div className="leader" />
                <div className="row-amount" style={{ color: d.settled ? "#8B8575" : d.direction === "i_owe" ? "var(--rust)" : "var(--forest)" }}>
                  {fmt(d.amount)}
                </div>
                {!d.settled ? (
                  <div className="debt-settle">
                    <select value={chosen} onChange={(e) => setMethodChoice({ ...methodChoice, [d.id]: e.target.value })}>
                      <option value="digital">Digital</option>
                      <option value="cash">Cash</option>
                    </select>
                    <button className="icon-btn" title="Mark settled" onClick={() => data.settleDebt(d, chosen)}><Check size={13} /></button>
                  </div>
                ) : (
                  <button className="icon-btn" title="Undo settlement" onClick={() => data.unsettleDebt(d)}><Undo2 size={13} /></button>
                )}
                <button className="icon-btn" onClick={() => data.deleteDebt(d.id)} title="Delete"><Trash2 size={13} /></button>
              </div>
            );
          })
        )}
      </Panel>
      <p className="fine-print">
        Marking a debt settled automatically adds it to your spends (if you owed) or your income (if you were owed), using the payment method you pick — so your totals and balance stay accurate without double entry.
      </p>
    </>
  );
}
