/* Alunos: cadastro geral em ordem alfabética + ficha com histórico de cursos */
"use strict";

let filtroAlunos = "";

Views.alunos = () => {
  const todos = U.ordenarPorNome(Store.col("alunos"));
  const filtro = filtroAlunos.trim().toLowerCase();
  const lista = filtro
    ? todos.filter(a => (a.nome + " " + (a.cpf || "") + " " + (a.email || "")).toLowerCase().includes(filtro))
    : todos;

  let html = "";
  let letraAtual = "";
  for (const a of lista) {
    const letra = (a.nome[0] || "?").toUpperCase();
    if (letra !== letraAtual) {
      letraAtual = letra;
      html += `<div class="alpha-letter">${letra}</div>`;
    }
    const cursos = Store.cursosDoAluno(a.id);
    html += `
      <div class="aluno-row" data-action="verAluno" data-id="${a.id}">
        <span class="avatar cor-${(letra.charCodeAt(0) % 8) + 1}">${U.iniciais(a.nome)}</span>
        <div class="a-info">
          <div class="a-nome">${U.esc(a.nome)}</div>
          <div class="a-sub">${U.esc(a.telefone || "")}${a.telefone && a.email ? " · " : ""}${U.esc(a.email || "")}</div>
        </div>
        <div class="a-chips">
          ${cursos.slice(0, 3).map(x => `<span class="chip cor-${x.curso.corIndex}">${U.esc(x.curso.nome)}</span>`).join("")}
          ${cursos.length > 3 ? `<span class="chip">+${cursos.length - 3}</span>` : ""}
        </div>
      </div>`;
  }

  return `
    <div class="page-head">
      <div>
        <h2>Alunos</h2>
        <p>Cadastro geral em ordem alfabética. Clique em um aluno para ver a ficha completa e o histórico de cursos.</p>
      </div>
      <div class="head-actions">
        <input class="search-input" id="busca-aluno" type="search" placeholder="Buscar por nome, CPF ou e-mail…" value="${U.esc(filtroAlunos)}">
        <button class="btn accent" data-action="novoAluno">+ Novo aluno</button>
      </div>
    </div>
    <div class="panel">
      ${lista.length ? html : `<div class="empty-note">${filtro ? "Nenhum aluno encontrado para essa busca." : "Nenhum aluno cadastrado ainda."}</div>`}
    </div>
  `;
};

Views.aposRender = rota => {
  if (rota === "alunos") {
    const campo = document.getElementById("busca-aluno");
    if (campo) {
      campo.addEventListener("input", () => {
        filtroAlunos = campo.value;
        // re-renderiza só a lista mantendo o foco no campo
        const pos = campo.selectionStart;
        App.render();
        const novo = document.getElementById("busca-aluno");
        if (novo) { novo.focus(); novo.setSelectionRange(pos, pos); }
      });
    }
  }
};

