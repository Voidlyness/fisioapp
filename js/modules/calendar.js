import { state } from "../state.js";
import { getAppointments, getPatientName } from "../store.js";
import { escapeHtml, todayString } from "../utils.js";

export function renderCalendar() {
  const now = new Date();
  if (state.calendarYear === undefined) {
    state.calendarYear = now.getFullYear();
    state.calendarMonth = now.getMonth();
  }

  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  document.getElementById("cal-month-label").textContent = `${months[state.calendarMonth]} ${state.calendarYear}`;

  const first = new Date(state.calendarYear, state.calendarMonth, 1);
  const last = new Date(state.calendarYear, state.calendarMonth + 1, 0);
  const today = todayString();
  let html = "";
  const startDow = first.getDay();

  for (let index = 0; index < startDow; index += 1) {
    const date = new Date(state.calendarYear, state.calendarMonth, -startDow + index + 1);
    html += `<div class="cal-day other-month"><div class="cal-day-num">${date.getDate()}</div></div>`;
  }

  for (let day = 1; day <= last.getDate(); day += 1) {
    const dateString = `${state.calendarYear}-${String(state.calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayAppointments = getAppointments().filter(item => item.date === dateString).sort((a, b) => a.time.localeCompare(b.time));
    const events = dayAppointments.map(item => {
      const firstName = getPatientName(item.patientId).split(" ")[0] || "?";
      const cssClass = item.status === "cancelled" ? "cancelled" : item.payment?.paid === false && item.status === "done" ? "pending" : "";
      return `<div class="cal-event ${cssClass}" onclick="editAppointment('${item.id}')">${escapeHtml(item.time)} ${escapeHtml(firstName)}</div>`;
    }).join("");

    html += `<div class="cal-day${dateString === today ? " today" : ""}" onclick="calDayClick('${dateString}')"><div class="cal-day-num">${day}</div>${events}</div>`;
  }

  const totalCells = startDow + last.getDate();
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let index = 1; index <= remaining; index += 1) {
    html += `<div class="cal-day other-month"><div class="cal-day-num">${index}</div></div>`;
  }

  document.getElementById("cal-days").innerHTML = html;
}

export function calNav(dir) {
  state.calendarMonth += dir;
  if (state.calendarMonth > 11) { state.calendarMonth = 0; state.calendarYear += 1; }
  if (state.calendarMonth < 0) { state.calendarMonth = 11; state.calendarYear -= 1; }
  renderCalendar();
}

export function calDayClick(dateString, openModal) {
  openModal("modal-appointment");
  document.getElementById("appt-date").value = dateString;
}
