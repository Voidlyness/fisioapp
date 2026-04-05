import { FIREBASE_CONFIG, firebaseRefs, state } from "./state.js";

const STORAGE_PREFIX = "fisio_";

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

export function isFirebaseConfigured() {
  return Boolean(
    FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY" &&
    FIREBASE_CONFIG.projectId &&
    FIREBASE_CONFIG.appId
  );
}

export function getPatients() {
  return state.patients;
}

export function getAppointments() {
  return state.appointments;
}

export function getPatientName(patientId) {
  return getPatients().find(item => item.id === patientId)?.name || "Paciente";
}

export function createLocalStore() {
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
    },
    async deletePatient(patientId) {
      const patients = state.patients.filter(item => item.id !== patientId);
      const appointments = state.appointments.filter(item => item.patientId !== patientId);
      ls("patients", patients);
      ls("appointments", appointments);
      state.patients = patients;
      state.appointments = appointments;
    }
  };
}

export async function createFirestoreStore() {
  const { collection, doc, getDocs, setDoc, deleteDoc } = firebaseRefs.firestore;

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
    },
    async deletePatient(patientId) {
      const relatedAppointments = state.appointments.filter(item => item.patientId === patientId);
      await Promise.all([
        deleteDoc(doc(scopedCollection("patients"), patientId)),
        ...relatedAppointments.map(item => deleteDoc(doc(scopedCollection("appointments"), item.id)))
      ]);
      state.patients = state.patients.filter(item => item.id !== patientId);
      state.appointments = state.appointments.filter(item => item.patientId !== patientId);
    }
  };
}

export function initDemoData() {
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

export async function refreshData() {
  if (!state.store) return;
  await state.store.loadAll();
}