Views.alunoDetalhe = id => {
  const a = Store.get("alunos", id);
  if (!a) return `<div class="panel"><div class="empty-note">Aluno não encontrado.</div></div>`;

  const cursos = Store.cursosDoAluno(a.id);
  const mats = Store.matriculasDoAluno(a.id);
  const idade = U.idade(a.nascimento);

  const item = (k, v) => `<div class="detail-item"><div class="k">${k}</div><div class="v">${v || "—"}</div></div>`;

  const linhasMat = mats.map(m => {
    const t = Store.get("turmas", m.turmaId);
    const c = t ? Store.get("cursos", t.cursoId) : null;
    const p = t ? Store.presencaAluno(t.id, a.id) : { pct: null };
    const pillCls = { cursando: "ok", concluido: "info", trancado: "warn", desistente: "bad" }[m.status] || "info";
    const ehPago = c && c.tipoCurso === "pago";
    return `
      <tr>
        <td><span class="chip cor-${c ? c.corIndex : 8}">${U.esc(c ? c.nome : "curso removido")}</span>
          ${ehPago ? (m.bolsa ? `<span class="pill ok">bolsista</span>` : `<span class="pill info">pagante</span>`) : ""}</td>
        <td>${U.esc(t ? t.nome : "—")}</td>
        <td>${t ? U.fmtData(t.dataInicio) + " – " + U.fmtData(t.dataFim) : "—"}</td>
        <td>${p.pct !== null ? p.pct + "%" : "—"}</td>
        <td><span class="pill ${pillCls}">${U.esc(m.status)}</span></td>
        <td><button class="icon-btn" data-action="editarMatricula" data-id="${m.id}" title="Alterar status" aria-label="Alterar status da matrícula">&#9998;</button></td>
      </tr>`;
  }).join("");

  return `
    <div class="page-head">
      <div>
        <h2>${U.esc(a.nome)}</h2>
        <p>${cursos.length ? `Já participou de ${cursos.length} ${U.plural(cursos.length, "curso", "cursos diferentes")} no instituto.` : "Ainda não tem matrículas."}</p>
      </div>
      <div class="head-actions">
        <button class="btn ghost" data-action="voltarAlunos">&larr; Voltar</button>
        <button class="btn" data-action="matricular" data-id="${a.id}">Matricular em turma</button>
        <button class="btn accent" data-action="editarAluno" data-id="${a.id}">Editar cadastro</button>
      </div>
    </div>

    ${cursos.length ? `
    <div class="panel">
      <h3>Trajetória no instituto</h3>
      <p class="panel-sub">Cursos que este aluno já fez ou está fazendo</p>
      <div class="cross-chips">
        ${cursos.map(x => `<span class="chip cor-${x.curso.corIndex}">${U.esc(x.curso.nome)}</span>`).join("")}
      </div>
    </div>` : ""}

    <div class="panel">
      <h3>Matrículas</h3>
      <p class="panel-sub">Histórico completo de turmas</p>
      ${mats.length ? `
      <div class="table-wrap"><table>
        <thead><tr><th>Curso</th><th>Turma</th><th>Período</th><th>Presença</th><th>Status</th><th></th></tr></thead>
        <tbody>${linhasMat}</tbody>
      </table></div>` : `<div class="empty-note">Nenhuma matrícula. Use o botão <strong>Matricular em turma</strong>.</div>`}
    </div>

    <div class="grid-2-even">
      <div class="panel">
        <h3>Dados pessoais</h3>
        <p class="panel-sub">Informações de cadastro</p>
        <div class="detail-grid">
          ${item("Data de nascimento", a.nascimento ? U.fmtData(a.nascimento) + (idade !== null ? ` (${idade} anos)` : "") : "")}
          ${item("CPF", U.esc(a.cpf))}
          ${item("Telefone", U.esc(a.telefone))}
          ${item("E-mail", U.esc(a.email))}
          ${item("Endereço", U.esc([a.endereco, a.bairro, a.cidade].filter(Boolean).join(", ")))}
          ${item("CEP", U.esc(a.cep))}
          ${item("Nome do responsável", U.esc(a.responsavel))}
          ${item("Encaminhamento", U.esc(a.encaminhamento))}
        </div>
      </div>
      <div class="panel">
        <h3>Situação social</h3>
        <p class="panel-sub">Dados sensíveis — uso interno do instituto</p>
        <div class="detail-grid">
          ${item("Atingido pelas enchentes", a.atingidoEnchente === "sim" ? "Sim" : a.atingidoEnchente === "nao" ? "Não" : "")}
          ${item("Impacto das enchentes", U.esc(a.impactoEnchentes))}
          ${item("Renda familiar", U.esc(a.rendaFamiliar))}
          ${item("Benefícios sociais", U.esc(a.beneficios))}
          ${item("Moradia atual", U.esc(a.moradiaAtual))}
          ${item("Necessidades de apoio", U.esc(a.necessidades))}
          ${item("Observações", U.esc(a.observacoes))}
        </div>
        ${(a.termos || []).length ? `
          <div style="margin-top:14px;">
            <div class="k" style="font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-muted); margin-bottom:6px;">Termos e documentos</div>
            <div class="cross-chips">${Anexos.links(a.termos)}</div>
          </div>` : ""}
      </div>
    </div>

    <div class="head-actions">
      <button class="btn danger" data-action="excluirAluno" data-id="${a.id}">Excluir aluno</button>
    </div>
  `;
};

