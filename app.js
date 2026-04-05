import { FIREBASE_CONFIG } from "./js/state.js";
import { getPatients } from "./js/store.js";
import { doLogin, demoLogin, doLogout, initFirebase } from "./js/auth.js";
import { closeModal, closeSidebar, openModal, registerRenderers, showPage, toggleSidebar } from "./js/ui.js";
import { renderDashboard } from "./js/modules/dashboard.js";
import { calDayClick, calNav, renderCalendar } from "./js/modules/calendar.js";
import { deleteAppointment, editAppointment, renderAppointments, saveAppointment } from "./js/modules/appointments.js";
import { openPatientDetail, renderPatients, savePatient, editPatientFromDetail, newApptForPatient, deletePatientFromDetail } from "./js/modules/patients.js";
import { openPaymentModal, renderPayments, savePayment } from "./js/modules/payments.js";

registerRenderers({
  renderDashboard,
  renderCalendar,
  renderPatients,
  renderAppointments,
  renderPayments
});

window.doLogin = doLogin;
window.demoLogin = demoLogin;
window.doLogout = doLogout;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.showPage = showPage;
window.openModal = id => openModal(id, getPatients);
window.closeModal = closeModal;
window.saveAppointment = saveAppointment;
window.deleteAppointment = deleteAppointment;
window.savePatient = savePatient;
window.savePayment = savePayment;
window.filterPatients = renderPatients;
window.filterAppointments = renderAppointments;
window.openPatientDetail = openPatientDetail;
window.editPatientFromDetail = editPatientFromDetail;
window.newApptForPatient = () => newApptForPatient(window.openModal);
window.deletePatientFromDetail = deletePatientFromDetail;
window.openPaymentModal = openPaymentModal;
window.editAppointment = editAppointment;
window.calNav = calNav;
window.calDayClick = dateString => calDayClick(dateString, window.openModal);

document.addEventListener("DOMContentLoaded", () => {
  const upcoming = document.getElementById("dash-upcoming");
  if (upcoming) {
    upcoming.innerHTML = `<div class="empty" style="padding:24px 0"><p>À espera de login ou modo demo</p></div>`;
  }
});
initFirebase(FIREBASE_CONFIG);
