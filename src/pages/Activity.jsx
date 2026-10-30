import React, { useMemo, useState } from "react";
import { fmt } from "../lib/helpers";
import { History, Search } from "lucide-react";

const LABELS = {
  expenses: "Expense", income: "Income", debts: "Debt", recurring: "Recurring payment",
  balance_adjustments: "Balance adjustment", balance_transfers: "Account transfer",
  budgets: "Monthly budget", savings_goals: "Savings goal",
  custom_categories: "Category", custom_payment_methods: "Payment method",
};
const PRETTY = {
  amount: "Amount", category: "Category", place: "Description", source: "Source",
  method: "Account", from_method: "From", to_method: "To", reason: "Reason",
  notes: "Notes", name: "Name", target_amount: "Target amount",
  current_amount: "Saved amount", target_date: "Target date", month_start: "Month",
  settled: "Settled", active: "Active", archived: "Archived", paid: "Paid",
};
const display = (key, value) => {
  if (value == null || value === "") return "—";
  if (["amount","target_amount","current_amount"].includes(key) && Number.isFinite(Number(value))) return fmt(Number(value));
  if (["settled","active","archived","paid"].includes(key)) return value ? "Yes" : "No";
  if (key.endsWith("_method") || key === "method") return value === "cash" ? "Cash" : value === "digital" ? "Digital" : String(value);
  return String(value);
};
export default function Activity({ data }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const rows = useMemo(() => (data.activityLog || []).filter(row => {
    const matchesFilter = filter === "all" || row.action === filter;
    const blob = [LABELS[row.table_name] || row.table_name, row.action, row.record_id,
      JSON.stringify(row.old_data || {}), JSON.stringify(row.new_data || {})].join(" ").toLowerCase();
    return matchesFilter && blob.includes(query.toLowerCase());
  }), [data.activityLog, filter, query]);
  const fields = (row) => {
    const before = row.old_data || {};
    const after = row.new_data || {};
    const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])]
      .filter(k => !["id","user_id","created_at","updated_at"].includes(k))
      .filter(k => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
    return keys.slice(0, 8).map(key => ({ key, before: before[key], after: after[key] }));
  };
  return <div className="panel">
    <div className="panel-title"><History size={17}/> Activity history <span className="badge">{rows.length} records</span></div>
    <p className="hint">A permanent record of creations, edits and deletions. Deleted entries remain visible here.</p>
    <div className="entry-filters" style={{gridTemplateColumns:"minmax(0,1fr) 160px"}}>
      <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search activity…" aria-label="Search activity"/>
      <select value={filter} onChange={e=>setFilter(e.target.value)} aria-label="Filter activity">
        <option value="all">All actions</option><option value="created">Created</option><option value="updated">Edited</option><option value="deleted">Deleted</option>
      </select>
    </div>
    {!rows.length ? <div className="empty-state">No activity records found. New changes will appear here after the v5 audit migration is installed.</div> :
      rows.map(row => <article key={row.id} style={{padding:"13px 0",borderBottom:"1px solid var(--rule-light)"}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
          <strong>{LABELS[row.table_name] || row.table_name} {row.action === "updated" ? "edited" : row.action}</strong>
          <span className="row-meta">{new Date(row.changed_at).toLocaleString()}</span>
        </div>
        {fields(row).map(field => <div key={field.key} style={{display:"grid",gridTemplateColumns:"minmax(100px,1fr) 1fr 1fr",gap:8,fontSize:12,paddingTop:7}}>
          <span style={{color:"#6B655A"}}>{PRETTY[field.key] || field.key}</span>
          <span style={{color:row.action==="updated"?"#A6452E":"inherit",overflowWrap:"anywhere"}}>{field.before === undefined ? "—" : display(field.key,field.before)}</span>
          <span style={{color:"#2F5233",overflowWrap:"anywhere"}}>{field.after === undefined ? "—" : display(field.key,field.after)}</span>
        </div>)}
        {row.action==="deleted" && <span className="row-meta">Deleted record retained in audit history · ID {row.record_id}</span>}
        {row.action==="created" && <span className="row-meta">New record · ID {row.record_id}</span>}
      </article>)
    }
  </div>;
}
