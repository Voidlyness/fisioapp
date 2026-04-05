const FIREBASE_CONFIG = window.FISIO_FIREBASE_CONFIG || {};
const STORAGE_PREFIX = "fisio_";

const state = {
  demoMode: false,
  currentUser: null,
  db: null,
  auth: null,
  store: null,
  patients: [],
  appointments: [],
  currentDetailPatientId: null,
  calendarYear: undefined,
  calendarMonth: undefined,
  currentPatientFilter: "",
  currentAppointmentFilter: "all"
};

const firebaseRefs = {
  firestore: null
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeText(value, fallback = "–") {
  const normalized = String(value ?? "").trim();
  return normalized ? escapeHtml(normalized) : fallback;
}

function fmtDate(value) {
  if (!value) return "–";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function euro(value) {
  return `${Number(value || 0).toFixed(0)}€`;
}

function ls(key, value) {
  if (value === undefined) {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_PREFIX + key) || "null");
    } catch {
      return null;
    }
  }

  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  return value;
}

function isFirebaseConfigured() {
  return Boolean(
    FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY" &&
    FIREBASE_CONFIG.projectId &&
    FIREBASE_CONFIG.appId
  );
}

function getPatients() {
  return state.patients;
}

function getAppointments() {
  return state.appointments;
}

function getPatientName(patientId) {
  return getPatients().find(item => item.id === patientId)?.name || "Paciente";
}

function createLocalStore() {
  return {
    async init() {
      state.patients = ls("patients") || [];
      state.appointments = ls("appointments") || [];
    },
    async loadAll() {
      state.patients = ls("patients") || [];
      state.appointments = ls("appointments") || [];
    },
    async savePatient(patient) {
      const items = [...state.patients];
      const index = items.findIndex(item => item.id === patient.id);
      if (index >= 0) items[index] = patient;
      else items.push(patient);
      ls("patients", items);
      state.patients = items;
    },
    async saveAppointment(appointment) {
      const items = [...state.appointments];
      const index = items.findIndex(item => item.id === appointment.id);
      if (index >= 0) items[index] = appointment;
      else items.push(appointment);
      ls("appointments", items);
      state.appointments = items;
    }
  };
}

async function createFirestoreStore() {
  const { collection, doc, getDocs, setDoc } = firebaseRefs.firestore;

  function scopedCollection(name) {
    return collection(state.db, "users", state.currentUser.uid, name);
  }

  async function loadCollection(name) {
    const snapshot = await getDocs(scopedCollection(name));
    return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
  }

  return {
    async init() {
      state.patients = [];
      state.appointments = [];
    },
    async loadAll() {
      const [patients, appointments] = await Promise.all([
        loadCollection("patients"),
        loadCollection("appointments")
      ]);
      state.patients = patients;
      state.appointments = appointments;
    },
    async savePatient(patient) {
      await setDoc(doc(scopedCollection("patients"), patient.id), patient);
      const items = [...state.patients];
      const index = items.findIndex(item => item.id === patient.id);
      if (index >= 0) items[index] = patient;
      else items.push(patient);
      state.patients = items;
    },
    async saveAppointment(appointment) {
      await setDoc(doc(scopedCollection("appointments"), appointment.id), appointment);
      const items = [...state.appointments];
      const index = items.findIndex(item => item.id === appointment.id);
      if (index >= 0) items[index] = appointment;
      else items.push(appointment);
      state.appointments = items;
    }
  };
}

