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
  const { stats, expenses, insights, settings } = data;
  const [mode, setMode] = useState("month");
  const [offset, setOffset] = useState(0);

  const range = useMemo(() => {
    if (mode === "week") return getWeekRange(offset);
    if (mode === "month") return getMonthRange(offset);
    return null;
  }, [mode, offset]);

  const ins = insights(range);
  const recentCount = settings.recent_spends_count || 5;

  const changeMode = (m) => { setMode(m); setOffset(0); };

  return (
    <>
      <div className="stat-row">
        <Stat label="Total Balance" value={fmt(stats.totalBalance)} color="var(--gold)" icon={Wallet} />
        <Stat label="Total Spent" value={fmt(stats.totalSpent)} />
        <Stat label="Unpaid" value={fmt(stats.unpaid)} color="var(--rust)" />
        <Stat
          label="Net Debt"
          value={fmt(Math.abs(stats.netDebt))}
          color={stats.netDebt > 0 ? "var(--rust)" : "var(--forest)"}
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
            <div className="chart-label">Spending by Category</div>
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
            <div className="chart-label">Income by Source</div>
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
