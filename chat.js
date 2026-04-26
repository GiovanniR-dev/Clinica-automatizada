import { auth, db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { API_BASE_URL } from "./config.js";
import { processarAgendamento } from "./agendamento.js";

// Histórico de mensagens mantido em memória para dar contexto à IA
const historico = [];

async function getUsuario() {
  const uid  = auth.currentUser?.uid;
  if (!uid) throw new Error("Usuário não autenticado.");
  const snap = await getDoc(doc(db, "usuarios", uid));
  if (!snap.exists()) throw new Error("Dados do usuário não encontrados.");
  return snap.data();
}

window.enviarMensagem = async function () {
  const input = document.getElementById("msg");
  const msg   = input.value.trim();
  if (!msg) return;

  // Desabilita envio durante processamento
  input.disabled = true;
  document.querySelector(".input-area button").disabled = true;

  adicionarChat(msg, "user");
  input.value = "";

  const loading = adicionarLoading();

  try {
    const usuario = await getUsuario();

    const contexto = `
Você é um atendente virtual de clínica médica. Seja cordial e objetivo.

Paciente: ${usuario.nome}
Idade: ${usuario.idade}
Dependentes: ${(usuario.familia || []).map(f => f.nome).join(", ") || "nenhum"}

Regras:
- Nunca invente horários ou datas disponíveis.
- Sempre confirme os dados com o paciente antes de agendar.
- Quando o paciente confirmar o agendamento com todos os dados (nome, exame, data, hora),
  responda SOMENTE com o JSON abaixo, sem nenhum texto antes ou depois:

{"acao":"agendar","paciente":"","exame":"","data":"YYYY-MM-DD","hora":"HH:MM"}
`.trim();

    // Adiciona mensagem do usuário ao histórico antes de enviar
    historico.push({ role: "user", content: msg });

    // Chama o proxy backend (nunca a API diretamente do frontend)
    const resposta = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system: contexto,
        messages: historico
      })
    });

    if (!resposta.ok) throw new Error(`Erro ${resposta.status} na API.`);

    const data  = await resposta.json();
    const texto = data.content || "Não entendi. Pode repetir?";

    // Adiciona resposta da IA ao histórico
    historico.push({ role: "assistant", content: texto });

    loading.remove();
    adicionarChat(texto, "bot");

    // Tenta extrair JSON mesmo que venha com texto ao redor
    const jsonMatch = texto.match(/\{[\s\S]*"acao"\s*:\s*"agendar"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const json = JSON.parse(jsonMatch[0]);
        if (json.acao === "agendar") {
          await processarAgendamento(json, adicionarChat);
        }
      } catch {
        // JSON malformado — ignora silenciosamente
      }
    }

  } catch (erro) {
    loading.remove();
    adicionarChat("❌ Erro ao processar sua mensagem. Tente novamente.", "bot");
    console.error(erro);
  } finally {
    input.disabled = false;
    document.querySelector(".input-area button").disabled = false;
    input.focus();
  }
};

// ─── UI Helpers ──────────────────────────────────────────────────────────────
function adicionarChat(texto, tipo) {
  const chat = document.getElementById("chat");
  const div  = document.createElement("div");
  div.classList.add("message", tipo);
  div.innerText = texto;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

function adicionarLoading() {
  return adicionarChat("Digitando...", "bot");
}