function initDemoData() {
  if (ls("patients")) return;

  const now = new Date();
  const fmt = date => date.toISOString().split("T")[0];
  const makeDate = (offset, hour = 10, minute = 0) => {
    const date = new Date(now);
    date.setDate(date.getDate() + offset);
    date.setHours(hour, minute, 0, 0);
    return {
      date: fmt(date),
      time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
    };
  };

  ls("patients", [
    { id: "p1", name: "Maria Silva", dob: "1954-02-10", phone: "912345678", email: "", address: "Rua das Flores 14, Loulé", diagnosis: "Gonartrose", price: 40, notes: "Dor no joelho direito. Boa adesão aos exercícios.", createdAt: Date.now() - 2000000 },
    { id: "p2", name: "José Fernandes", dob: "1968-06-03", phone: "913456789", email: "", address: "Av. da República 77, Faro", diagnosis: "Tendinopatia do ombro", price: 45, notes: "Limitação acima dos 90 graus.", createdAt: Date.now() - 1800000 },
    { id: "p3", name: "Ana Costa", dob: "1980-11-21", phone: "914567890", email: "", address: "Rua do Sol 5, Almancil", diagnosis: "Lombalgia crónica", price: 38, notes: "Episódios recorrentes.", createdAt: Date.now() - 1600000 },
    { id: "p4", name: "Helena Martins", dob: "1949-08-14", phone: "915678901", email: "", address: "Quinta do Lago, Almancil", diagnosis: "Pós-operatório anca", price: 50, notes: "Marcha assistida.", createdAt: Date.now() - 1400000 }
  ]);

  ls("appointments", [
    { id: "a1", patientId: "p1", ...makeDate(-14, 10), address: "Rua das Flores 14, Loulé", price: 40, duration: 60, notes: "Exercícios de fortalecimento do quadricípite.", status: "done", payment: { paid: true, method: "dinheiro", amount: 40, date: fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14)) }, createdAt: Date.now() - 1000000 },
    { id: "a2", patientId: "p2", ...makeDate(-10, 9), address: "Av. da República 77, Faro", price: 45, duration: 60, notes: "Trabalho de mobilidade do ombro esquerdo.", status: "done", payment: { paid: true, method: "mb_way", amount: 45, date: fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10)) }, createdAt: Date.now() - 900000 },
    { id: "a3", patientId: "p3", ...makeDate(-7, 11), address: "Rua do Sol 5, Almancil", price: 38, duration: 45, notes: "Mobilização lombar. Evolução positiva.", status: "done", payment: { paid: false }, createdAt: Date.now() - 800000 },
    { id: "a4", patientId: "p1", ...makeDate(-3, 10), address: "Rua das Flores 14, Loulé", price: 40, duration: 60, notes: "Aumentar carga nos exercícios.", status: "done", payment: { paid: false }, createdAt: Date.now() - 700000 },
    { id: "a5", patientId: "p4", ...makeDate(0, 9, 30), address: "Quinta do Lago, Almancil", price: 50, duration: 60, notes: "", status: "scheduled", payment: { paid: false }, createdAt: Date.now() - 600000 },
    { id: "a6", patientId: "p2", ...makeDate(0, 14), address: "Av. da República 77, Faro", price: 45, duration: 60, notes: "", status: "scheduled", payment: { paid: false }, createdAt: Date.now() - 500000 },
    { id: "a7", patientId: "p3", ...makeDate(2, 11), address: "Rua do Sol 5, Almancil", price: 38, duration: 45, notes: "", status: "scheduled", payment: { paid: false }, createdAt: Date.now() - 400000 },
    { id: "a8", patientId: "p1", ...makeDate(4, 10), address: "Rua das Flores 14, Loulé", price: 40, duration: 60, notes: "", status: "scheduled", payment: { paid: false }, createdAt: Date.now() - 300000 },
    { id: "a9", patientId: "p4", ...makeDate(7, 9, 30), address: "Quinta do Lago, Almancil", price: 50, duration: 60, notes: "", status: "scheduled", payment: { paid: false }, createdAt: Date.now() - 200000 }
  ]);
}

async function refreshData() {
  if (!state.store) return;
  await state.store.loadAll();
}

