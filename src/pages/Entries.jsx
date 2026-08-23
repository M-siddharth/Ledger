import React, { useMemo, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { fmt, dateBits, timeBits, toCSV, downloadCSV } from "../lib/helpers";
import { Panel, Empty, MethodTag } from "../components/UI";

export default function Entries({ data }) {
  const [filter, setFilter] = useState("all");
  const { expenses } = data;

  const filtered = useMemo(() => {
    if (filter === "paid") return expenses.filter((e) => e.paid);
    if (filter === "unpaid") return expenses.filter((e) => !e.paid);
    return expenses;
  }, [expenses, filter]);

  const exportCSV = () => {
    const rows = filtered.map((e) => ({
      date: dateBits(e.created_at).full,
      time: timeBits(e.created_at),
      place: e.place,
      category: e.category,
      method: e.method || "",
      paid: e.paid ? "Yes" : "No",
      amount: e.amount,
      notes: e.notes || "",
    }));
    const csv = toCSV(rows, ["date", "time", "place", "category", "method", "paid", "amount", "notes"]);
    downloadCSV(`ledger-expenses-${filter}.csv`, csv);
  };

  return (
    <div className="panel">
      <div className="panel-title">
        All Spends
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="filter-chips">
            {["all", "paid", "unpaid"].map((f) => (
              <button key={f} className={`chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button className="icon-btn" onClick={exportCSV} title="Export CSV"><Download size={13} /></button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <Empty>Nothing here yet.</Empty>
      ) : (
        filtered.map((e) => {
          const ds = dateBits(e.created_at);
          return (
            <div className="ledger-row" key={e.id}>
              <div className="date-stamp"><div className="d">{ds.day}</div><div className="m">{ds.mon}</div></div>
              <div className="row-main">
                <div className="row-place">{e.place}</div>
                <div className="row-meta">
                  {e.category} · {ds.full} · {timeBits(e.created_at)} <MethodTag method={e.method} />
                  {e.notes ? ` · ${e.notes}` : ""}
                </div>
              </div>
              <div className="leader" />
              <button className={`badge ${e.paid ? "paid" : "unpaid"}`} style={{ border: "none", cursor: "pointer" }} onClick={() => data.updateExpense(e.id, { paid: !e.paid })}>
                {e.paid ? "Paid" : "Unpaid"}
              </button>
              <div className="row-amount">{fmt(e.amount)}</div>
              <button className="icon-btn" onClick={() => data.deleteExpense(e.id)} title="Delete"><Trash2 size={13} /></button>
            </div>
          );
        })
      )}
    </div>
  );
}
