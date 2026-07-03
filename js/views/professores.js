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
        <a class="btn ghost" href="#/professor" style="text-decoration:none;">&#128274; Área do professor</a>
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
        <div class="form-section">Acesso à "Área do professor"</div>
        <div class="field">
          <label for="fp-pin">PIN de acesso (4 a 6 dígitos)</label>
          <input id="fp-pin" name="pinNovo" type="password" inputmode="numeric" minlength="4" maxlength="6"
            placeholder="${p.pinHash ? "já cadastrado — preencha para trocar" : "defina o PIN do professor"}" autocomplete="new-password">
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn ghost" data-modal-action="cancelar">Cancelar</button>
        <button type="submit" class="btn accent">Salvar professor</button>
      </div>
    </form>`, dados => {
    if (!dados.nome.trim()) return false;
    const { pinNovo, ...resto } = dados;
    const obj = { id: p.id || undefined, ...resto, nome: dados.nome.trim(), pinHash: p.pinHash || "" };
    if (pinNovo && pinNovo.trim()) {
      if (!/^\d{4,6}$/.test(pinNovo.trim())) { alert("O PIN deve ter de 4 a 6 dígitos numéricos."); return false; }
      obj.pinHash = U.hashPin(pinNovo.trim());
    }
    Store.upsert("professores", obj);
    U.toast("Professor salvo.");
    App.render();
  });
}

Actions.novoProf = () => abrirFormProf({ nome: "", telefone: "", email: "", formacao: "", experiencia: "", pinHash: "" });
Actions.editarProf = id => abrirFormProf(Store.get("professores", id));
Actions.excluirProf = id => {
  const p = Store.get("professores", id);
  if (confirm(`Excluir o professor "${p.nome}"?`)) {
    Store.remover("professores", id);
    U.toast("Professor excluído.");
    App.render();
  }
};

/* ---------------- Área do professor (acesso restrito por PIN) ---------------- */

const CHAVE_PROFESSOR_LOGADO = "bzn-professor-logado";

function professorLogado() {
  const id = sessionStorage.getItem(CHAVE_PROFESSOR_LOGADO);
  if (!id) return null;
  const p = Store.get("professores", id);
  if (!p) { sessionStorage.removeItem(CHAVE_PROFESSOR_LOGADO); return null; }
  return p;
}

Views.professorArea = () => {
  const prof = professorLogado();
  if (!prof) {
    const profs = U.ordenarPorNome(Store.col("professores"));
    return `
      <div class="page-head">
        <div>
          <h2>Área do professor</h2>
          <p>Acesso restrito: cada professor vê apenas as próprias turmas, alunos e chamadas.</p>
        </div>
        <div class="head-actions"><a class="btn ghost" href="#/professores" style="text-decoration:none;">&larr; Voltar</a></div>
      </div>
      <div class="panel" style="max-width:480px;">
        <h3>Entrar</h3>
        <p class="panel-sub">Escolha seu nome e digite seu PIN</p>
        ${profs.length ? `
        <div class="form-grid" style="grid-template-columns:1fr;">
          <div class="field">
            <label for="login-professor">Professor</label>
            <select id="login-professor">
              ${profs.map(p => `<option value="${p.id}">${U.esc(p.nome)}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label for="login-pin-prof">PIN</label>
            <input id="login-pin-prof" type="password" inputmode="numeric" maxlength="6" placeholder="4 a 6 dígitos" autocomplete="off">
          </div>
        </div>
        <div class="form-actions">
          <button class="btn accent" data-action="entrarProfessor">Entrar</button>
        </div>
        <div class="alert-box info" style="margin-top:14px;">
          <span class="ico">&#128274;</span>
          <div><p>O PIN é cadastrado pela secretaria no formulário do professor (aba Professores → editar).</p></div>
        </div>`
        : `<div class="empty-note">Nenhum professor cadastrado ainda.</div>`}
      </div>
    `;
  }

  /* logado: turmas, alunos e estatísticas do professor */
  const minhasTurmas = Store.col("turmas").filter(t => t.professorId === prof.id)
    .sort((a, b) => (b.dataInicio || "").localeCompare(a.dataInicio || ""));
  const idsAlunos = new Set();
  minhasTurmas.forEach(t => Store.matriculasDaTurma(t.id).forEach(m => idsAlunos.add(m.alunoId)));

  const medias = minhasTurmas.map(t => Store.presencaMediaTurma(t.id)).filter(x => x !== null);
  const mediaGeral = medias.length ? Math.round(medias.reduce((a, b) => a + b, 0) / medias.length) : null;
  const risco = Store.alunosEmRisco().filter(x => x.turma.professorId === prof.id);

  const linhasTurmas = minhasTurmas.map(t => {
    const c = Store.get("cursos", t.cursoId);
    const qtd = Store.matriculasDaTurma(t.id).length;
    const media = Store.presencaMediaTurma(t.id);
    return `
      <tr>
        <td><span class="chip cor-${c ? c.corIndex : 8}">${U.esc(c ? c.nome : "—")}</span></td>
        <td>${U.esc(t.nome)}</td>
        <td>${U.esc(t.horario || "—")}</td>
        <td>${qtd}</td>
        <td>${media !== null ? media + "%" : "—"}</td>
        <td>${U.esc(t.status)}</td>
        <td><button class="btn sm accent" data-action="irChamada" data-id="${t.id}">Fazer chamada</button></td>
      </tr>`;
  }).join("");

  const blocosAlunos = minhasTurmas.map(t => {
    const c = Store.get("cursos", t.cursoId);
    const mats = Store.matriculasDaTurma(t.id);
    if (!mats.length) return "";
    const linhas = mats.map(m => ({ m, aluno: Store.get("alunos", m.alunoId) }))
      .filter(x => x.aluno)
      .sort((a, b) => a.aluno.nome.localeCompare(b.aluno.nome, "pt-BR"))
      .map(({ m, aluno }) => {
        const p = Store.presencaAluno(t.id, aluno.id);
        const cls = p.pct === null ? "info" : p.pct >= Store.config.presencaMinima ? "ok" : "bad";
        return `<tr>
          <td>${U.esc(aluno.nome)}</td>
          <td>${U.esc(aluno.telefone || "—")}</td>
          <td><span class="pill ${cls}">${p.pct !== null ? p.pct + "%" : "sem registros"}</span></td>
          <td>${U.esc(m.status)}</td>
        </tr>`;
      }).join("");
    return `
      <div class="panel">
        <h3><span class="chip cor-${c ? c.corIndex : 8}">${U.esc(c ? c.nome : "—")}</span> ${U.esc(t.nome)}</h3>
        <p class="panel-sub">Alunos e frequência — contato apenas, sem dados sociais</p>
        <div class="table-wrap"><table>
          <thead><tr><th>Aluno</th><th>Telefone</th><th>Frequência</th><th>Matrícula</th></tr></thead>
          <tbody>${linhas}</tbody>
        </table></div>
      </div>`;
  }).join("");

  return `
    <div class="page-head">
      <div>
        <h2>Área do professor — ${U.esc(prof.nome)}</h2>
        <p>Suas turmas, seus alunos e a chamada, tudo num lugar só.</p>
      </div>
      <div class="head-actions">
        <button class="btn ghost" data-action="sairProfessor">Sair da minha área</button>
      </div>
    </div>

    <section class="stat-strip">
      <div class="stat-card" style="--stat-color: var(--navy-strong)">
        <span class="label">Minhas turmas</span>
        <span class="value">${minhasTurmas.length}</span>
        <span class="delta">${minhasTurmas.filter(t => t.status === "em andamento").length} em andamento</span>
      </div>
      <div class="stat-card" style="--stat-color: var(--accent)">
        <span class="label">Meus alunos</span>
        <span class="value">${idsAlunos.size}</span>
        <span class="delta">alunos distintos</span>
      </div>
      <div class="stat-card" style="--stat-color: var(--good)">
        <span class="label">Presença média</span>
        <span class="value">${mediaGeral !== null ? mediaGeral + "%" : "—"}</span>
        <span class="delta">das minhas turmas</span>
      </div>
      <div class="stat-card" style="--stat-color: ${risco.length ? "var(--danger)" : "var(--good)"}">
        <span class="label">Alunos em risco</span>
        <span class="value">${risco.length}</span>
        <span class="delta">abaixo de ${Store.config.presencaMinima}% de presença</span>
      </div>
    </section>

    <div class="panel">
      <h3>Minhas turmas</h3>
      <p class="panel-sub">Clique em "Fazer chamada" para registrar a presença de hoje</p>
      ${minhasTurmas.length ? `
      <div class="table-wrap"><table>
        <thead><tr><th>Curso</th><th>Turma</th><th>Horário</th><th>Alunos</th><th>Presença</th><th>Status</th><th></th></tr></thead>
        <tbody>${linhasTurmas}</tbody>
      </table></div>` : `<div class="empty-note">Você ainda não tem turmas vinculadas.</div>`}
    </div>

    ${risco.length ? `
    <div class="panel">
      <h3>Alunos em risco nas minhas turmas</h3>
      <p class="panel-sub">Frequência abaixo do mínimo de ${Store.config.presencaMinima}%</p>
      ${risco.map(x => `
        <div class="alert-box warn">
          <span class="ico">&#9888;</span>
          <div>
            <strong>${U.esc(x.aluno ? x.aluno.nome : "—")} — ${x.pct}%</strong>
            <p>${U.esc(x.curso ? x.curso.nome : "")} · ${U.esc(x.turma.nome)}</p>
          </div>
        </div>`).join("")}
    </div>` : ""}

    ${blocosAlunos}
  `;
};

Actions.entrarProfessor = () => {
  const id = document.getElementById("login-professor").value;
  const pin = document.getElementById("login-pin-prof").value.trim();
  const p = Store.get("professores", id);
  if (!p) return;
  if (!p.pinHash) { alert("Este professor ainda não tem PIN cadastrado.\nPeça para a secretaria definir o PIN na aba Professores → editar."); return; }
  if (U.hashPin(pin) !== p.pinHash) {
    U.toast("PIN incorreto.");
    document.getElementById("login-pin-prof").value = "";
    document.getElementById("login-pin-prof").focus();
    return;
  }
  sessionStorage.setItem(CHAVE_PROFESSOR_LOGADO, p.id);
  U.toast(`Bem-vindo(a), ${p.nome.split(" ")[0]}!`);
  App.render();
};

Actions.sairProfessor = () => {
  sessionStorage.removeItem(CHAVE_PROFESSOR_LOGADO);
  U.toast("Você saiu da sua área.");
  App.render();
};
