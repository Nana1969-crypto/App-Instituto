/* Lista de chamada: registro de presença por turma e data */
"use strict";

let chamadaAtual = { turmaId: "", data: U.hojeISO(), conteudo: "", presencas: {} };

Views.chamada = turmaIdParam => {
  const turmas = Store.col("turmas").filter(t => t.status === "em andamento" || t.status === "planejada");
  const todasTurmas = Store.col("turmas");

  if (turmaIdParam && chamadaAtual.turmaId !== turmaIdParam) {
    chamadaAtual = { turmaId: turmaIdParam, data: U.hojeISO(), conteudo: "", presencas: {} };
  }
  if (!chamadaAtual.turmaId && turmas.length) chamadaAtual.turmaId = turmas[0].id;

  const turmaSel = Store.get("turmas", chamadaAtual.turmaId);
  const curso = turmaSel ? Store.get("cursos", turmaSel.cursoId) : null;

  const opts = (turmas.length ? turmas : todasTurmas).map(t => {
    const c = Store.get("cursos", t.cursoId);
    return `<option value="${t.id}" ${t.id === chamadaAtual.turmaId ? "selected" : ""}>${U.esc((c ? c.nome : "?") + " — " + t.nome)}</option>`;
  }).join("");

  let listaAlunos = "";
  let historicoHTML = "";

  if (turmaSel) {
    const mats = Store.matriculasDaTurma(turmaSel.id).filter(m => m.status === "cursando" || m.status === "concluido");
    const alunos = U.ordenarPorNome(mats.map(m => Store.get("alunos", m.alunoId)).filter(Boolean));

    // chamada já registrada nesta data?
    const existente = Store.col("chamadas").find(c => c.turmaId === turmaSel.id && c.data === chamadaAtual.data);
    const presencas = existente ? existente.presencas : chamadaAtual.presencas;

    listaAlunos = alunos.length ? alunos.map(a => {
      const marcado = presencas[a.id];
      const p = Store.presencaAluno(turmaSel.id, a.id);
      return `
        <div class="chamada-aluno">
          <div style="display:flex; align-items:center; gap:10px; min-width:0;">
            <span class="avatar cor-${curso ? curso.corIndex : 8}">${U.iniciais(a.nome)}</span>
            <div>
              <div style="font-weight:600; font-size:0.9rem;">${U.esc(a.nome)}</div>
              <div style="font-size:0.74rem; color:var(--text-muted);">
                ${p.total ? `frequência: ${p.pct}% (${p.presentes}/${p.total})` : "sem registros ainda"}
              </div>
            </div>
          </div>
          <div class="presenca-toggle" data-aluno="${a.id}">
            <button type="button" class="tp ${marcado === true ? "sel-p" : ""}" data-v="1">Presente</button>
            <button type="button" class="tf ${marcado === false ? "sel-f" : ""}" data-v="0">Falta</button>
          </div>
        </div>`;
    }).join("") : `<div class="empty-note">Nenhum aluno matriculado nesta turma.<br>Matricule alunos pela ficha de cada aluno.</div>`;

    const historico = Store.col("chamadas")
      .filter(c => c.turmaId === turmaSel.id)
      .sort((a, b) => b.data.localeCompare(a.data));
    historicoHTML = historico.length ? `
      <div class="table-wrap"><table>
        <thead><tr><th>Data</th><th>Conteúdo</th><th>Presentes</th><th></th></tr></thead>
        <tbody>${historico.map(c => {
          const total = Object.keys(c.presencas).length;
          const pres = Object.values(c.presencas).filter(Boolean).length;
          return `<tr>
            <td>${U.fmtData(c.data)}</td>
            <td>${U.esc(c.conteudo || "—")}</td>
            <td><span class="pill ${pres / total >= 0.75 ? "ok" : "warn"}">${pres}/${total}</span></td>
            <td style="white-space:nowrap">
              <button class="btn sm ghost" data-action="abrirChamadaData" data-id="${c.data}">Editar</button>
              <button class="icon-btn" data-action="excluirChamada" data-id="${c.id}" title="Excluir" aria-label="Excluir chamada">&#128465;</button>
            </td>
          </tr>`;
        }).join("")}</tbody>
      </table></div>` : `<div class="empty-note">Nenhuma chamada registrada para esta turma.</div>`;
  }

  return `
    <div class="page-head">
      <div>
        <h2>Lista de chamada</h2>
        <p>Escolha a turma e a data, marque presença ou falta e salve. Cada data gera um registro no relatório de presença.</p>
      </div>
    </div>

    ${todasTurmas.length ? `
    <div class="panel">
      <div class="form-grid" style="align-items:end;">
        <div class="field">
          <label for="ch-turma">Turma</label>
          <select id="ch-turma">${opts}</select>
        </div>
        <div class="field">
          <label for="ch-data">Data da aula</label>
          <input id="ch-data" type="date" value="${U.esc(chamadaAtual.data)}">
        </div>
        <div class="field full">
          <label for="ch-cont">Conteúdo da aula (opcional)</label>
          <input id="ch-cont" placeholder="ex.: Módulo 3 — Planejamento de conteúdo" value="${U.esc(chamadaAtual.conteudo)}">
        </div>
      </div>
    </div>

    <div class="panel">
      <h3>${curso ? U.esc(curso.nome) + " — " + U.esc(turmaSel.nome) : "Alunos"}</h3>
      <p class="panel-sub">${U.fmtData(chamadaAtual.data)}${turmaSel && turmaSel.horario ? " · " + U.esc(turmaSel.horario) : ""}</p>
      <div id="ch-lista">${listaAlunos}</div>
      <div class="form-actions">
        <button class="btn accent" data-action="salvarChamada">Salvar chamada</button>
      </div>
    </div>

    <div class="panel">
      <h3>Chamadas anteriores desta turma</h3>
      <p class="panel-sub">Clique em Editar para corrigir uma chamada já feita</p>
      ${historicoHTML}
    </div>`
    : `<div class="panel"><div class="empty-note">Nenhuma turma cadastrada.<br>Crie uma turma primeiro, na aba <strong>Turmas</strong>.</div></div>`}
  `;
};

