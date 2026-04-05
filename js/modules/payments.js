import { state } from "../state.js";
import { getAppointments, getPatientName } from "../store.js";
import { euro, escapeHtml, fmtDate, safeText, todayString } from "../utils.js";
import { closeModal, showPage, toast } from "../ui.js";

export function renderPayments() {
  const appts = getAppointments();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const received = appts.filter(item => item.payment?.paid && new Date(item.payment.date || item.date) >= monthStart);
  const pending = appts.filter(item => item.status === "done" && !item.payment?.paid).sort((a, b) => a.date.localeCompare(b.date));
  const paid = appts.filter(item => item.payment?.paid).sort((a, b) => (b.payment?.date || b.date).localeCompare(a.payment?.date || a.date));
  document.getElementById("pay-received").textContent = euro(received.reduce((sum, item) => sum + (item.payment?.amount || 0), 0));
  document.getElementById("pay-pending-amount").textContent = euro(appts.filter(item => item.status === "done" && !item.payment?.paid).reduce((sum, item) => sum + item.price, 0));
  document.getElementById("pay-sessions").textContent = paid.length;
  const icons = { dinheiro: "💵", mb_way: "📱", multibanco: "🏧", transferencia: "🏦" };
  document.getElementById("payments-pending-list").innerHTML = !pending.length ? `<div class="empty" style="padding:24px 0"><p>Sem pagamentos pendentes</p></div>` : pending.map(item => `
    <div class="pay-row"><div class="pay-info"><div class="pay-patient">${escapeHtml(getPatientName(item.patientId))}</div><div class="pay-date">Sessão ${fmtDate(item.date)} · ${escapeHtml(item.time)}</div></div><div class="pay-amount">${euro(item.price)}</div><div class="pay-actions"><button class="btn btn-primary" style="font-size:12px;padding:6px 12px" onclick="openPaymentModal('${item.id}')">Registar pagamento</button></div></div>
  `).join("");
  document.getElementById("payments-history-list").innerHTML = !paid.length ? `<div class="empty" style="padding:24px 0"><p>Sem pagamentos registados</p></div>` : paid.map(item => `
    <div class="pay-row"><div class="pay-info"><div class="pay-patient">${escapeHtml(getPatientName(item.patientId))}</div><div class="pay-date">${fmtDate(item.payment?.date || item.date)} · ${icons[item.payment?.method] || ""} ${safeText(item.payment?.method?.replace("_", " "), "Pago")}</div></div><div class="pay-amount" style="color:var(--accent)">${euro(item.payment?.amount || item.price)}</div><span class="badge badge-green">Pago</span></div>
  `).join("");
}

export async function savePayment() {
  const appointmentId = document.getElementById("pay-appt-id").value;
  const current = getAppointments().find(item => item.id === appointmentId);
  if (!current) return;
  const updated = {
    ...current,
    payment: {
      paid: true,
      method: document.getElementById("pay-method").value,
      amount: parseFloat(document.getElementById("pay-amount").value),
      date: document.getElementById("pay-date").value,
      notes: document.getElementById("pay-notes").value
    }
  };

  try {
    await state.store.saveAppointment(updated);
    closeModal("modal-payment");
    showPage(document.querySelector(".page.active")?.id.replace("page-", "") || "payments");
    toast("Pagamento registado");
  } catch (error) {
    console.error(error);
    toast("Não foi possível guardar o pagamento", "error");
  }
}

export function openPaymentModal(apptId) {
  const appointment = getAppointments().find(item => item.id === apptId);
  if (!appointment) return;
  document.getElementById("pay-appt-id").value = apptId;
  document.getElementById("pay-amount").value = appointment.price || "";
  document.getElementById("pay-date").value = todayString();
  document.getElementById("pay-notes").value = "";
  document.getElementById("pay-method").value = "mb_way";
  document.getElementById("modal-payment").classList.add("open");
}