/* monta as <option> do select de encaminhamento, incluindo um valor legado
   que porventura não esteja mais na lista de opções */
function opcoesEncaminhamento(atual) {
  const opcoes = [...Store.config.encaminhamentos];
  if (atual && !opcoes.some(o => o.toLowerCase() === atual.toLowerCase())) opcoes.push(atual);
  return ['<option value="">— selecione —</option>']
    .concat(opcoes.map(o =>
      `<option value="${U.esc(o)}" ${o === atual ? "selected" : ""}>${U.esc(o)}</option>`))
    .join("");
}

function abrirFormAluno(a) {
  App.abrirModal(a.id ? "Editar aluno" : "Novo aluno", `
    <form>
      <div class="form-grid">
        <div class="form-section">Dados pessoais</div>
        <div class="field full">
          <label for="fa-nome">Nome completo *</label>
          <input id="fa-nome" name="nome" required value="${U.esc(a.nome)}">
        </div>
        <div class="field">
          <label for="fa-nasc">Data de nascimento</label>
          <input id="fa-nasc" name="nascimento" type="date" value="${U.esc(a.nascimento)}">
        </div>
        <div class="field">
          <label for="fa-cpf">CPF</label>
          <input id="fa-cpf" name="cpf" placeholder="000.000.000-00" value="${U.esc(a.cpf)}">
        </div>
        <div class="field">
          <label for="fa-tel">Telefone</label>
          <input id="fa-tel" name="telefone" value="${U.esc(a.telefone)}">
        </div>
        <div class="field">
          <label for="fa-email">E-mail</label>
          <input id="fa-email" name="email" type="email" value="${U.esc(a.email)}">
        </div>
        <div class="form-section">Endereço</div>
        <div class="field full">
          <label for="fa-end">Rua e número</label>
          <input id="fa-end" name="endereco" value="${U.esc(a.endereco)}">
        </div>
        <div class="field">
          <label for="fa-bairro">Bairro</label>
          <input id="fa-bairro" name="bairro" value="${U.esc(a.bairro)}">
        </div>
        <div class="field">
          <label for="fa-cidade">Cidade</label>
          <input id="fa-cidade" name="cidade" value="${U.esc(a.cidade)}">
        </div>
        <div class="field">
          <label for="fa-cep">CEP</label>
          <input id="fa-cep" name="cep" value="${U.esc(a.cep)}">
        </div>
        <div class="form-section">Vínculos</div>
        <div class="field">
          <label for="fa-resp">Nome do responsável</label>
          <input id="fa-resp" name="responsavel" value="${U.esc(a.responsavel)}">
        </div>
        <div class="field">
          <label for="fa-enc">Encaminhamento (origem)</label>
          <div style="display:flex; gap:6px;">
            <select id="fa-enc" name="encaminhamento" style="flex:1;">
              ${opcoesEncaminhamento(a.encaminhamento)}
            </select>
            <button type="button" class="btn ghost sm" data-modal-action="novoEncaminhamento" title="Adicionar nova origem">+</button>
          </div>
        </div>
        <div class="form-section">Situação social</div>
        <div class="field">
          <label for="fa-ate">Atingido pelas enchentes?</label>
          <select id="fa-ate" name="atingidoEnchente">
            <option value="" ${!a.atingidoEnchente ? "selected" : ""}>Não informado</option>
            <option value="sim" ${a.atingidoEnchente === "sim" ? "selected" : ""}>Sim</option>
            <option value="nao" ${a.atingidoEnchente === "nao" ? "selected" : ""}>Não</option>
          </select>
        </div>
        <div class="field full">
          <label for="fa-ench">Detalhes do impacto das enchentes</label>
          <textarea id="fa-ench" name="impactoEnchentes">${U.esc(a.impactoEnchentes)}</textarea>
        </div>
        <div class="field">
          <label for="fa-renda">Renda familiar</label>
          <input id="fa-renda" name="rendaFamiliar" value="${U.esc(a.rendaFamiliar)}">
        </div>
        <div class="field">
          <label for="fa-benef">Benefícios sociais</label>
          <input id="fa-benef" name="beneficios" placeholder="ex.: Bolsa Família" value="${U.esc(a.beneficios)}">
        </div>
        <div class="field">
          <label for="fa-morad">Moradia atual</label>
          <input id="fa-morad" name="moradiaAtual" value="${U.esc(a.moradiaAtual)}">
        </div>
        <div class="field">
          <label for="fa-nec">Necessidades de apoio</label>
          <input id="fa-nec" name="necessidades" placeholder="ex.: transporte, alimentação" value="${U.esc(a.necessidades)}">
        </div>
        <div class="field full">
          <label for="fa-obs">Observações</label>
          <textarea id="fa-obs" name="observacoes">${U.esc(a.observacoes)}</textarea>
        </div>
        ${Anexos.campoHTML("Termos e documentos (PDF)", "Termo de consentimento, autorização de imagem, etc. Até 5 arquivos.")}
      </div>
      <div class="form-actions">
        <button type="button" class="btn ghost" data-modal-action="cancelar">Cancelar</button>
        <button type="submit" class="btn accent">Salvar aluno</button>
      </div>
    </form>`, dados => {
    if (!dados.nome.trim()) return false;
    let salvo;
    try {
      salvo = Store.upsert("alunos", { id: a.id || undefined, ...dados, nome: dados.nome.trim(), termos: Anexos.lista() });
    } catch (e) {
      alert("Não foi possível salvar: o armazenamento do navegador está cheio.\nRemova algum anexo e tente novamente.");
      return false;
    }
    U.toast("Aluno salvo.");
    if (!a.id) location.hash = "#/aluno/" + salvo.id;
    else App.render();
  });
  Anexos.iniciar(a.termos, 5);
  Anexos.ligar();
}

