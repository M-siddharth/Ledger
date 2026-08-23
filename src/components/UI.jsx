import React from "react";

export function Stat({ label, value, color, icon: Icon }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={color ? { color } : undefined}>
        {Icon && <Icon size={16} style={{ marginRight: 6, verticalAlign: -3 }} />}
        {value}
      </div>
    </div>
  );
}

export function Row({ day, mon, title, meta, amount, amountColor, badge, badgeType, actions }) {
  return (
    <div className="ledger-row">
      <div className="date-stamp"><div className="d">{day}</div><div className="m">{mon}</div></div>
      <div className="row-main">
        <div className="row-place">{title}</div>
        <div className="row-meta">{meta}</div>
      </div>
      <div className="leader" />
      {badge && <span className={`badge ${badgeType}`} style={{ marginRight: 10 }}>{badge}</span>}
      <div className="row-amount" style={amountColor ? { color: amountColor } : undefined}>{amount}</div>
      {actions && <div style={{ display: "flex", gap: 6, marginLeft: 10 }}>{actions}</div>}
    </div>
  );
}

export function Panel({ title, right, children }) {
  return (
    <div className="panel">
      <div className="panel-title">
        {title}
        {right}
      </div>
      {children}
    </div>
  );
}

export function MethodTag({ method }) {
  if (!method) return null;
  return <span className={`method-tag ${method}`}>{method === "cash" ? "Cash" : "Digital"}</span>;
}

export function Empty({ children }) {
  return <div className="empty-state">{children}</div>;
}
