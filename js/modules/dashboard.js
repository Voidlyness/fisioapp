import { state } from "../state.js";
import { getAppointments, getPatientName } from "../store.js";
import { euro, fmtDate, escapeHtml } from "../utils.js";

export function renderDashboard() {
  const now = new Date();
  const today = new Date().toISOString().split("T")[0];
  const appointments = getAppointments();
  const weekStart = new Date(now);
  const weekEnd = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekEnd.setDate(now.getDate() - now.getDay() + 6);

  const todayAppts = appointments.filter(item => item.date === today);
  const weekAppts = appointments.filter(item => {
    const date = new Date(item.date);
    return date >= weekStart && date <= weekEnd;
  });
  const pendingPay = appointments.filter(item => item.status === "done" && !item.payment?.paid);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthRevenue = appointments.filter(item => item.payment?.paid && new Date(item.payment.date) >= monthStart)
    .reduce((sum, item) => sum + (item.payment?.amount || 0), 0);

  document.getElementById("stat-today").textContent = todayAppts.length;
  document.getElementById("stat-week").textContent = weekAppts.length;
  document.getElementById("stat-pending").textContent = pendingPay.length;
  document.getElementById("stat-revenue").textContent = euro(monthRevenue);

  const upcoming = appointments.filter(item => item.status === "scheduled" && item.date >= today)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .slice(0, 5);

  document.getElementById("dash-upcoming").innerHTML = !upcoming.length
    ? `<div class="empty" style="padding:24px 0"><p>Sem consultas agendadas</p></div>`
    : upcoming.map(item => `
      <div class="pay-row" style="cursor:pointer" onclick="editAppointment('${item.id}')">
        <div class="pay-info">
          <div class="pay-patient">${escapeHtml(getPatientName(item.patientId))}</div>
          <div class="pay-date">${fmtDate(item.date)} · ${escapeHtml(item.time)} · ${Number(item.duration || 60)}min</div>
        </div>
        <div style="font-size:12px;color:var(--muted)">${euro(item.price)}</div>
      </div>
    `).join("");

  document.getElementById("dash-unpaid").innerHTML = !pendingPay.length
    ? `<div class="empty" style="padding:24px 0"><p>Sem pagamentos pendentes</p></div>`
    : pendingPay.slice(0, 5).map(item => `
      <div class="pay-row">
        <div class="pay-info">
          <div class="pay-patient">${escapeHtml(getPatientName(item.patientId))}</div>
          <div class="pay-date">${fmtDate(item.date)}</div>
        </div>
        <div class="pay-amount">${euro(item.price)}</div>
        <button class="btn btn-primary" style="padding:5px 10px;font-size:11px" onclick="openPaymentModal('${item.id}')">Registar</button>
      </div>
    `).join("");

  const days = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
  const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  document.getElementById("dash-date").textContent = `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;

  const username = state.currentUser?.displayName || state.currentUser?.email?.split("@")[0] || "Fisioterapeuta";
  document.getElementById("sidebar-username").textContent = username;
  document.querySelector("#page-dashboard .page-title").textContent = `Bom ${now.getHours() < 12 ? "dia" : now.getHours() < 18 ? "tarde" : "noite"}`;
}