Actions.novoAluno = () => abrirFormAluno({
  nome: "", nascimento: "", cpf: "", telefone: "", email: "",
  endereco: "", bairro: "", cidade: "", cep: "",
  responsavel: "", encaminhamento: "", atingidoEnchente: "", impactoEnchentes: "",
  rendaFamiliar: "", beneficios: "", moradiaAtual: "", necessidades: "", observacoes: "", termos: []
});

/* adiciona uma nova origem de encaminhamento sem fechar o formulário do aluno */
Actions.novoEncaminhamento = () => {
  const nome = prompt("Nova origem de encaminhamento (ex.: UBS, Igreja, Indicação):");
  if (!nome) return;
  const salvo = Store.addEncaminhamento(nome);
  if (!salvo) return;
  const sel = document.getElementById("fa-enc");
  if (sel) {
    sel.innerHTML = opcoesEncaminhamento(salvo);
    sel.value = salvo;
  }
  U.toast("Origem adicionada.");
};
Actions.editarAluno = id => abrirFormAluno(Store.get("alunos", id));
Actions.verAluno = id => { location.hash = "#/aluno/" + id; };
Actions.voltarAlunos = () => { location.hash = "#/alunos"; };
Actions.excluirAluno = id => {
  const a = Store.get("alunos", id);
  if (confirm(`Excluir o aluno "${a.nome}"?\nAs matrículas e presenças dele também serão removidas.`)) {
    Store.remover("alunos", id);
    U.toast("Aluno excluído.");
    location.hash = "#/alunos";
  }
};