function toast(message, type = "success") {
  const icons = { success: "✓", error: "✕", info: "ℹ" };
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type] || ""}</span><span>${escapeHtml(message)}</span>`;
  document.getElementById("toast-container").appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function populatePatientSelect(selectedId = "") {
  const select = document.getElementById("appt-patient");
  select.innerHTML = `<option value="">Selecionar paciente...</option>${getPatients().map(patient => `<option value="${patient.id}" ${patient.id === selectedId ? "selected" : ""}>${escapeHtml(patient.name)}</option>`).join("")}`;
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-overlay").classList.remove("open");
}

function showPage(page) {
  document.querySelectorAll(".page").forEach(item => item.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
  document.getElementById(`page-${page}`).classList.add("active");

  const pages = ["dashboard", "calendar", "patients", "appointments", "payments"];
  const index = pages.indexOf(page);
  if (index >= 0) document.querySelectorAll(".nav-item")[index].classList.add("active");

  if (page === "dashboard") renderDashboard();
  if (page === "calendar") renderCalendar();
  if (page === "patients") renderPatients(state.currentPatientFilter);
  if (page === "appointments") renderAppointments(state.currentAppointmentFilter);
  if (page === "payments") renderPayments();

  closeSidebar();
}

function openModal(id) {
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
    populatePatientSelect();
  }

  if (id === "modal-patient") {
    document.getElementById("patient-edit-id").value = "";
    document.getElementById("patient-modal-title").textContent = "Novo paciente";
    ["patient-name", "patient-dob", "patient-phone", "patient-email", "patient-address", "patient-diagnosis", "patient-price", "patient-notes"]
      .forEach(field => { document.getElementById(field).value = ""; });
  }

  document.getElementById(id).classList.add("open");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

function renderDashboard() {
  const now = new Date();
  const today = todayString();
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

function renderCalendar() {
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

function renderPatients(filter = "") {
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

function renderAppointments(filter = "all") {
  state.currentAppointmentFilter = filter;
  let appts = [...getAppointments()].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  if (filter !== "all") appts = appts.filter(item => item.status === filter);

  const statusMap = {
    scheduled: ["badge-blue", "Agendada"],
    done: ["badge-green", "Realizada"],
    cancelled: ["badge-red", "Cancelada"]
  };

  const tbody = document.getElementById("appointments-body");
  if (!appts.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">Sem consultas</td></tr>`;
    return;
  }

  tbody.innerHTML = appts.map(item => {
    const name = getPatientName(item.patientId);
    const initials = name.split(" ").map(word => word[0]).join("").slice(0, 2).toUpperCase();
    const [statusClass, statusLabel] = statusMap[item.status] || ["badge-gray", item.status];

    return `
      <tr>
        <td>
          <div class="table-person">
            <div class="patient-avatar table-avatar">${escapeHtml(initials)}</div>
            <span class="patient-link" onclick="openPatientDetail('${item.patientId}')">${escapeHtml(name)}</span>
          </div>
        </td>
        <td>${fmtDate(item.date)}</td>
        <td>${escapeHtml(item.time)}</td>
        <td class="truncate-cell">${safeText(item.address)}</td>
        <td><span class="badge ${statusClass}">${escapeHtml(statusLabel)}</span></td>
        <td>${item.payment?.paid
          ? `<span class="badge badge-green">${safeText(item.payment.method, "Pago")}</span>`
          : item.status === "done"
            ? `<button class="btn btn-ghost" style="padding:4px 10px;font-size:11px" onclick="openPaymentModal('${item.id}')">Registar</button>`
            : `<span class="badge badge-gray">–</span>`}</td>
        <td><button class="btn btn-ghost" style="padding:4px 10px;font-size:11px" onclick="editAppointment('${item.id}')">Editar</button></td>
      </tr>
    `;
  }).join("");
}

