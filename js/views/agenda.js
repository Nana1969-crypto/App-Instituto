/* Agenda geral do instituto: datas de cursos e eventos, com salas.
   Seletor de ano a partir de 2025 — os anos futuros surgem sozinhos. */
"use strict";

const TIPOS_EVENTO = [
  ["curso", "Curso", 1],
  ["workshop", "Workshop", 2],
  ["palestra", "Palestra", 5],
  ["evento", "Evento", 3],
  ["reuniao", "Reunião", 4],
  ["outro", "Outro", 8]
];
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

let filtroEventos = { ano: new Date().getFullYear(), sala: "", tipo: "" };

function tipoEventoChip(tipo) {
  const t = TIPOS_EVENTO.find(x => x[0] === tipo) || TIPOS_EVENTO[5];
  return `<span class="chip cor-${t[2]}">${t[1]}</span>`;
}

Views.agenda = () => {
  const anos = Store.anosAgenda();
  if (!anos.includes(filtroEventos.ano)) filtroEventos.ano = anos.includes(new Date().getFullYear()) ? new Date().getFullYear() : anos[0];

  let eventos = Store.eventosDoAno(filtroEventos.ano);
  if (filtroEventos.sala) eventos = eventos.filter(e => e.sala === filtroEventos.sala);
  if (filtroEventos.tipo) eventos = eventos.filter(e => e.tipo === filtroEventos.tipo);

  /* agrupa por mês */
  let corpo = "";
  let mesAtual = -1;
  for (const e of eventos) {
    const mes = Number(e.data.slice(5, 7)) - 1;
    if (mes !== mesAtual) {
      mesAtual = mes;
      corpo += `<div class="alpha-letter">${MESES[mes]} de ${filtroEventos.ano}</div>`;
    }
    const t = e.turmaId ? Store.get("turmas", e.turmaId) : null;
    const c = t ? Store.get("cursos", t.cursoId) : null;
    const hora = e.horaInicio ? e.horaInicio + (e.horaFim ? "–" + e.horaFim : "") : "";
    corpo += `
      <div class="aluno-row" style="cursor:default;">
        <div style="min-width:86px; text-align:center; flex-shrink:0;">
          <div style="font-weight:800; font-size:1.05rem;">${U.fmtData(e.data).slice(0, 5)}</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">${hora || "dia todo"}</div>
        </div>
        <div class="a-info">
          <div class="a-nome">${U.esc(e.titulo)}</div>
          <div class="a-sub">
            ${e.responsavel ? "Resp.: " + U.esc(e.responsavel) : ""}${e.responsavel && e.obs ? " · " : ""}${U.esc(e.obs || "")}
          </div>
        </div>
        <div class="a-chips" style="align-items:center;">
          ${tipoEventoChip(e.tipo)}
          ${c ? `<span class="chip cor-${c.corIndex}">${U.esc(c.nome)}</span>` : ""}
          ${e.sala ? `<span class="pill info">${U.esc(e.sala)}</span>` : ""}
          <button class="icon-btn" data-action="editarEvento" data-id="${e.id}" title="Editar" aria-label="Editar evento">&#9998;</button>
          <button class="icon-btn" data-action="excluirEvento" data-id="${e.id}" title="Excluir" aria-label="Excluir evento">&#128465;</button>
        </div>
      </div>`;
  }

  const selAno = `<select id="ag-ano" class="search-input" style="min-width:auto;">
    ${anos.map(a => `<option value="${a}" ${a === filtroEventos.ano ? "selected" : ""}>${a}</option>`).join("")}
  </select>`;
  const selSala = `<select id="ag-sala" class="search-input" style="min-width:auto;">
    <option value="">Todas as salas</option>
    ${Store.config.salas.map(s => `<option value="${U.esc(s)}" ${filtroEventos.sala === s ? "selected" : ""}>${U.esc(s)}</option>`).join("")}
  </select>`;
  const selTipo = `<select id="ag-tipo" class="search-input" style="min-width:auto;">
    <option value="">Todos os tipos</option>
    ${TIPOS_EVENTO.map(([v, r]) => `<option value="${v}" ${filtroEventos.tipo === v ? "selected" : ""}>${r}</option>`).join("")}
  </select>`;

  /* resumo de uso das salas no ano */
  const usoSalas = new Map();
  Store.eventosDoAno(filtroEventos.ano).forEach(e => {
    if (e.sala) usoSalas.set(e.sala, (usoSalas.get(e.sala) || 0) + 1);
  });
  const usoHTML = usoSalas.size ? [...usoSalas.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([sala, qtd]) => `<span class="chip">${U.esc(sala)} · ${qtd}</span>`).join(" ") : "";

  return `
    <div class="page-head">
      <div>
        <h2>Agenda</h2>
        <p>Datas de cursos, workshops, palestras e eventos do instituto, com a sala de cada atividade.</p>
      </div>
      <div class="head-actions">
        <button class="btn ghost" data-action="csvAgenda">Exportar planilha</button>
        <button class="btn ghost" data-action="imprimir">Imprimir / PDF</button>
        <button class="btn accent" data-action="novoEvento">+ Novo evento</button>
      </div>
    </div>

    <div class="panel">
      <div class="head-actions">${selAno}${selSala}${selTipo}</div>
      ${usoHTML ? `<div style="margin-top:14px; display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
        <span style="font-size:0.76rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em;">Uso das salas em ${filtroEventos.ano}:</span>
        ${usoHTML}
      </div>` : ""}
    </div>

    <div class="panel">
      ${eventos.length ? corpo : `<div class="empty-note">Nenhum evento em ${filtroEventos.ano}${filtroEventos.sala || filtroEventos.tipo ? " com esses filtros" : ""}.<br>Use <strong>+ Novo evento</strong> para agendar.</div>`}
    </div>
  `;
};

