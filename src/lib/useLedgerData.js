import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { CATEGORIES, dateInRange, nextDueDate, SOURCE_COLORS } from "./helpers";

const DEFAULT_SETTINGS = { manual_datetime: false, recent_spends_count: 5 };

export function useLedgerData(user) {
  const [expenses, setExpenses] = useState([]);
  const [debts, setDebts] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [income, setIncome] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [e, d, r, i, s] = await Promise.all([
      supabase.from("expenses").select("*").order("created_at", { ascending: false }),
      supabase.from("debts").select("*").order("created_at", { ascending: false }),
      supabase.from("recurring").select("*").order("created_at", { ascending: false }),
      supabase.from("income").select("*").order("created_at", { ascending: false }),
      supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
    ]);
    if (!e.error) setExpenses(e.data || []);
    if (!d.error) setDebts(d.data || []);
    if (!r.error) setRecurring(r.data || []);
    if (!i.error) setIncome(i.data || []);
    if (!s.error && s.data) {
      setSettings({ manual_datetime: s.data.manual_datetime, recent_spends_count: s.data.recent_spends_count });
    }
    setLoading(false);
  }, [user.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const saveSettings = async (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next); // optimistic
    const { error } = await supabase.from("user_settings").upsert({ user_id: user.id, ...next });
    if (error) await loadAll();
    return error;
  };

  // ---------- Expenses ----------
  const addExpense = async (payload) => {
    const { error } = await supabase.from("expenses").insert({ user_id: user.id, ...payload });
    if (!error) await loadAll();
    return error;
  };
  const updateExpense = async (id, patch) => {
    const { error } = await supabase.from("expenses").update(patch).eq("id", id);
    if (!error) await loadAll();
    return error;
  };
  const deleteExpense = async (id) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (!error) await loadAll();
    return error;
  };

  // ---------- Income ----------
  const addIncome = async (payload) => {
    const { error } = await supabase.from("income").insert({ user_id: user.id, ...payload });
    if (!error) await loadAll();
    return error;
  };
  const deleteIncome = async (id) => {
    const { error } = await supabase.from("income").delete().eq("id", id);
    if (!error) await loadAll();
    return error;
  };

  // ---------- Debts ----------
  const addDebt = async (payload) => {
    const { error } = await supabase.from("debts").insert({ user_id: user.id, ...payload });
    if (!error) await loadAll();
    return error;
  };
  const deleteDebt = async (id) => {
    // also clean up any linked auto-generated expense/income
    await supabase.from("expenses").delete().eq("debt_id", id);
    const { error } = await supabase.from("debts").delete().eq("id", id);
    if (!error) await loadAll();
    return error;
  };

  // Settling a debt is the interesting one: it must also move money.
  // - "i_owe" settled -> creates a real expense (so it counts in spends + balance)
  // - "owed_to_me" settled -> creates a real income entry (so it lands in balance)
  const settleDebt = async (debt, method) => {
    if (debt.direction === "i_owe") {
      const { error: expErr } = await supabase.from("expenses").insert({
        user_id: user.id,
        amount: debt.amount,
        place: `Debt paid — ${debt.person}`,
        category: "Debt",
        paid: true,
        method,
        notes: debt.notes || null,
        is_debt_payment: true,
        debt_id: debt.id,
      });
      if (expErr) return expErr;
    } else {
      const { error: incErr } = await supabase.from("income").insert({
        user_id: user.id,
        source: `Debt repaid — ${debt.person}`,
        amount: debt.amount,
        method,
        notes: debt.notes || null,
      });
      if (incErr) return incErr;
    }
    const { error } = await supabase
      .from("debts")
      .update({ settled: true, settled_method: method, settled_at: new Date().toISOString() })
      .eq("id", debt.id);
    if (!error) await loadAll();
    return error;
  };

  const unsettleDebt = async (debt) => {
    // remove whatever was auto-created, then flip the flag back
    await supabase.from("expenses").delete().eq("debt_id", debt.id);
    if (debt.direction === "owed_to_me") {
      await supabase.from("income").delete().eq("source", `Debt repaid — ${debt.person}`).eq("amount", debt.amount);
    }
    const { error } = await supabase
      .from("debts")
      .update({ settled: false, settled_method: null, settled_at: null })
      .eq("id", debt.id);
    if (!error) await loadAll();
    return error;
  };

  // ---------- Recurring ----------
  const addRecurring = async (payload) => {
    const { error } = await supabase.from("recurring").insert({ user_id: user.id, ...payload });
    if (!error) await loadAll();
    return error;
  };
  const toggleRecurringActive = async (row) => {
    await supabase.from("recurring").update({ active: !row.active }).eq("id", row.id);
    await loadAll();
  };
  const deleteRecurring = async (id) => {
    await supabase.from("recurring").delete().eq("id", id);
    await loadAll();
  };

  // ---------- Derived numbers ----------
  const stats = useMemo(() => {
    const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const paid = expenses.filter((e) => e.paid).reduce((s, e) => s + Number(e.amount), 0);
    const unpaid = totalSpent - paid;

    const owedByMe = debts.filter((d) => d.direction === "i_owe" && !d.settled).reduce((s, d) => s + Number(d.amount), 0);
    const owedToMe = debts.filter((d) => d.direction === "owed_to_me" && !d.settled).reduce((s, d) => s + Number(d.amount), 0);

    const totalIncome = income.reduce((s, i) => s + Number(i.amount), 0);

    const cashIncome = income.filter((i) => i.method === "cash").reduce((s, i) => s + Number(i.amount), 0);
    const digitalIncome = income.filter((i) => i.method === "digital").reduce((s, i) => s + Number(i.amount), 0);
    const cashSpent = expenses.filter((e) => e.paid && e.method === "cash").reduce((s, e) => s + Number(e.amount), 0);
    const digitalSpent = expenses.filter((e) => e.paid && e.method === "digital").reduce((s, e) => s + Number(e.amount), 0);

    const cashBalance = cashIncome - cashSpent;
    const digitalBalance = digitalIncome - digitalSpent;
    const totalBalance = cashBalance + digitalBalance;

    const activeRecurring = recurring
      .filter((r) => r.active)
      .map((r) => ({ ...r, next: nextDueDate(r) }))
      .sort((a, b) => a.next - b.next);

    const upcoming30 = activeRecurring.filter((r) => (r.next - new Date()) / 86400000 <= 30);

    const monthlyRecurringTotal =
      recurring.filter((r) => r.active && r.frequency === "monthly").reduce((s, r) => s + Number(r.amount), 0) +
      recurring.filter((r) => r.active && r.frequency === "weekly").reduce((s, r) => s + Number(r.amount) * 4.33, 0) +
      recurring.filter((r) => r.active && r.frequency === "yearly").reduce((s, r) => s + Number(r.amount) / 12, 0);

    return {
      totalSpent, paid, unpaid, owedByMe, owedToMe, netDebt: owedByMe - owedToMe,
      totalIncome, cashBalance, digitalBalance, totalBalance,
      activeRecurring, upcoming30, monthlyRecurringTotal,
    };
  }, [expenses, debts, recurring, income]);

  // Combined chronological money-movement feed for the Income/Balance tab
  const balanceHistory = useMemo(() => {
    const items = [
      ...income.map((i) => ({
        id: `in-${i.id}`, kind: "income", date: i.created_at, title: i.source,
        method: i.method, amount: Number(i.amount), sign: 1,
      })),
      ...expenses.filter((e) => e.paid).map((e) => ({
        id: `ex-${e.id}`, kind: "expense", date: e.created_at, title: e.place,
        method: e.method, amount: Number(e.amount), sign: -1,
      })),
    ];
    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [income, expenses]);

  // Range-scoped breakdowns for the Insights section. `range` is either
  // { start: Date, end: Date } or null (meaning "all time").
  const insights = useCallback((range) => {
    const exp = expenses.filter((e) => dateInRange(e.created_at, range));
    const inc = income.filter((i) => dateInRange(i.created_at, range));
    const settledDebts = debts.filter((d) => d.settled && d.settled_at && dateInRange(d.settled_at, range));

    const byCategory = CATEGORIES
      .map((c) => ({ name: c, value: exp.filter((e) => e.category === c).reduce((s, e) => s + Number(e.amount), 0) }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);

    const sourceMap = {};
    inc.forEach((i) => { sourceMap[i.source] = (sourceMap[i.source] || 0) + Number(i.amount); });
    const bySource = Object.entries(sourceMap)
      .map(([name, value], idx) => ({ name, value, color: SOURCE_COLORS[idx % SOURCE_COLORS.length] }))
      .sort((a, b) => b.value - a.value);

    const periodSpent = exp.reduce((s, e) => s + Number(e.amount), 0);
    const periodIncome = inc.reduce((s, i) => s + Number(i.amount), 0);
    const periodDebtPaid = settledDebts.filter((d) => d.direction === "i_owe").reduce((s, d) => s + Number(d.amount), 0);
    const periodDebtReceived = settledDebts.filter((d) => d.direction === "owed_to_me").reduce((s, d) => s + Number(d.amount), 0);

    return { byCategory, bySource, periodSpent, periodIncome, periodDebtPaid, periodDebtReceived, count: exp.length };
  }, [expenses, income, debts]);

  return {
    expenses, debts, recurring, income, loading, stats, balanceHistory, insights,
    settings, saveSettings,
    addExpense, updateExpense, deleteExpense,
    addIncome, deleteIncome,
    addDebt, deleteDebt, settleDebt, unsettleDebt,
    addRecurring, toggleRecurringActive, deleteRecurring,
    refresh: loadAll,
  };
}
