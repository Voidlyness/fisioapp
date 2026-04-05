import { firebaseRefs, state } from "./state.js";
import { createFirestoreStore, createLocalStore, initDemoData, isFirebaseConfigured, refreshData } from "./store.js";
import { enterApp, toast } from "./ui.js";

function getFirebaseLoginErrorMessage(error) {
  const code = error?.code || "unknown";
  const messages = {
    "auth/invalid-email": "O email não é válido.",
    "auth/missing-password": "Falta indicar a palavra-passe.",
    "auth/user-not-found": "Este utilizador não existe no Firebase Authentication.",
    "auth/wrong-password": "A palavra-passe está incorreta.",
    "auth/invalid-credential": "Credenciais inválidas. Confirma o email e a palavra-passe.",
    "auth/invalid-login-credentials": "Credenciais inválidas. Confirma o email e a palavra-passe.",
    "auth/too-many-requests": "Muitas tentativas de login. Tenta novamente daqui a pouco.",
    "auth/network-request-failed": "Falha de rede ao tentar autenticar.",
    "auth/operation-not-allowed": "O login por Email/Password não está ativo no Firebase.",
    "auth/unauthorized-domain": "Este domínio não está autorizado no Firebase Authentication."
  };
  return messages[code] || `Erro Firebase: ${code}`;
}

export async function doLogin() {
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
    console.error("Firebase login error:", error?.code, error);
    errorEl.textContent = getFirebaseLoginErrorMessage(error);
    errorEl.style.display = "block";
  }
}

export async function demoLogin() {
  state.demoMode = true;
  state.currentUser = { uid: "demo-user", displayName: "Demo Fisioterapeuta", email: "demo@fisio.pt" };
  initDemoData();
  state.store = createLocalStore();
  await state.store.init();
  await refreshData();
  enterApp();
}

export async function doLogout() {
  if (!state.demoMode && state.auth) await state.auth.signOut();
  state.demoMode = false;
  state.currentUser = null;
  state.store = null;
  state.patients = [];
  state.appointments = [];
  document.getElementById("screen-app").classList.remove("active");
  document.getElementById("screen-login").classList.add("active");
}

export async function initFirebase(FIREBASE_CONFIG) {
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