function abrirFormEvento(e) {
  const optSalas = ['<option value="">— sem sala definida —</option>']
    .concat(Store.config.salas.map(s => `<option value="${U.esc(s)}" ${e.sala === s ? "selected" : ""}>${U.esc(s)}</option>`)).join("");
  const optTipos = TIPOS_EVENTO.map(([v, r]) => `<option value="${v}" ${e.tipo === v ? "selected" : ""}>${r}</option>`).join("");
  const optTurmas = ['<option value="">— sem vínculo com turma —</option>']
    .concat(Store.col("turmas").map(t => {
      const c = Store.get("cursos", t.cursoId);
      return `<option value="${t.id}" ${e.turmaId === t.id ? "selected" : ""}>${U.esc((c ? c.nome : "?") + " — " + t.nome)}</option>`;
    })).join("");

  App.abrirModal(e.id ? "Editar evento" : "Novo evento", `
    <form>
      <div class="form-grid">
        <div class="field full">
          <label for="fe-titulo">Título *</label>
          <input id="fe-titulo" name="titulo" required placeholder="ex.: Palestra: Saúde Financeira" value="${U.esc(e.titulo)}">
        </div>
        <div class="field">
          <label for="fe-tipo">Tipo</label>
          <select id="fe-tipo" name="tipo">${optTipos}</select>
        </div>
        <div class="field">
          <label for="fe-sala">Sala / local</label>
          <div style="display:flex; gap:6px;">
            <select id="fe-sala" name="sala" style="flex:1;">${optSalas}</select>
            <button type="button" class="btn ghost sm" data-modal-action="novaSala" title="Adicionar sala">+</button>
          </div>
        </div>
        <div class="field">
          <label for="fe-data">Data *</label>
          <input id="fe-data" name="data" type="date" required value="${U.esc(e.data)}">
        </div>
        <div class="field">
          <label for="fe-ini">Hora de início</label>
          <input id="fe-ini" name="horaInicio" type="time" value="${U.esc(e.horaInicio)}">
        </div>
        <div class="field">
          <label for="fe-fim">Hora de término</label>
          <input id="fe-fim" name="horaFim" type="time" value="${U.esc(e.horaFim)}">
        </div>
        <div class="field">
          <label for="fe-resp">Responsável</label>
          <input id="fe-resp" name="responsavel" value="${U.esc(e.responsavel)}">
        </div>
        <div class="field full">
          <label for="fe-turma">Turma vinculada (opcional)</label>
          <select id="fe-turma" name="turmaId">${optTurmas}</select>
        </div>
        <div class="field full">
          <label for="fe-obs">Observações</label>
          <textarea id="fe-obs" name="obs">${U.esc(e.obs)}</textarea>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn ghost" data-modal-action="cancelar">Cancelar</button>
        <button type="submit" class="btn accent">Salvar evento</button>
      </div>
    </form>`, dados => {
    if (!dados.titulo.trim() || !dados.data) return false;
    const novo = { id: e.id || undefined, ...dados, titulo: dados.titulo.trim() };
    const conflito = Store.conflitoSala(novo);
    if (conflito && !confirm(
      `Atenção: a ${novo.sala} já está reservada em ${U.fmtData(novo.data)} ` +
      `(${conflito.horaInicio || "dia todo"}${conflito.horaFim ? "–" + conflito.horaFim : ""}) para "${conflito.titulo}".\n\nSalvar mesmo assim?`)) {
      return false;
    }
    Store.upsert("eventos", novo);
    filtroEventos.ano = Number(dados.data.slice(0, 4));
    U.toast("Evento salvo.");
    App.render();
  });
}

