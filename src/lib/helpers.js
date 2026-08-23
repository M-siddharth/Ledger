export const CATEGORIES = [
  "Food", "Groceries", "Transport", "Bills", "Rent", "Shopping",
  "Health", "Entertainment", "Education", "Debt", "Other",
];

export const CAT_COLORS = {
  Food: "#C2603F", Groceries: "#4C7A52", Transport: "#B8862E", Bills: "#6B5B95",
  Rent: "#3A5A73", Shopping: "#A6452E", Health: "#2F5233", Entertainment: "#8B5E3C",
  Education: "#4A6670", Debt: "#8B3A3A", Other: "#8B8575",
};

export const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n) || 0);

export const dateBits = (d) => {
  const dt = new Date(d);
  return {
    day: dt.getDate(),
    mon: dt.toLocaleString("en-IN", { month: "short" }).toUpperCase(),
    full: dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
  };
};

export const timeBits = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

export function nextDueDate(rec) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (rec.frequency === "weekly") {
    const target = Number(rec.due_day);
    let d = new Date(today);
    while (d.getDay() !== target) d.setDate(d.getDate() + 1);
    if (d < today) d.setDate(d.getDate() + 7);
    return d;
  }

  if (rec.frequency === "yearly") {
    const month = Number(rec.due_month) - 1;
    const day = Math.min(Number(rec.due_day), 28);
    let d = new Date(today.getFullYear(), month, day);
    if (d < today) d = new Date(today.getFullYear() + 1, month, day);
    return d;
  }

  // monthly
  const day = Math.min(Number(rec.due_day), 28);
  let d = new Date(today.getFullYear(), today.getMonth(), day);
  if (d < today) d = new Date(today.getFullYear(), today.getMonth() + 1, day);
  return d;
}

export function inPeriod(dateStr, period) {
  const d = new Date(dateStr);
  const now = new Date();
  if (period === "week") {
    const start = new Date(now); start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0);
    return d >= start;
  }
  if (period === "month") {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  return true; // "all"
}

// Navigable calendar week (Sun–Sat), offset 0 = current week, -1 = previous, etc.
export function getWeekRange(offset = 0) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + offset * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// Navigable calendar month, offset 0 = current month, -1 = previous, etc.
export function getMonthRange(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function rangeLabel(mode, offset) {
  if (mode === "week") {
    const { start, end } = getWeekRange(offset);
    const f = (d) => d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    const yr = start.getFullYear() !== new Date().getFullYear() ? ` ${start.getFullYear()}` : "";
    return `${f(start)} – ${f(end)}${yr}`;
  }
  if (mode === "month") {
    const { start } = getMonthRange(offset);
    return start.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }
  return "All Time";
}

export function dateInRange(dateStr, range) {
  if (!range) return true;
  const t = new Date(dateStr).getTime();
  return t >= range.start.getTime() && t <= range.end.getTime();
}

export const SOURCE_COLORS = ["#2F5233", "#B8862E", "#3A5A73", "#8B5E3C", "#6B5B95", "#A6452E", "#4A6670"];

export function toCSV(rows, headers) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.map(esc).join(",")];
  for (const row of rows) lines.push(headers.map((h) => esc(row[h])).join(","));
  return lines.join("\n");
}

export function downloadCSV(filename, csv) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
