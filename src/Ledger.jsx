import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import { useLedgerData } from "./lib/useLedgerData";
import Dashboard from "./pages/Dashboard.jsx";
import AddSpend from "./pages/AddSpend.jsx";
import Income from "./pages/Income.jsx";
import Debts from "./pages/Debts.jsx";
import Recurring from "./pages/Recurring.jsx";
import Entries from "./pages/Entries.jsx";
import Profile from "./pages/Profile.jsx";
import Planning from "./pages/Planning.jsx";
import Activity from "./pages/Activity.jsx";
import { UserRound } from "lucide-react";

const TABS = [
  ["dashboard", "Dashboard"],
  ["add", "Add Spend"],
  ["income", "Income"],
  ["debts", "Debts"],
  ["recurring", "Recurring"],
  ["entries", "All Entries"],
  ["planning", "Planning"],
  ["activity", "Activity"],
];

export default function Ledger({ user }) {
  const [tab, setTab] = useState("dashboard");
  const data = useLedgerData(user);
  const signOut = () => supabase.auth.signOut();

  return (
    <div className="ledger-app">
      <div className="ledger-header">
        <div>
          <div className="ledger-title">The Ledger</div>
          <div className="ledger-sub">{user.email}</div>
        </div>
        <button className="profile-icon" aria-label="Open account settings" title="Account & settings" onClick={() => setTab("profile")}><UserRound size={17} /></button>
      </div>

      <div className="tabs">
        {TABS.map(([key, label]) => (
          <button key={key} className={`tab-btn ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      <div className="content">
        {data.loading ? (
          <div className="empty-state">Loading your ledger…</div>
        ) : (
          <>
            {tab === "dashboard" && <Dashboard data={data} />}
            {tab === "add" && <AddSpend data={data} onSaved={() => setTab("dashboard")} />}
            {tab === "income" && <Income data={data} />}
            {tab === "debts" && <Debts data={data} />}
            {tab === "recurring" && <Recurring data={data} />}
            {tab === "entries" && <Entries data={data} />}
            {tab === "planning" && <Planning data={data} />}
            {tab === "activity" && <Activity data={data} />}
            {tab === "profile" && <Profile user={user} data={data} />}
          </>
        )}
      </div>
    </div>
  );
}