Actions.novoEvento = () => abrirFormEvento({
  titulo: "", tipo: "evento", data: U.hojeISO(), horaInicio: "", horaFim: "",
  sala: "", turmaId: "", responsavel: "", obs: ""
});
Actions.editarEvento = id => abrirFormEvento(Store.col("eventos").find(x => x.id === id));
Actions.excluirEvento = id => {
  const e = Store.col("eventos").find(x => x.id === id);
  if (e && confirm(`Excluir o evento "${e.titulo}"?`)) {
    Store.remover("eventos", id);
    U.toast("Evento excluído.");
    App.render();
  }
};
Actions.novaSala = () => {
  const nome = prompt("Nova sala/local (ex.: Sala 6, Cozinha comunitária):");
  if (!nome) return;
  const salvo = Store.addSala(nome);
  const sel = document.getElementById("fe-sala");
  if (sel && salvo) {
    sel.insertAdjacentHTML("beforeend", `<option value="${U.esc(salvo)}">${U.esc(salvo)}</option>`);
    sel.value = salvo;
  }
  U.toast("Sala adicionada.");
};

Actions.csvAgenda = () => {
  const cab = ["Data", "Início", "Término", "Título", "Tipo", "Sala", "Turma vinculada", "Responsável", "Observações"];
  const linhas = Store.eventosDoAno(filtroEventos.ano).map(e => {
    const t = e.turmaId ? Store.get("turmas", e.turmaId) : null;
    const c = t ? Store.get("cursos", t.cursoId) : null;
    const rotulo = (TIPOS_EVENTO.find(x => x[0] === e.tipo) || ["", "Outro"])[1];
    return U.linhaCSV([U.fmtData(e.data), e.horaInicio, e.horaFim, e.titulo, rotulo, e.sala,
      c ? c.nome + " — " + t.nome : "", e.responsavel, e.obs]);
  });
  U.baixarArquivo(`agenda-${filtroEventos.ano}-instituto-bzn.csv`, "﻿" + [U.linhaCSV(cab), ...linhas].join("\n"), "text/csv;charset=utf-8");
  U.toast(`Agenda de ${filtroEventos.ano} exportada.`);
};

/* filtros */
const aposRenderAgenda = Views.aposRender;
Views.aposRender = (rota, param) => {
  if (aposRenderAgenda) aposRenderAgenda(rota, param);
  if (rota !== "agenda") return;
  const liga = (id, campo) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", () => {
      filtroEventos[campo] = campo === "ano" ? Number(el.value) : el.value;
      App.render();
    });
  };
  liga("ag-ano", "ano");
  liga("ag-sala", "sala");
  liga("ag-tipo", "tipo");
};
