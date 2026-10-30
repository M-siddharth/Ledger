import React, { useMemo, useState } from "react";
import { Wallet, TrendingUp, TrendingDown, Scale, Repeat, ChevronLeft, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { fmt, dateBits, timeBits, CAT_COLORS, getWeekRange, getMonthRange, rangeLabel } from "../lib/helpers";
import { Stat, Row, Panel, Empty } from "../components/UI";

const MODES = [
  ["week", "Week"],
  ["month", "Month"],
  ["all", "All Time"],
];

export default function Dashboard({ data }) {
  const { stats, expenses, insights, settings, debts } = data;
  const [mode, setMode] = useState("month");
  const [offset, setOffset] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailMode, setDetailMode] = useState("day");
  const [detailCategory, setDetailCategory] = useState("all");

  const range = useMemo(() => {
    if (mode === "week") return getWeekRange(offset);
    if (mode === "month") return getMonthRange(offset);
    return null;
  }, [mode, offset]);

  const ins = insights(range);
  const recentCount = settings.recent_spends_count || 5;

  const changeMode = (m) => { setMode(m); setOffset(0); };
  const detailRows = expenses.filter(e => (detailCategory === "all" || e.category === detailCategory) && (!range || (new Date(e.created_at) >= range.start && new Date(e.created_at) <= range.end))).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,20);
  const grouped = detailRows.reduce((acc,e) => { const d=new Date(e.created_at); let key; if(detailMode==="month") key=d.toLocaleDateString(undefined,{month:"long",year:"numeric"}); else if(detailMode==="week"){const x=new Date(d);x.setDate(x.getDate()-((x.getDay()+6)%7));key="Week of "+x.toLocaleDateString();} else key=d.toLocaleDateString(); acc[key]=(acc[key]||0)+Number(e.amount); return acc; },{});

  return (
    <>
      <div className="stat-row">
        <Stat label="Total Balance" value={fmt(stats.totalBalance)} color="var(--gold)" icon={Wallet} />
        <Stat label="Total Spent" value={fmt(stats.totalSpent)} />
        <Stat label="Unpaid" value={fmt(stats.unpaid)} color="var(--rust)" />
        <Stat
          label={stats.netDebt >= 0 ? "Net Receivable" : "Net Payable"}
          value={fmt(Math.abs(stats.netDebt))}
          color={stats.netDebt >= 0 ? "var(--forest)" : "var(--rust)"}
          icon={Scale}
        />
        <Stat label="Monthly Recurring" value={fmt(stats.monthlyRecurringTotal)} color="var(--gold)" icon={Repeat} />
      </div>

      <Panel
        title="Insights"
        right={
          <div className="filter-chips">
            {MODES.map(([key, label]) => (
              <button key={key} className={`chip ${mode === key ? "active" : ""}`} onClick={() => changeMode(key)}>
                {label}
              </button>
            ))}
          </div>
        }
      >
        {mode !== "all" && (
          <div className="period-nav">
            <button className="icon-btn" onClick={() => setOffset(offset - 1)} title="Previous"><ChevronLeft size={14} /></button>
            <div className="period-label mono">{rangeLabel(mode, offset)}</div>
            <button className="icon-btn" onClick={() => setOffset(Math.min(0, offset + 1))} disabled={offset >= 0} title="Next">
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        <div className="insights-numbers" style={{ marginBottom: 16 }}>
          <div className="insight-line">
            <TrendingDown size={15} color="var(--rust)" />
            <span>Spent</span>
            <b className="mono">{fmt(ins.periodSpent)}</b>
          </div>
          <div className="insight-line">
            <TrendingUp size={15} color="var(--forest)" />
            <span>Income</span>
            <b className="mono">{fmt(ins.periodIncome)}</b>
          </div>
          <div className="insight-line">
            <Scale size={15} color="var(--rust)" />
            <span>Debts paid</span>
            <b className="mono">{fmt(ins.periodDebtPaid)}</b>
          </div>
          <div className="insight-line">
            <Scale size={15} color="var(--forest)" />
            <span>Debts received</span>
            <b className="mono">{fmt(ins.periodDebtReceived)}</b>
          </div>
        </div>

        <div className="charts-grid">
          <div>
            <button type="button" className="chart-label chart-open" onClick={() => setDetailOpen(true)}>Spending by Category · Tap for details ↗</button>
            {ins.byCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={ins.byCategory} dataKey="value" nameKey="name" innerRadius={42} outerRadius={72} paddingAngle={2}>
                    {ins.byCategory.map((c, i) => <Cell key={i} fill={CAT_COLORS[c.name] || "#8B8575"} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 10.5, fontFamily: "Inter" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: "40px 10px" }}>No spends in this period.</div>
            )}
          </div>
          <div>
            <button type="button" className="chart-label chart-open" onClick={() => setDetailOpen(true)}>Income by Source · Tap for details ↗</button>
            {ins.bySource.length > 0 ? (
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={ins.bySource} dataKey="value" nameKey="name" innerRadius={42} outerRadius={72} paddingAngle={2}>
                    {ins.bySource.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 10.5, fontFamily: "Inter" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: "40px 10px" }}>No income in this period.</div>
            )}
          </div>
        </div>
      </Panel>

      {detailOpen && <div className="edit-overlay" role="dialog" aria-modal="true" aria-label="Detailed insights">
        <div className="edit-card insight-detail">
          <div className="panel-title">Detailed insights <button className="icon-btn" onClick={() => setDetailOpen(false)}>Close ✕</button></div>
          <div className="form-grid">
            <div className="field"><label>Group by</label><select value={detailMode} onChange={e => setDetailMode(e.target.value)}><option value="day">Day-wise</option><option value="week">Week-wise</option><option value="month">Month-wise</option></select></div>
            <div className="field"><label>Category</label><select value={detailCategory} onChange={e => setDetailCategory(e.target.value)}><option value="all">All categories</option>{[...new Set(expenses.map(e => e.category).filter(Boolean))].sort().map(x => <option key={x}>{x}</option>)}</select></div>
          </div>
          <div className="detail-bars">{Object.entries(grouped).map(([key,value]) => <div className="planning-record" key={key}><div className="record-head"><b>{key}</b><b>{fmt(value)}</b></div><div className="progress-track"><div className="progress-fill" style={{width:(value/Math.max(1,...Object.values(grouped))*100)+"%"}} /></div></div>)}</div>
          <h3>Latest 20 entries</h3>
          {detailRows.length === 0 ? <Empty>No entries in this selection.</Empty> : detailRows.map(e => <div className="ledger-row" key={e.id}><div className="row-main"><b>{e.place}</b><div className="row-meta">{e.category} · {new Date(e.created_at).toLocaleString()} · {e.paid ? "Paid" : "Unpaid"}</div></div><b className="row-amount">{fmt(e.amount)}</b></div>)}
        </div>
      </div>}
      <Panel title="Debt position"><div className="insights-numbers"><div className="insight-line"><span>Gross receivables</span><b className="mono">{fmt(stats.owedToMe)}</b></div><div className="insight-line"><span>Gross payables</span><b className="mono">{fmt(stats.owedByMe)}</b></div><div className="insight-line"><span>Net position</span><b className="mono" style={{color:stats.netDebt>=0?"var(--forest)":"var(--rust)"}}>{stats.netDebt>=0?"You are owed ":"You owe "}{fmt(Math.abs(stats.netDebt))}</b></div></div><div style={{marginTop:12}}>{Object.entries(debts.filter(d=>!d.settled).reduce((acc,d)=>{const k=(d.person||"Unknown").trim().toLowerCase();if(!acc[k])acc[k]={person:d.person,items:[],total:0,direction:d.direction};acc[k].items.push(d);acc[k].total+=Number(d.amount);return acc;},{})).map(([key,g])=><details key={key} style={{padding:"8px 0",borderTop:"1px solid var(--rule-light)"}}><summary style={{cursor:"pointer",fontSize:13}}>{g.person} · {g.direction==="i_owe"?"You owe":"Owes you"} · <b>{fmt(g.total)}</b> ({g.items.length})</summary>{g.items.map(d=><div key={d.id} style={{padding:"7px 8px",fontSize:12,color:"#6B655A"}}>{d.notes||"Debt entry"} · {fmt(d.amount)}{d.due_date?" · due "+d.due_date:""}</div>)}</details>)}</div></Panel>

      <Panel title="Upcoming Recurring (next 30 days)">
        {stats.upcoming30.length === 0 ? (
          <Empty>Nothing due soon.</Empty>
        ) : (
          stats.upcoming30.map((r) => {
            const ds = dateBits(r.next);
            return (
              <Row key={r.id} day={ds.day} mon={ds.mon} title={r.name} meta={`${r.category} · ${r.frequency}`} amount={fmt(r.amount)} amountColor="var(--gold)" />
            );
          })
        )}
      </Panel>

      <Panel title={`Recent Spends (last ${recentCount})`}>
        {expenses.slice(0, recentCount).length === 0 ? (
          <Empty>No spends logged yet.</Empty>
        ) : (
          expenses.slice(0, recentCount).map((e) => {
            const ds = dateBits(e.created_at);
            return (
              <Row
                key={e.id}
                day={ds.day}
                mon={ds.mon}
                title={e.place}
                meta={`${e.category} · ${timeBits(e.created_at)}${e.notes ? ` · ${e.notes}` : ""}`}
                amount={fmt(e.amount)}
                badge={e.paid ? "Paid" : "Unpaid"}
                badgeType={e.paid ? "paid" : "unpaid"}
              />
            );
          })
        )}
      </Panel>
    </>
  );
}
