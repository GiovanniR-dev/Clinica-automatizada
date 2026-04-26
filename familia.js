import { auth, db } from "./firebase.js";
import {
  doc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/**
 * Abre o modal de dependente e salva no Firestore.
 * Chamada pelo botão "Adicionar Dependente" no dashboard.
 */
window.adicionarDependente = async function () {
  // Verifica autenticação antes de qualquer operação
  if (!auth.currentUser) {
    exibirNotificacao("Você precisa estar logado para adicionar dependentes.", "erro");
    return;
  }

  // Exibe modal embutido em vez de usar prompt() bloqueante
  const modal = document.getElementById("modal-dependente");
  if (modal) {
    modal.style.display = "flex";
    return;
  }

  // Fallback: se não houver modal no HTML, usa inputs inline criados dinamicamente
  criarModalDependente();
};

/**
 * Salva o dependente — chamada pelo botão "Confirmar" dentro do modal.
 */
window.confirmarDependente = async function () {
  const nomeInput  = document.getElementById("dep-nome");
  const idadeInput = document.getElementById("dep-idade");

  const nome  = nomeInput?.value.trim();
  const idade = parseInt(idadeInput?.value);

  if (!nome) {
    exibirNotificacao("Informe o nome do dependente.", "erro");
    return;
  }

  if (isNaN(idade) || idade < 0 || idade > 120) {
    exibirNotificacao("Informe uma idade válida.", "erro");
    return;
  }

  try {
    const uid = auth.currentUser.uid;
    const ref = doc(db, "usuarios", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      exibirNotificacao("Dados do usuário não encontrados.", "erro");
      return;
    }

    const dados = snap.data();

    // Garante que o array familia sempre existe
    const familia = Array.isArray(dados.familia) ? dados.familia : [];
    familia.push({ nome, idade });

    await updateDoc(ref, { familia });

    // Limpa e fecha o modal
    if (nomeInput)  nomeInput.value  = "";
    if (idadeInput) idadeInput.value = "";
    fecharModalDependente();

    exibirNotificacao(`✅ ${nome} adicionado(a) como dependente!`, "ok");

  } catch (erro) {
    console.error("Erro ao adicionar dependente:", erro);
    exibirNotificacao("Erro ao salvar. Tente novamente.", "erro");
  }
};

window.fecharModalDependente = function () {
  const modal = document.getElementById("modal-dependente");
  if (modal) modal.style.display = "none";
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function exibirNotificacao(msg, tipo) {
  const el = document.getElementById("notificacao");
  if (!el) { console.log(msg); return; }
  el.textContent = msg;
  el.className   = "notificacao " + tipo;
  el.style.display = "block";
  setTimeout(() => { el.style.display = "none"; }, 3500);
}

function criarModalDependente() {
  const overlay = document.createElement("div");
  overlay.id = "modal-dependente";
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;
    align-items:center;justify-content:center;z-index:999;
  `;
  overlay.innerHTML = `
    <div class="card" style="width:320px">
      <h2 style="margin-bottom:16px">Adicionar Dependente</h2>
      <input id="dep-nome"  placeholder="Nome completo">
      <input id="dep-idade" placeholder="Idade" type="number" min="0" max="120">
      <button onclick="confirmarDependente()" style="margin-bottom:8px">Confirmar</button>
      <button onclick="fecharModalDependente()" style="background:rgba(255,255,255,.1)">Cancelar</button>
    </div>
  `;
  document.body.appendChild(overlay);
}