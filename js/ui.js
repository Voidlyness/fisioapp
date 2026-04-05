import { state } from "./state.js";
import { todayString, escapeHtml } from "./utils.js";

const renderers = {};

export function registerRenderers(items) {
  Object.assign(renderers, items);
}

export function toast(message, type = "success") {
  const icons = { success: "✓", error: "✕", info: "ℹ" };
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type] || ""}</span><span>${escapeHtml(message)}</span>`;
  document.getElementById("toast-container").appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

export function populatePatientSelect(patients, selectedId = "") {
  const select = document.getElementById("appt-patient");
  select.innerHTML = `<option value="">Selecionar paciente...</option>${patients.map(patient => `<option value="${patient.id}" ${patient.id === selectedId ? "selected" : ""}>${escapeHtml(patient.name)}</option>`).join("")}`;
}

export function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-overlay").classList.remove("open");
}

export function showPage(page) {
  document.querySelectorAll(".page").forEach(item => item.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
  document.getElementById(`page-${page}`).classList.add("active");

  const pages = ["dashboard", "calendar", "patients", "appointments", "payments"];
  const index = pages.indexOf(page);
  if (index >= 0) document.querySelectorAll(".nav-item")[index].classList.add("active");

  if (page === "dashboard") renderers.renderDashboard?.();
  if (page === "calendar") renderers.renderCalendar?.();
  if (page === "patients") renderers.renderPatients?.(state.currentPatientFilter);
  if (page === "appointments") renderers.renderAppointments?.(state.currentAppointmentFilter);
  if (page === "payments") renderers.renderPayments?.();

  closeSidebar();
}

export function openModal(id, getPatients) {
  if (id === "modal-appointment") {
    document.getElementById("appt-edit-id").value = "";
    document.getElementById("appt-modal-title").textContent = "Nova consulta";
    document.getElementById("appt-date").value = todayString();
    document.getElementById("appt-time").value = "09:00";
    document.getElementById("appt-address").value = "";
    document.getElementById("appt-price").value = "";
    document.getElementById("appt-duration").value = "60";
    document.getElementById("appt-notes").value = "";
    document.getElementById("appt-status").value = "scheduled";
    populatePatientSelect(getPatients());
  }

  if (id === "modal-patient") {
    document.getElementById("patient-edit-id").value = "";
    document.getElementById("patient-modal-title").textContent = "Novo paciente";
    ["patient-name", "patient-dob", "patient-phone", "patient-email", "patient-address", "patient-diagnosis", "patient-price", "patient-notes"]
      .forEach(field => { document.getElementById(field).value = ""; });
  }

  document.getElementById(id).classList.add("open");
}

export function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

export function enterApp() {
  document.getElementById("screen-login").classList.remove("active");
  document.getElementById("screen-app").classList.add("active");
  document.getElementById("sidebar-username").textContent = state.currentUser?.displayName || state.currentUser?.email?.split("@")[0] || "Fisioterapeuta";
  showPage("dashboard");
}

export function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("sidebar-overlay").classList.toggle("open");
}
