import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ─── Cadastro ────────────────────────────────────────────────────────────────
window.cadastrar = async function () {
  const nomeInput  = document.getElementById("nome");
  const emailInput = document.getElementById("email");
  const senhaInput = document.getElementById("senha");
  const idadeInput = document.getElementById("idade");
  const msgEl      = document.getElementById("msg-cadastro");

  const nome  = nomeInput.value.trim();
  const email = emailInput.value.trim();
  const senha = senhaInput.value;
  const idade = parseInt(idadeInput.value);

  // Validações básicas
  if (!nome || !email || !senha || isNaN(idade)) {
    mostrarMsg(msgEl, "Preencha todos os campos.", "erro");
    return;
  }

  if (idade < 18) {
    mostrarMsg(msgEl, "Apenas maiores de 18 anos podem se cadastrar.", "erro");
    return;
  }

  if (senha.length < 6) {
    mostrarMsg(msgEl, "A senha deve ter pelo menos 6 caracteres.", "erro");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);

    await setDoc(doc(db, "usuarios", userCredential.user.uid), {
      nome,
      email,
      idade,
      familia: []
    });

    // Limpa campos após cadastro
    nomeInput.value = emailInput.value = senhaInput.value = idadeInput.value = "";
    mostrarMsg(msgEl, "Cadastro realizado! Redirecionando...", "ok");

    setTimeout(() => { window.location.href = "dashboard.html"; }, 1200);

  } catch (erro) {
    mostrarMsg(msgEl, traduzirErroFirebase(erro.code), "erro");
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
window.login = async function () {
  // Corrigido: usar getElementById em vez de variáveis globais inexistentes
  const emailInput = document.getElementById("loginEmail");
  const senhaInput = document.getElementById("loginSenha");
  const msgEl      = document.getElementById("msg-login");

  const email = emailInput.value.trim();
  const senha = senhaInput.value;

  if (!email || !senha) {
    mostrarMsg(msgEl, "Preencha e-mail e senha.", "erro");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, senha);

    // Limpa campos antes de redirecionar
    emailInput.value = senhaInput.value = "";
    window.location.href = "dashboard.html";

  } catch (erro) {
    mostrarMsg(msgEl, traduzirErroFirebase(erro.code), "erro");
  }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function mostrarMsg(el, texto, tipo) {
  if (!el) return;
  el.textContent = texto;
  el.className   = "msg " + tipo;
}

function traduzirErroFirebase(code) {
  const erros = {
    "auth/email-already-in-use":    "Este e-mail já está cadastrado.",
    "auth/invalid-email":           "E-mail inválido.",
    "auth/weak-password":           "Senha muito fraca (mínimo 6 caracteres).",
    "auth/user-not-found":          "Usuário não encontrado.",
    "auth/wrong-password":          "Senha incorreta.",
    "auth/too-many-requests":       "Muitas tentativas. Tente novamente mais tarde.",
    "auth/invalid-credential":      "Credenciais inválidas. Verifique e-mail e senha."
  };
  return erros[code] || "Ocorreu um erro. Tente novamente.";
}