Actions.matricular = alunoId => {
  const turmas = Store.col("turmas").filter(t => t.status !== "cancelada");
  if (!turmas.length) { U.toast("Cadastre uma turma antes de matricular."); return; }
  const jaMatriculado = new Set(Store.matriculasDoAluno(alunoId).map(m => m.turmaId));
  const opts = turmas.map(t => {
    const c = Store.get("cursos", t.cursoId);
    const marcado = jaMatriculado.has(t.id) ? " (já matriculado)" : "";
    const pago = c && c.tipoCurso === "pago" ? " — PAGO" : "";
    return `<option value="${t.id}" data-pago="${c && c.tipoCurso === "pago" ? "1" : ""}" ${jaMatriculado.has(t.id) ? "disabled" : ""}>${U.esc((c ? c.nome : "?") + " — " + t.nome + pago + marcado)}</option>`;
  }).join("");

  App.abrirModal("Matricular em turma", `
    <form>
      <div class="form-grid">
        <div class="field full">
          <label for="fm-turma">Turma</label>
          <select id="fm-turma" name="turmaId" required>${opts}</select>
        </div>
        <div class="field">
          <label for="fm-status">Status inicial</label>
          <select id="fm-status" name="status">
            <option value="cursando">cursando</option>
            <option value="concluido">concluído</option>
            <option value="trancado">trancado</option>
            <option value="desistente">desistente</option>
          </select>
        </div>
        <div class="field">
          <label for="fm-data">Data da matrícula</label>
          <input id="fm-data" name="data" type="date" value="${U.hojeISO()}">
        </div>
        <div class="field full" id="fm-bolsa-area" hidden>
          <label style="display:inline-flex; align-items:center; gap:8px; text-transform:none; font-size:0.86rem;">
            <input type="checkbox" name="bolsa" value="1"> Aluno bolsista (isento de pagamento neste curso)
          </label>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn ghost" data-modal-action="cancelar">Cancelar</button>
        <button type="submit" class="btn accent">Matricular</button>
      </div>
    </form>`, dados => {
    if (!dados.turmaId) return false;
    Store.upsert("matriculas", { alunoId, turmaId: dados.turmaId, status: dados.status, data: dados.data, bolsa: !!dados.bolsa });
    U.toast("Matrícula registrada.");
    App.render();
  });

  /* mostra a opção de bolsa apenas quando a turma escolhida é de curso pago */
  const selTurma = document.getElementById("fm-turma");
  const bolsaArea = document.getElementById("fm-bolsa-area");
  const atualizarBolsa = () => {
    bolsaArea.hidden = !selTurma.selectedOptions[0]?.dataset.pago;
    if (bolsaArea.hidden) bolsaArea.querySelector("input").checked = false;
  };
  selTurma.addEventListener("change", atualizarBolsa);
  atualizarBolsa();
};

Actions.editarMatricula = matId => {
  const m = Store.col("matriculas").find(x => x.id === matId);
  if (!m) return;
  const t = Store.get("turmas", m.turmaId);
  const c = t ? Store.get("cursos", t.cursoId) : null;
  const ehPago = c && c.tipoCurso === "pago";
  App.abrirModal("Alterar matrícula", `
    <form>
      <p style="margin:0 0 14px; font-size:0.88rem;">
        <span class="chip cor-${c ? c.corIndex : 8}">${U.esc(c ? c.nome : "curso removido")}</span>
        &nbsp;${U.esc(t ? t.nome : "")}
        ${ehPago ? `&nbsp;<span class="pill info">curso pago · ${U.moeda(c.valor)}${c.cobranca === "mensal" ? "/mês" : ""}</span>` : ""}
      </p>
      <div class="form-grid">
        <div class="field full">
          <label for="fem-status">Status</label>
          <select id="fem-status" name="status">
            ${["cursando", "concluido", "trancado", "desistente"].map(s =>
              `<option value="${s}" ${m.status === s ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </div>
        ${ehPago ? `
        <div class="field full">
          <label style="display:inline-flex; align-items:center; gap:8px; text-transform:none; font-size:0.86rem;">
            <input type="checkbox" name="bolsa" value="1" ${m.bolsa ? "checked" : ""}> Aluno bolsista (isento de pagamento neste curso)
          </label>
        </div>` : ""}
      </div>
      <div class="form-actions">
        <button type="button" class="btn danger" data-modal-action="removerMatricula" data-id="${m.id}">Remover matrícula</button>
        <button type="button" class="btn ghost" data-modal-action="cancelar">Cancelar</button>
        <button type="submit" class="btn accent">Salvar</button>
      </div>
    </form>`, dados => {
    Store.upsert("matriculas", { ...m, status: dados.status, bolsa: ehPago ? !!dados.bolsa : false });
    U.toast("Matrícula atualizada.");
    App.render();
  });
};

Actions.removerMatricula = matId => {
  if (confirm("Remover esta matrícula?")) {
    Store.remover("matriculas", matId);
    App.fecharModal();
    U.toast("Matrícula removida.");
    App.render();
  }
};
