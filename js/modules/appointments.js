import { state } from "../state.js";
import { getAppointments, getPatientName, getPatients } from "../store.js";
import { escapeHtml, fmtDate, safeText, uid } from "../utils.js";
import { closeModal, populatePatientSelect, showPage, toast } from "../ui.js";

export function renderAppointments(filter = "all") {
  state.currentAppointmentFilter = filter;
  let appts = [...getAppointments()].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  if (filter !== "all") appts = appts.filter(item => item.status === filter);
  const tbody = document.getElementById("appointments-body");
  if (!appts.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">Sem consultas</td></tr>`;
    return;
  }

  tbody.innerHTML = appts.map(item => {
    const name = getPatientName(item.patientId);
    const initials = name.split(" ").map(word => word[0]).join("").slice(0, 2).toUpperCase();
    const statusClass = item.status === "scheduled" ? "badge-blue" : item.status === "done" ? "badge-green" : "badge-red";
    const statusLabel = item.status === "scheduled" ? "Agendada" : item.status === "done" ? "Realizada" : "Cancelada";
    return `
      <tr>
        <td><div class="table-person"><div class="patient-avatar table-avatar">${escapeHtml(initials)}</div><span class="patient-link" onclick="openPatientDetail('${item.patientId}')">${escapeHtml(name)}</span></div></td>
        <td>${fmtDate(item.date)}</td>
        <td>${escapeHtml(item.time)}</td>
        <td class="truncate-cell">${safeText(item.address)}</td>
        <td><span class="badge ${statusClass}">${statusLabel}</span></td>
        <td>${item.payment?.paid ? `<span class="badge badge-green">${safeText(item.payment.method, "Pago")}</span>` : item.status === "done" ? `<button class="btn btn-ghost" style="padding:4px 10px;font-size:11px" onclick="openPaymentModal('${item.id}')">Registar</button>` : `<span class="badge badge-gray">–</span>`}</td>
        <td><button class="btn btn-ghost" style="padding:4px 10px;font-size:11px" onclick="editAppointment('${item.id}')">Editar</button></td>
      </tr>
    `;
  }).join("");
}

export async function saveAppointment() {
  const editId = document.getElementById("appt-edit-id").value;
  const patientId = document.getElementById("appt-patient").value;
  const date = document.getElementById("appt-date").value;
  if (!patientId) return toast("Seleciona um paciente", "error");
  if (!date) return toast("Seleciona uma data", "error");
  const current = getAppointments().find(item => item.id === editId);
  const appointment = {
    id: editId || uid(),
    patientId,
    date,
    time: document.getElementById("appt-time").value,
    address: document.getElementById("appt-address").value,
    price: parseFloat(document.getElementById("appt-price").value) || 0,
    duration: parseInt(document.getElementById("appt-duration").value, 10) || 60,
    notes: document.getElementById("appt-notes").value,
    status: document.getElementById("appt-status").value,
    payment: current?.payment || { paid: false },
    createdAt: current?.createdAt || Date.now()
  };

  try {
    await state.store.saveAppointment(appointment);
    closeModal("modal-appointment");
    showPage(document.querySelector(".page.active")?.id.replace("page-", "") || "dashboard");
    toast(editId ? "Consulta atualizada" : "Consulta criada");
  } catch (error) {
    console.error(error);
    toast("Não foi possível guardar a consulta", "error");
  }
}

export function editAppointment(apptId) {
  const appointment = getAppointments().find(item => item.id === apptId);
  if (!appointment) return;
  document.getElementById("appt-edit-id").value = appointment.id;
  document.getElementById("appt-modal-title").textContent = "Editar consulta";
  populatePatientSelect(getPatients(), appointment.patientId);
  document.getElementById("appt-date").value = appointment.date;
  document.getElementById("appt-time").value = appointment.time;
  document.getElementById("appt-address").value = appointment.address || "";
  document.getElementById("appt-price").value = appointment.price || "";
  document.getElementById("appt-duration").value = appointment.duration || 60;
  document.getElementById("appt-notes").value = appointment.notes || "";
  document.getElementById("appt-status").value = appointment.status;
  document.getElementById("modal-appointment").classList.add("open");
}

export async function deleteAppointment() {
  const appointmentId = document.getElementById("appt-edit-id").value;
  if (!appointmentId) return;

  const appointment = getAppointments().find(item => item.id === appointmentId);
  if (!appointment) return;

  const patientName = getPatientName(appointment.patientId);
  const message = `Queres mesmo eliminar a consulta de ${patientName} em ${fmtDate(appointment.date)} às ${appointment.time}?`;
  if (!window.confirm(message)) return;

  try {
    await state.store.deleteAppointment(appointmentId);
    closeModal("modal-appointment");
    showPage(document.querySelector(".page.active")?.id.replace("page-", "") || "appointments");
    toast("Consulta eliminada");
  } catch (error) {
    console.error(error);
    toast("Não foi possível eliminar a consulta", "error");
  }
}
