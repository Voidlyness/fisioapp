export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function todayString() {
  return new Date().toISOString().split("T")[0];
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function safeText(value, fallback = "–") {
  const normalized = String(value ?? "").trim();
  return normalized ? escapeHtml(normalized) : fallback;
}

export function fmtDate(value) {
  if (!value) return "–";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function euro(value) {
  return `${Number(value || 0).toFixed(0)}€`;
}
