/* Relatórios: presença por turma, cruzamento de cursos, exportações e backup */
"use strict";

Views.relatorios = () => {
  const turmas = Store.col("turmas");
  const cruz = Store.cruzamento();
  const min = Store.config.presencaMinima;

  /* presença por turma */
  const blocosTurmas = turmas.map(t => {
    const c = Store.get("cursos", t.cursoId);
    const mats = Store.matriculasDaTurma(t.id);
    if (!mats.length) return "";
    const linhas = U.ordenarPorNome(
      mats.map(m => ({ m, aluno: Store.get("alunos", m.alunoId) })).filter(x => x.aluno),
      // ordena pelo nome do aluno
    ).sort((a, b) => a.aluno.nome.localeCompare(b.aluno.nome, "pt-BR"))
     .map(({ m, aluno }) => {
      const p = Store.presencaAluno(t.id, aluno.id);
      const cls = p.pct === null ? "info" : p.pct >= min ? "ok" : "bad";
      return `<tr>
        <td>${U.esc(aluno.nome)}</td>
        <td>${p.total ? `${p.presentes}/${p.total}` : "—"}</td>
        <td><span class="pill ${cls}">${p.pct !== null ? p.pct + "%" : "sem registros"}</span></td>
        <td>${U.esc(m.status)}</td>
      </tr>`;
    }).join("");
    const media = Store.presencaMediaTurma(t.id);
    return `
      <div class="panel">
        <h3><span class="chip cor-${c ? c.corIndex : 8}">${U.esc(c ? c.nome : "curso removido")}</span> ${U.esc(t.nome)}</h3>
        <p class="panel-sub">${U.fmtData(t.dataInicio)} – ${U.fmtData(t.dataFim)} · presença média: ${media !== null ? media + "%" : "—"} · status: ${U.esc(t.status)}</p>
        <div class="table-wrap"><table>
          <thead><tr><th>Aluno</th><th>Presenças</th><th>Frequência</th><th>Matrícula</th></tr></thead>
          <tbody>${linhas}</tbody>
        </table></div>
      </div>`;
  }).join("");

  /* cruzamento */
  const linhasCruz = cruz.multi.map(x => `
    <tr>
      <td>${U.esc(x.aluno.nome)}</td>
      <td>${x.cursos.length}</td>
      <td><div class="cross-chips">${x.cursos.map(y =>
        `<span class="chip cor-${y.curso.corIndex}">${U.esc(y.curso.nome)}</span>`).join("")}</div></td>
    </tr>`).join("");

  const linhasCombos = cruz.combos.slice(0, 8).map(([combo, qtd]) => `
    <tr><td>${U.esc(combo)}</td><td style="font-weight:700">${qtd}</td></tr>`).join("");

  return `
    <div class="page-head">
      <div>
        <h2>Relatórios</h2>
        <p>Relatório de presença por turma, cruzamento de cursos por aluno, exportações e backup dos dados.</p>
      </div>
      <div class="head-actions">
        <button class="btn ghost" data-action="imprimir">Imprimir / PDF</button>
      </div>
    </div>

    <div class="panel">
      <h3>Exportar planilhas (CSV — abre no Excel)</h3>
      <p class="panel-sub">Arquivos com ponto e vírgula, prontos para prestação de contas</p>
      <div class="head-actions">
        <button class="btn" data-action="csvAlunos">Alunos (cadastro completo)</button>
        <button class="btn" data-action="csvPresenca">Presenças por turma</button>
        <button class="btn" data-action="csvCruzamento">Cursos por aluno</button>
      </div>
    </div>

    <div class="grid-2">
      <div class="panel">
        <h3>Alunos com mais de um curso</h3>
        <p class="panel-sub">Cruzamento de dados: trajetória de formação de cada aluno</p>
        ${cruz.multi.length ? `
        <div class="table-wrap"><table>
          <thead><tr><th>Aluno</th><th>Nº de cursos</th><th>Cursos</th></tr></thead>
          <tbody>${linhasCruz}</tbody>
        </table></div>` : `<div class="empty-note">Nenhum aluno com mais de um curso ainda.</div>`}
      </div>
      <div class="panel">
        <h3>Combinações mais comuns</h3>
        <p class="panel-sub">Pares de cursos feitos pelas mesmas pessoas</p>
        ${cruz.combos.length ? `
        <div class="table-wrap"><table>
          <thead><tr><th>Combinação</th><th>Alunos</th></tr></thead>
          <tbody>${linhasCombos}</tbody>
        </table></div>` : `<div class="empty-note">Ainda não há combinações registradas.</div>`}
      </div>
    </div>

    ${blocosTurmas || `<div class="panel"><div class="empty-note">Nenhuma turma com matrículas para gerar relatório de presença.</div></div>`}

    <div class="panel">
      <h3>Backup dos dados</h3>
      <p class="panel-sub">Os dados ficam salvos neste navegador. Exporte o backup com frequência e guarde o arquivo em local seguro (contém dados pessoais — LGPD).</p>
      <div class="head-actions">
        <button class="btn" data-action="backupExportar">Exportar backup (.json)</button>
        <button class="btn ghost" data-action="backupImportar">Importar backup</button>
        <input type="file" id="arquivo-backup" accept=".json,application/json" hidden>
        <button class="btn danger" data-action="apagarTudo">Apagar todos os dados</button>
      </div>
    </div>
  `;
};

