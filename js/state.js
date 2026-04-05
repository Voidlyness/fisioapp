export const FIREBASE_CONFIG = window.FISIO_FIREBASE_CONFIG || {};

export const state = {
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

export const firebaseRefs = {
  firestore: null
};