function renderPayments() {
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
  document.getElementById("payments-pending-list").innerHTML = !pending.length
    ? `<div class="empty" style="padding:24px 0"><p>Sem pagamentos pendentes</p></div>`
    : pending.map(item => `
      <div class="pay-row">
        <div class="pay-info">
          <div class="pay-patient">${escapeHtml(getPatientName(item.patientId))}</div>
          <div class="pay-date">Sessão ${fmtDate(item.date)} · ${escapeHtml(item.time)}</div>
        </div>
        <div class="pay-amount">${euro(item.price)}</div>
        <div class="pay-actions">
          <button class="btn btn-primary" style="font-size:12px;padding:6px 12px" onclick="openPaymentModal('${item.id}')">Registar pagamento</button>
        </div>
      </div>
    `).join("");

  document.getElementById("payments-history-list").innerHTML = !paid.length
    ? `<div class="empty" style="padding:24px 0"><p>Sem pagamentos registados</p></div>`
    : paid.map(item => `
      <div class="pay-row">
        <div class="pay-info">
          <div class="pay-patient">${escapeHtml(getPatientName(item.patientId))}</div>
          <div class="pay-date">${fmtDate(item.payment?.date || item.date)} · ${icons[item.payment?.method] || ""} ${safeText(item.payment?.method?.replace("_", " "), "Pago")}</div>
        </div>
        <div class="pay-amount" style="color:var(--accent)">${euro(item.payment?.amount || item.price)}</div>
        <span class="badge badge-green">Pago</span>
      </div>
    `).join("");
}

function openPatientDetail(patientId) {
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

  if (!appts.length) {
    html += `<div class="empty"><p>Sem consultas registadas</p></div>`;
  } else {
    html += appts.slice(0, 6).map(item => {
      const statusMap = { scheduled: ["badge-blue", "Agendada"], done: ["badge-green", "Realizada"], cancelled: ["badge-red", "Cancelada"] };
      const [statusClass, statusLabel] = statusMap[item.status] || ["badge-gray", item.status];
      return `
        <div class="pay-row">
          <div class="pay-info">
            <div class="pay-patient">${fmtDate(item.date)} às ${escapeHtml(item.time)}</div>
            <div class="pay-date">${safeText(item.address)} · ${Number(item.duration || 60)}min</div>
          </div>
          <span class="badge ${statusClass}">${escapeHtml(statusLabel)}</span>
          <div class="pay-amount">${euro(item.price)}</div>
          <span class="badge ${item.payment?.paid ? "badge-green" : "badge-amber"}">${item.payment?.paid ? "Pago" : "Pendente"}</span>
        </div>
      `;
    }).join("");
  }

  document.getElementById("patient-detail-content").innerHTML = html;
  openModal("modal-patient-detail");
}