/* ---------- exportações ---------- */

Actions.imprimir = () => window.print();

Actions.csvAlunos = () => {
  const cab = ["Nome", "Nascimento", "CPF", "Telefone", "E-mail", "Endereço", "Bairro", "Cidade", "CEP",
    "Responsável", "Encaminhamento", "Atingido pelas enchentes", "Impacto das enchentes", "Renda familiar", "Benefícios",
    "Moradia atual", "Necessidades", "Condição", "Observações", "Cursos que fez"];
  const linhas = U.ordenarPorNome(Store.col("alunos")).map(a => U.linhaCSV([
    a.nome, U.fmtData(a.nascimento), a.cpf, a.telefone, a.email, a.endereco, a.bairro, a.cidade, a.cep,
    a.responsavel, a.encaminhamento,
    a.atingidoEnchente === "sim" ? "Sim" : a.atingidoEnchente === "nao" ? "Não" : "",
    a.impactoEnchentes, a.rendaFamiliar, a.beneficios,
    a.moradiaAtual, a.necessidades,
    { gratuito: "Gratuito", bolsista: "Bolsista", pagante: "Pagante" }[Store.condicaoAluno(a.id)],
    a.observacoes,
    Store.cursosDoAluno(a.id).map(x => x.curso.nome).join(" + ")
  ]));
  U.baixarArquivo("alunos-instituto-bzn.csv", "﻿" + [U.linhaCSV(cab), ...linhas].join("\n"), "text/csv;charset=utf-8");
  U.toast("Planilha de alunos exportada.");
};

Actions.csvPresenca = () => {
  const cab = ["Curso", "Turma", "Aluno", "Presenças", "Aulas", "Frequência %", "Status da matrícula"];
  const linhas = [];
  for (const t of Store.col("turmas")) {
    const c = Store.get("cursos", t.cursoId);
    for (const m of Store.matriculasDaTurma(t.id)) {
      const a = Store.get("alunos", m.alunoId);
      if (!a) continue;
      const p = Store.presencaAluno(t.id, a.id);
      linhas.push(U.linhaCSV([c ? c.nome : "", t.nome, a.nome, p.presentes, p.total, p.pct !== null ? p.pct : "", m.status]));
    }
  }
  U.baixarArquivo("presencas-instituto-bzn.csv", "﻿" + [U.linhaCSV(cab), ...linhas].join("\n"), "text/csv;charset=utf-8");
  U.toast("Planilha de presenças exportada.");
};

Actions.csvCruzamento = () => {
  const cab = ["Aluno", "Nº de cursos", "Cursos"];
  const linhas = U.ordenarPorNome(Store.col("alunos")).map(a => {
    const cs = Store.cursosDoAluno(a.id);
    return U.linhaCSV([a.nome, cs.length, cs.map(x => x.curso.nome).join(" + ")]);
  });
  U.baixarArquivo("cursos-por-aluno-instituto-bzn.csv", "﻿" + [U.linhaCSV(cab), ...linhas].join("\n"), "text/csv;charset=utf-8");
  U.toast("Planilha de cruzamento exportada.");
};

/* ---------- backup ---------- */

Actions.backupExportar = () => {
  U.baixarArquivo(`backup-instituto-bzn-${U.hojeISO()}.json`, Store.exportarJSON(), "application/json");
  U.toast("Backup exportado. Guarde o arquivo em local seguro.");
};

Actions.backupImportar = () => {
  const input = document.getElementById("arquivo-backup");
  input.onchange = () => {
    const arq = input.files[0];
    if (!arq) return;
    const leitor = new FileReader();
    leitor.onload = () => {
      try {
        if (!confirm("Importar este backup?\nOs dados atuais serão substituídos pelos do arquivo.")) return;
        Store.importarJSON(leitor.result);
        U.toast("Backup importado.");
        App.render();
      } catch (e) {
        alert("Não foi possível importar: " + e.message);
      }
      input.value = "";
    };
    leitor.readAsText(arq);
  };
  input.click();
};

Actions.apagarTudo = () => {
  if (confirm("Apagar TODOS os dados deste navegador?\nEssa ação não pode ser desfeita. Exporte um backup antes, se precisar.")) {
    if (confirm("Tem certeza? Alunos, turmas, chamadas e matrículas serão apagados.")) {
      Store.limparTudo();
      U.toast("Dados apagados. Cursos padrão recriados.");
      App.render();
    }
  }
};
