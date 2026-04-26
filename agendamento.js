import { db } from "./firebase.js";
import {
  collection, query, where, getDocs, addDoc, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { API_BASE_URL } from "./config.js";

/**
 * Processa um agendamento vindo da IA.
 * @param {Object} dados        - { paciente, exame, data (YYYY-MM-DD), hora (HH:MM) }
 * @param {Function} addChat    - função para exibir mensagem no chat
 */
export async function processarAgendamento(dados, addChat) {
  const { paciente, exame, data, hora } = dados;

  // Validação básica dos campos obrigatórios
  if (!paciente || !exame || !data || !hora) {
    addChat("⚠️ Não consegui identificar todos os dados do agendamento. Por favor, informe paciente, exame, data e hora.", "bot");
    return;
  }

  // Validação de formato de data e hora
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !/^\d{2}:\d{2}$/.test(hora)) {
    addChat("⚠️ Formato de data ou hora inválido. Use DD/MM/AAAA e HH:MM.", "bot");
    return;
  }

  try {
    // ── Verifica disponibilidade real no Firestore ───────────────────────────
    const q = query(
      collection(db, "agendamentos"),
      where("data", "==", data),
      where("hora", "==", hora)
    );

    const resultado = await getDocs(q);

    if (!resultado.empty) {
      addChat(`⚠️ O horário ${hora} do dia ${formatarData(data)} já está ocupado. Deseja escolher outro horário?`, "bot");
      return;
    }

    // ── Salva o agendamento ──────────────────────────────────────────────────
    await addDoc(collection(db, "agendamentos"), {
      paciente,
      exame,
      data,
      hora,
      criadoEm: Timestamp.now()
    });

    addChat(`✅ Agendamento confirmado!\n📋 ${exame}\n👤 ${paciente}\n📅 ${formatarData(data)} às ${hora}`, "bot");

    // ── Envia e-mail de confirmação via backend proxy ────────────────────────
    try {
      await fetch(`${API_BASE_URL}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paciente, exame, data: formatarData(data), hora })
      });
    } catch (erroEmail) {
      // Falha de e-mail não cancela o agendamento — apenas loga
      console.warn("Falha ao enviar e-mail de confirmação:", erroEmail);
    }

  } catch (erro) {
    console.error("Erro ao processar agendamento:", erro);
    addChat("❌ Ocorreu um erro ao realizar o agendamento. Tente novamente.", "bot");
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatarData(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}