async function savePatient() {
  const editId = document.getElementById("patient-edit-id").value;
  const name = document.getElementById("patient-name").value.trim();
  if (!name) {
    toast("Insere o nome do paciente", "error");
    return;
  }

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

async function saveAppointment() {
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

async function savePayment() {
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

function editAppointment(apptId) {
  const appointment = getAppointments().find(item => item.id === apptId);
  if (!appointment) return;
  document.getElementById("appt-edit-id").value = appointment.id;
  document.getElementById("appt-modal-title").textContent = "Editar consulta";
  populatePatientSelect(appointment.patientId);
  document.getElementById("appt-date").value = appointment.date;
  document.getElementById("appt-time").value = appointment.time;
  document.getElementById("appt-address").value = appointment.address || "";
  document.getElementById("appt-price").value = appointment.price || "";
  document.getElementById("appt-duration").value = appointment.duration || 60;
  document.getElementById("appt-notes").value = appointment.notes || "";
  document.getElementById("appt-status").value = appointment.status;
  document.getElementById("modal-appointment").classList.add("open");
}

function editPatientFromDetail() {
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

function newApptForPatient() {
  closeModal("modal-patient-detail");
  openModal("modal-appointment");
  document.getElementById("appt-patient").value = state.currentDetailPatientId || "";
}

function openPaymentModal(apptId) {
  const appointment = getAppointments().find(item => item.id === apptId);
  if (!appointment) return;
  document.getElementById("pay-appt-id").value = apptId;
  document.getElementById("pay-amount").value = appointment.price || "";
  document.getElementById("pay-date").value = todayString();
  document.getElementById("pay-notes").value = "";
  document.getElementById("pay-method").value = "mb_way";
  document.getElementById("modal-payment").classList.add("open");
}

function calNav(dir) {
  state.calendarMonth += dir;
  if (state.calendarMonth > 11) { state.calendarMonth = 0; state.calendarYear += 1; }
  if (state.calendarMonth < 0) { state.calendarMonth = 11; state.calendarYear -= 1; }
  renderCalendar();
}

function calDayClick(dateString) {
  openModal("modal-appointment");
  document.getElementById("appt-date").value = dateString;
}

function enterApp() {
  document.getElementById("screen-login").classList.remove("active");
  document.getElementById("screen-app").classList.add("active");
  document.getElementById("sidebar-username").textContent = state.currentUser?.displayName || state.currentUser?.email?.split("@")[0] || "Fisioterapeuta";
  showPage("dashboard");
}

async function doLogin() {
  const email = document.getElementById("login-email").value.trim();
  const pass = document.getElementById("login-pass").value;
  const errorEl = document.getElementById("login-error");
  errorEl.style.display = "none";

  if (!state.auth) {
    errorEl.textContent = "Firebase não configurado. Usa o modo demo.";
    errorEl.style.display = "block";
    return;
  }

  try {
    const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
    await signInWithEmailAndPassword(state.auth, email, pass);
  } catch (error) {
    console.error(error);
    errorEl.textContent = "Email ou palavra-passe incorretos.";
    errorEl.style.display = "block";
  }
}

async function demoLogin() {
  state.demoMode = true;
  state.currentUser = { uid: "demo-user", displayName: "Demo Fisioterapeuta", email: "demo@fisio.pt" };
  initDemoData();
  state.store = createLocalStore();
  await state.store.init();
  await refreshData();
  enterApp();
}

async function doLogout() {
  if (!state.demoMode && state.auth) await state.auth.signOut();
  state.demoMode = false;
  state.currentUser = null;
  state.store = null;
  state.patients = [];
  state.appointments = [];
  document.getElementById("screen-app").classList.remove("active");
  document.getElementById("screen-login").classList.add("active");
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("sidebar-overlay").classList.toggle("open");
}

async function initFirebase() {
  if (!isFirebaseConfigured()) return;

  try {
    const [{ initializeApp }, firestoreModule, authModule] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js")
    ]);

    firebaseRefs.firestore = firestoreModule;
    const app = initializeApp(FIREBASE_CONFIG);
    state.db = firestoreModule.getFirestore(app);
    state.auth = authModule.getAuth(app);

    authModule.onAuthStateChanged(state.auth, async user => {
      if (!user) return;
      state.demoMode = false;
      state.currentUser = user;
      state.store = await createFirestoreStore();
      await state.store.init();
      await refreshData();
      enterApp();
    });
  } catch (error) {
    console.error("Firebase init failed", error);
    toast("Firebase indisponível. Podes usar o modo demo.", "info");
  }
}

window.doLogin = doLogin;
window.demoLogin = demoLogin;
window.doLogout = doLogout;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.showPage = showPage;
window.openModal = openModal;
window.closeModal = closeModal;
window.saveAppointment = saveAppointment;
window.savePatient = savePatient;
window.savePayment = savePayment;
window.filterPatients = renderPatients;
window.filterAppointments = renderAppointments;
window.openPatientDetail = openPatientDetail;
window.editPatientFromDetail = editPatientFromDetail;
window.newApptForPatient = newApptForPatient;
window.openPaymentModal = openPaymentModal;
window.editAppointment = editAppointment;
window.calNav = calNav;
window.calDayClick = calDayClick;

document.addEventListener("DOMContentLoaded", () => {
  const upcoming = document.getElementById("dash-upcoming");
  if (upcoming) {
    upcoming.innerHTML = `<div class="empty" style="padding:24px 0"><p>À espera de login ou modo demo</p></div>`;
  }
});

initFirebase();
