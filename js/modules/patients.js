import { state } from "../state.js";
import { getAppointments, getPatients } from "../store.js";
import { escapeHtml, euro, fmtDate, safeText, uid } from "../utils.js";
import { closeModal, showPage, toast } from "../ui.js";

export function renderPatients(filter = "") {
  state.currentPatientFilter = filter;
  const query = filter.trim().toLowerCase();
  const patients = getPatients().filter(patient =>
    !query ||
    patient.name.toLowerCase().includes(query) ||
    (patient.diagnosis || "").toLowerCase().includes(query)
  );

  document.getElementById("patients-count").textContent = `${patients.length} paciente${patients.length !== 1 ? "s" : ""}`;
  const grid = document.getElementById("patients-grid");
  if (!patients.length) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg><p>Sem pacientes${query ? " encontrados" : ""}.<br>Adiciona o primeiro paciente.</p></div>`;
    return;
  }

  grid.innerHTML = patients.map(patient => {
    const initials = patient.name.split(" ").map(word => word[0]).join("").slice(0, 2).toUpperCase();
    const appts = getAppointments().filter(item => item.patientId === patient.id);
    const nextAppt = appts.filter(item => item.status === "scheduled").sort((a, b) => a.date.localeCompare(b.date))[0];
    const unpaid = appts.filter(item => item.status === "done" && !item.payment?.paid).reduce((sum, item) => sum + item.price, 0);
    return `
      <div class="patient-card" onclick="openPatientDetail('${patient.id}')">
        <div class="patient-avatar">${escapeHtml(initials)}</div>
        <div class="patient-name">${escapeHtml(patient.name)}</div>
        <div class="patient-diag">${safeText(patient.diagnosis, "Sem diagnóstico")}</div>
        <div class="patient-meta">
          ${nextAppt ? `<span class="badge badge-blue">Próxima: ${fmtDate(nextAppt.date)}</span>` : ""}
          ${unpaid > 0 ? `<span class="badge badge-amber">${euro(unpaid)} em dívida</span>` : ""}
          ${appts.length ? `<span class="badge badge-gray">${appts.length} sess.</span>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

export function openPatientDetail(patientId) {
  state.currentDetailPatientId = patientId;
  const patient = getPatients().find(item => item.id === patientId);
  if (!patient) return;

  document.getElementById("detail-patient-name").textContent = patient.name;
  const appts = getAppointments().filter(item => item.patientId === patientId).sort((a, b) => b.date.localeCompare(a.date));
  const age = patient.dob ? Math.floor((Date.now() - new Date(patient.dob)) / 31557600000) : "–";
  let html = `
    <div class="detail-grid">
      <div><div class="card-title">Idade</div><div class="detail-value">${age} anos</div></div>
      <div><div class="card-title">Telemóvel</div><div class="detail-value">${safeText(patient.phone)}</div></div>
      <div><div class="card-title">Diagnóstico</div><div class="detail-value-muted">${safeText(patient.diagnosis)}</div></div>
      <div><div class="card-title">Valor/sessão</div><div class="detail-value">${patient.price ? euro(patient.price) : "–"}</div></div>
      <div class="detail-full"><div class="card-title">Morada</div><div class="detail-value-muted">${safeText(patient.address)}</div></div>
      ${patient.notes ? `<div class="detail-full"><div class="card-title">Notas</div><div class="detail-note">${escapeHtml(patient.notes)}</div></div>` : ""}
    </div>
    <div class="card-title" style="margin-bottom:10px">Histórico de consultas (${appts.length})</div>
  `;

  html += !appts.length
    ? `<div class="empty"><p>Sem consultas registadas</p></div>`
    : appts.slice(0, 6).map(item => `
      <div class="pay-row">
        <div class="pay-info">
          <div class="pay-patient">${fmtDate(item.date)} às ${escapeHtml(item.time)}</div>
          <div class="pay-date">${safeText(item.address)} · ${Number(item.duration || 60)}min</div>
        </div>
        <span class="badge ${item.status === "scheduled" ? "badge-blue" : item.status === "done" ? "badge-green" : "badge-red"}">${item.status === "scheduled" ? "Agendada" : item.status === "done" ? "Realizada" : "Cancelada"}</span>
        <div class="pay-amount">${euro(item.price)}</div>
        <span class="badge ${item.payment?.paid ? "badge-green" : "badge-amber"}">${item.payment?.paid ? "Pago" : "Pendente"}</span>
      </div>
    `).join("");

  document.getElementById("patient-detail-content").innerHTML = html;
  document.getElementById("modal-patient-detail").classList.add("open");
}

export async function savePatient() {
  const editId = document.getElementById("patient-edit-id").value;
  const name = document.getElementById("patient-name").value.trim();
  if (!name) return toast("Insere o nome do paciente", "error");
  const current = getPatients().find(item => item.id === editId);
  const patient = {
    id: editId || uid(),
    name,
    dob: document.getElementById("patient-dob").value,
    phone: document.getElementById("patient-phone").value,
    email: document.getElementById("patient-email").value,
    address: document.getElementById("patient-address").value,
    diagnosis: document.getElementById("patient-diagnosis").value,
    price: parseFloat(document.getElementById("patient-price").value) || 0,
    notes: document.getElementById("patient-notes").value,
    createdAt: current?.createdAt || Date.now()
  };

  try {
    await state.store.savePatient(patient);
    closeModal("modal-patient");
    showPage("patients");
    toast(editId ? "Paciente atualizado" : "Paciente criado");
  } catch (error) {
    console.error(error);
    toast("Não foi possível guardar o paciente", "error");
  }
}

export function editPatientFromDetail() {
  const patient = getPatients().find(item => item.id === state.currentDetailPatientId);
  if (!patient) return;
  closeModal("modal-patient-detail");
  document.getElementById("patient-edit-id").value = patient.id;
  document.getElementById("patient-modal-title").textContent = "Editar paciente";
  document.getElementById("patient-name").value = patient.name;
  document.getElementById("patient-dob").value = patient.dob || "";
  document.getElementById("patient-phone").value = patient.phone || "";
  document.getElementById("patient-email").value = patient.email || "";
  document.getElementById("patient-address").value = patient.address || "";
  document.getElementById("patient-diagnosis").value = patient.diagnosis || "";
  document.getElementById("patient-price").value = patient.price || "";
  document.getElementById("patient-notes").value = patient.notes || "";
  document.getElementById("modal-patient").classList.add("open");
}

export function newApptForPatient(openAppointmentModal) {
  closeModal("modal-patient-detail");
  openAppointmentModal("modal-appointment");
  document.getElementById("appt-patient").value = state.currentDetailPatientId || "";
}
