/* Professores: cadastro e experiência profissional */
"use strict";

Views.professores = () => {
  const profs = U.ordenarPorNome(Store.col("professores"));
  const cards = profs.map((p, i) => {
    const turmas = Store.col("turmas").filter(t => t.professorId === p.id);
    const cursos = [...new Set(turmas.map(t => Store.get("cursos", t.cursoId)).filter(Boolean))];
    return `
      <div class="entity-card cor-${(i % 8) + 1}">
        <div class="e-head">
          <div style="display:flex; gap:10px; align-items:center;">
            <span class="avatar">${U.iniciais(p.nome)}</span>
            <div>
              <div class="e-title">${U.esc(p.nome)}</div>
              <div class="e-meta">${U.esc(p.formacao || "")}</div>
            </div>
          </div>
          <div class="e-actions">
            <button class="icon-btn" data-action="editarProf" data-id="${p.id}" title="Editar" aria-label="Editar professor">&#9998;</button>
            <button class="icon-btn" data-action="excluirProf" data-id="${p.id}" title="Excluir" aria-label="Excluir professor">&#128465;</button>
          </div>
        </div>
        ${cursos.length ? `<div class="cross-chips">${cursos.map(c =>
          `<span class="chip cor-${c.corIndex}">${U.esc(c.nome)}</span>`).join("")}</div>` : ""}
        ${p.experiencia ? `<div class="e-meta">${U.esc(p.experiencia)}</div>` : ""}
        <div class="e-meta">${U.esc(p.telefone || "")}${p.telefone && p.email ? " · " : ""}${U.esc(p.email || "")}</div>
      </div>`;
  }).join("");

  return `
    <div class="page-head">
      <div>
        <h2>Professores</h2>
        <p>Corpo docente do instituto, com formação e experiência profissional.</p>
      </div>
      <div class="head-actions">
        <button class="btn accent" data-action="novoProf">+ Novo professor</button>
      </div>
    </div>
    ${profs.length ? `<div class="grid-cards">${cards}</div>`
      : `<div class="panel"><div class="empty-note">Nenhum professor cadastrado ainda.</div></div>`}
  `;
};

function abrirFormProf(p) {
  App.abrirModal(p.id ? "Editar professor" : "Novo professor", `
    <form>
      <div class="form-grid">
        <div class="field full">
          <label for="fp-nome">Nome completo *</label>
          <input id="fp-nome" name="nome" required value="${U.esc(p.nome)}">
        </div>
        <div class="field">
          <label for="fp-tel">Telefone</label>
          <input id="fp-tel" name="telefone" value="${U.esc(p.telefone)}">
        </div>
        <div class="field">
          <label for="fp-email">E-mail</label>
          <input id="fp-email" name="email" type="email" value="${U.esc(p.email)}">
        </div>
        <div class="field full">
          <label for="fp-form">Formação</label>
          <input id="fp-form" name="formacao" value="${U.esc(p.formacao)}">
        </div>
        <div class="field full">
          <label for="fp-exp">Experiência profissional</label>
          <textarea id="fp-exp" name="experiencia">${U.esc(p.experiencia)}</textarea>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn ghost" data-modal-action="cancelar">Cancelar</button>
        <button type="submit" class="btn accent">Salvar professor</button>
      </div>
    </form>`, dados => {
    if (!dados.nome.trim()) return false;
    Store.upsert("professores", { id: p.id || undefined, ...dados, nome: dados.nome.trim() });
    U.toast("Professor salvo.");
    App.render();
  });
}

Actions.novoProf = () => abrirFormProf({ nome: "", telefone: "", email: "", formacao: "", experiencia: "" });
Actions.editarProf = id => abrirFormProf(Store.get("professores", id));
Actions.excluirProf = id => {
  const p = Store.get("professores", id);
  if (confirm(`Excluir o professor "${p.nome}"?`)) {
    Store.remover("professores", id);
    U.toast("Professor excluído.");
    App.render();
  }
};