/* interações da tela de chamada (selects e toggles) */
const aposRenderAnterior = Views.aposRender;
Views.aposRender = (rota, param) => {
  if (aposRenderAnterior) aposRenderAnterior(rota, param);
  if (rota !== "chamada") return;

  const selTurma = document.getElementById("ch-turma");
  const inpData = document.getElementById("ch-data");
  const inpCont = document.getElementById("ch-cont");
  if (!selTurma) return;

  selTurma.addEventListener("change", () => {
    chamadaAtual = { turmaId: selTurma.value, data: inpData.value, conteudo: "", presencas: {} };
    location.hash = "#/chamada/" + selTurma.value;
    App.render();
  });
  inpData.addEventListener("change", () => {
    chamadaAtual.data = inpData.value;
    chamadaAtual.presencas = {};
    App.render();
  });
  if (inpCont) inpCont.addEventListener("input", () => { chamadaAtual.conteudo = inpCont.value; });

  document.querySelectorAll(".presenca-toggle").forEach(tg => {
    const alunoId = tg.dataset.aluno;
    tg.querySelectorAll("button").forEach(b => {
      b.addEventListener("click", () => {
        const v = b.dataset.v === "1";
        chamadaAtual.presencas[alunoId] = v;
        tg.querySelector(".tp").classList.toggle("sel-p", v);
        tg.querySelector(".tf").classList.toggle("sel-f", !v);
      });
    });
  });
};

Actions.salvarChamada = () => {
  const turma = Store.get("turmas", chamadaAtual.turmaId);
  if (!turma) return;
  const data = document.getElementById("ch-data").value;
  const conteudo = document.getElementById("ch-cont").value.trim();
  if (!data) { U.toast("Escolha a data da aula."); return; }

  const mats = Store.matriculasDaTurma(turma.id).filter(m => m.status === "cursando" || m.status === "concluido");
  if (!mats.length) { U.toast("Matricule alunos nesta turma primeiro."); return; }

  const existente = Store.col("chamadas").find(c => c.turmaId === turma.id && c.data === data);
  const base = existente ? { ...existente.presencas } : {};

  // quem não foi tocado no toggle: mantém o que havia; se novo, marca presente por padrão
  const presencas = {};
  for (const m of mats) {
    if (m.alunoId in chamadaAtual.presencas) presencas[m.alunoId] = chamadaAtual.presencas[m.alunoId];
    else if (m.alunoId in base) presencas[m.alunoId] = base[m.alunoId];
    else presencas[m.alunoId] = true;
  }

  Store.upsert("chamadas", {
    id: existente ? existente.id : undefined,
    turmaId: turma.id, data, conteudo, presencas
  });
  chamadaAtual.presencas = {};
  U.toast(existente ? "Chamada atualizada." : "Chamada salva.");
  App.render();
};

Actions.abrirChamadaData = data => {
  chamadaAtual.data = data;
  chamadaAtual.presencas = {};
  App.render();
};

Actions.excluirChamada = id => {
  if (confirm("Excluir esta chamada?")) {
    Store.remover("chamadas", id);
    U.toast("Chamada excluída.");
    App.render();
  }
};
