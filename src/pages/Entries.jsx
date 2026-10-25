import React, { useMemo, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { fmt, dateBits, timeBits, toCSV, downloadCSV } from "../lib/helpers";
import { Panel, Empty, MethodTag } from "../components/UI";

export default function Entries({ data }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [method, setMethod] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [editing, setEditing] = useState(null);
  const { expenses } = data;

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (filter === "paid" && !e.paid) return false;
      if (filter === "unpaid" && e.paid) return false;
      if (category !== "all" && e.category !== category) return false;
      if (method !== "all" && e.method !== method) return false;
      const d = String(e.created_at || "").slice(0,10);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      const q = query.trim().toLowerCase();
      if (q && ![e.place,e.notes,e.category,String(e.amount)].some(v => String(v || "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [expenses, filter, query, category, method, fromDate, toDate]);

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
      <div className="entry-filters">
        <input aria-label="Search entries" placeholder="Search store, notes, category, amount…" value={query} onChange={e=>setQuery(e.target.value)} />
        <select aria-label="Filter category" value={category} onChange={e=>setCategory(e.target.value)}><option value="all">All categories</option>{[...new Set(expenses.map(e=>e.category).filter(Boolean))].sort().map(c=><option key={c}>{c}</option>)}</select>
        <select aria-label="Filter payment method" value={method} onChange={e=>setMethod(e.target.value)}><option value="all">All methods</option><option value="cash">Cash</option><option value="digital">Digital</option></select>
        <input aria-label="From date" type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} />
        <input aria-label="To date" type="date" value={toDate} onChange={e=>setToDate(e.target.value)} />
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
              <button className="icon-btn" onClick={() => setEditing({id:e.id,place:e.place||"",amount:String(e.amount),category:e.category||"Other",method:e.method||"digital",notes:e.notes||"",paid:!!e.paid,created_at:String(e.created_at||"").slice(0,10)})} title="Edit">✎</button>
              <button className="icon-btn" onClick={() => { if (window.confirm("Delete this spend? This cannot be undone.")) data.deleteExpense(e.id); }} title="Delete"><Trash2 size={13} /></button>
            </div>
          );
        })
      )}
    </div>
  );
}
