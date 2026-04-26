import { initializeApp, getApps, getApp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:        "AIzaSyAO7EWk7wx1dgX7aFNQzZGuq04U5CgxSW4",
  authDomain:    "clinica-661a4.firebaseapp.com",
  projectId:     "clinica-661a4",
  storageBucket: "clinica-661a4.appspot.com"
  // messagingSenderId e appId são opcionais para Auth + Firestore básico
};

// Evita dupla inicialização caso o módulo seja importado mais de uma vez
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db   = getFirestore(app);