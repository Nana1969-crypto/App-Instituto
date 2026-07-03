/* Cursos: lista, ementa, módulos, carga horária */
"use strict";

Views.cursos = () => {
  const cursos = U.ordenarPorNome(Store.col("cursos"));
  const cards = cursos.map(c => {
    const ch = Store.cargaHoraria(c);
    const turmas = Store.col("turmas").filter(t => t.cursoId === c.id);
    const alunos = new Set(
      Store.col("matriculas").filter(m => turmas.some(t => t.id === m.turmaId)).map(m => m.alunoId)
    ).size;
    return `
      <div class="entity-card cor-${c.corIndex}">
        <div class="e-head">
          <div>
            <div class="e-title">${U.esc(c.nome)}</div>
            <span class="chip">${c.status === "ativo" ? "Ativo" : "Inativo"}</span>
          </div>
          <div class="e-actions">
            <button class="icon-btn" data-action="editarCurso" data-id="${c.id}" title="Editar" aria-label="Editar curso">&#9998;</button>
            <button class="icon-btn" data-action="excluirCurso" data-id="${c.id}" title="Excluir" aria-label="Excluir curso">&#128465;</button>
          </div>
        </div>
        <div class="e-meta">
          ${c.modulos.length} ${U.plural(c.modulos.length, "módulo", "módulos")} · ${ch}h de carga horária<br>
          ${turmas.length} ${U.plural(turmas.length, "turma", "turmas")} · ${alunos} ${U.plural(alunos, "aluno", "alunos")}
        </div>
        ${c.ementa ? `<div class="e-meta">${U.esc(c.ementa).slice(0, 160)}${c.ementa.length > 160 ? "…" : ""}</div>` : ""}
        ${c.modulos.length ? `<div class="cross-chips">${c.modulos.map(m =>
          `<span class="chip">${U.esc(m.nome)} · ${m.horas || 0}h</span>`).join("")}</div>` : ""}
      </div>`;
  }).join("");

  return `
    <div class="page-head">
      <div>
        <h2>Cursos</h2>
        <p>Ementa, módulos e carga horária de cada curso oferecido pelo instituto.</p>
      </div>
      <div class="head-actions">
        <button class="btn accent" data-action="novoCurso">+ Novo curso</button>
      </div>
    </div>
    ${cursos.length ? `<div class="grid-cards">${cards}</div>`
      : `<div class="panel"><div class="empty-note">Nenhum curso cadastrado ainda.<br>Clique em <strong>+ Novo curso</strong> para começar.</div></div>`}
  `;
};

function formCursoHTML(c) {
  const modRows = (c.modulos.length ? c.modulos : [{ nome: "", descricao: "", horas: "" }])
    .map(m => modRowHTML(m)).join("");
  const corOpts = [1, 2, 3, 4, 5, 6, 7, 8].map(i =>
    `<option value="${i}" ${c.corIndex === i ? "selected" : ""}>Cor ${i}</option>`).join("");
  return `
    <form>
      <div class="form-grid">
        <div class="field full">
          <label for="f-nome">Nome do curso *</label>
          <input id="f-nome" name="nome" required value="${U.esc(c.nome)}">
        </div>
        <div class="field full">
          <label for="f-ementa">Ementa</label>
          <textarea id="f-ementa" name="ementa">${U.esc(c.ementa)}</textarea>
        </div>
        <div class="field">
          <label for="f-status">Status</label>
          <select id="f-status" name="status">
            <option value="ativo" ${c.status === "ativo" ? "selected" : ""}>Ativo</option>
            <option value="inativo" ${c.status === "inativo" ? "selected" : ""}>Inativo</option>
          </select>
        </div>
        <div class="field">
          <label for="f-cor">Cor no painel</label>
          <select id="f-cor" name="corIndex">${corOpts}</select>
        </div>
        <div class="form-section">Módulos (nome · descrição · horas)</div>
        <div class="full" id="mod-lista">${modRows}</div>
        <div class="full">
          <button type="button" class="btn ghost sm" data-modal-action="addModulo">+ Adicionar módulo</button>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn ghost" data-modal-action="cancelar">Cancelar</button>
        <button type="submit" class="btn accent">Salvar curso</button>
      </div>
    </form>`;
}

function modRowHTML(m) {
  return `
    <div class="mod-row">
      <input placeholder="Nome do módulo" class="mod-nome" value="${U.esc(m.nome)}">
      <input placeholder="Descrição" class="mod-desc" value="${U.esc(m.descricao)}">
      <input placeholder="Horas" type="number" min="0" class="mod-horas" value="${U.esc(m.horas)}">
      <button type="button" class="icon-btn mod-remover" title="Remover módulo" aria-label="Remover módulo">&#10005;</button>
    </div>`;
}

function lerModulos() {
  return [...document.querySelectorAll("#mod-lista .mod-row")]
    .map(r => ({
      nome: r.querySelector(".mod-nome").value.trim(),
      descricao: r.querySelector(".mod-desc").value.trim(),
      horas: Number(r.querySelector(".mod-horas").value) || 0
    }))
    .filter(m => m.nome);
}

function ligarRemocaoModulos() {
  document.querySelectorAll("#mod-lista .mod-remover").forEach(b => {
    b.onclick = () => b.closest(".mod-row").remove();
  });
}

function abrirFormCurso(c) {
  App.abrirModal(c.id ? "Editar curso" : "Novo curso", formCursoHTML(c), dados => {
    if (!dados.nome.trim()) return false;
    Store.upsert("cursos", {
      id: c.id || undefined,
      nome: dados.nome.trim(),
      ementa: dados.ementa.trim(),
      status: dados.status,
      corIndex: Number(dados.corIndex) || 1,
      modulos: lerModulos()
    });
    U.toast("Curso salvo.");
    App.render();
  });
  ligarRemocaoModulos();
}

Actions.novoCurso = () => abrirFormCurso({ nome: "", ementa: "", status: "ativo", corIndex: (Store.col("cursos").length % 8) + 1, modulos: [] });
Actions.editarCurso = id => abrirFormCurso(Store.get("cursos", id));
Actions.addModulo = () => {
  document.getElementById("mod-lista").insertAdjacentHTML("beforeend", modRowHTML({ nome: "", descricao: "", horas: "" }));
  ligarRemocaoModulos();
};
Actions.excluirCurso = id => {
  const c = Store.get("cursos", id);
  if (confirm(`Excluir o curso "${c.nome}"?\nAs turmas, matrículas e chamadas dele também serão removidas.`)) {
    Store.remover("cursos", id);
    U.toast("Curso excluído.");
    App.render();
  }
};
