/* Aba Gráficos: relatórios visuais (pizzas, roscas, barras e linha) */
"use strict";

let turmaEvolucao = "";

Views.graficos = () => {
  const r = Store.resumo();
  const temDados = r.totalMatriculas > 0 || Store.col("alunos").length > 0;

  if (!temDados) {
    return `
      <div class="page-head">
        <div><h2>Gráficos</h2><p>Relatórios visuais dos cursos, presença e perfil social dos alunos.</p></div>
        <div class="head-actions"><button class="btn ghost" data-action="carregarDemo">Carregar dados de exemplo</button></div>
      </div>
      <div class="panel"><div class="empty-note">Ainda não há dados para gerar gráficos.<br>Cadastre alunos e turmas, ou carregue os dados de exemplo.</div></div>`;
  }

  /* 1. alunos por curso (rosca) */
  const porCurso = Store.alunosPorCurso().filter(x => x.qtd > 0);
  const graf1 = Charts.donut(
    porCurso.map(x => ({ label: x.curso.nome, value: x.qtd, color: Charts.corCurso(x.curso) })),
    { subtitulo: "matrículas" }
  );

  /* 2. situação das matrículas (rosca) */
  const s = r.porStatus;
  const graf2 = Charts.donut([
    { label: "Cursando", value: s.cursando, color: "var(--p4)" },
    { label: "Concluído", value: s.concluido, color: "var(--good)" },
    { label: "Trancado", value: s.trancado, color: "var(--warn)" },
    { label: "Desistente", value: s.desistente, color: "var(--danger)" }
  ], { subtitulo: "matrículas" });

  /* 3. presença média por turma (barras) */
  const pt = Store.presencaPorTurma().filter(x => x.media !== null);
  const graf3 = pt.length
    ? Charts.bars(pt.map(x => ({
        label: `${x.curso ? x.curso.nome : "?"} · ${x.turma.nome}`,
        value: x.media,
        color: x.media < Store.config.presencaMinima ? "var(--danger)" : Charts.corCurso(x.curso)
      })), { sufixo: "%", maxForcado: 100 })
    : `<div class="empty-note">Nenhuma turma com chamadas registradas ainda.</div>`;

  /* 4. alunos por professor (barras) */
  const pp = Store.alunosPorProfessor().filter(x => x.qtd > 0);
  const graf4 = pp.length
    ? Charts.bars(pp.map((x, i) => ({ label: x.professor.nome, value: x.qtd, color: Charts.cor.p(i) })))
    : `<div class="empty-note">Nenhum professor com turmas e alunos ainda.</div>`;

  /* 5. evolução da frequência (linha) */
  const turmasComChamada = Store.col("turmas").filter(t => Store.evolucaoFrequencia(t.id).length >= 2);
  if (turmasComChamada.length && !turmasComChamada.some(t => t.id === turmaEvolucao)) {
    turmaEvolucao = turmasComChamada[0].id;
  }
  let graf5 = `<div class="empty-note">Registre pelo menos 2 chamadas numa turma para ver a evolução.</div>`;
  let seletorEvolucao = "";
  if (turmasComChamada.length) {
    const tsel = Store.get("turmas", turmaEvolucao);
    const csel = tsel ? Store.get("cursos", tsel.cursoId) : null;
    const pontos = Store.evolucaoFrequencia(turmaEvolucao).map(p => ({
      rotulo: U.fmtData(p.data).slice(0, 5), value: p.pct, pres: p.pres, total: p.total
    }));
    graf5 = Charts.line(pontos, {
      cor: Charts.corCurso(csel), ref: Store.config.presencaMinima, refLabel: `mínimo ${Store.config.presencaMinima}%`
    });
    seletorEvolucao = `
      <select id="sel-evolucao" class="search-input" style="min-width:auto;">
        ${turmasComChamada.map(t => {
          const c = Store.get("cursos", t.cursoId);
          return `<option value="${t.id}" ${t.id === turmaEvolucao ? "selected" : ""}>${U.esc((c ? c.nome : "?") + " · " + t.nome)}</option>`;
        }).join("")}
      </select>`;
  }

  /* 6. impacto das enchentes (rosca) */
  const ench = Store.porImpactoEnchente();
  const graf6 = Charts.donut([
    { label: "Atingidos", value: ench.sim, color: "var(--danger)" },
    { label: "Não atingidos", value: ench.nao, color: "var(--good)" },
    { label: "Não informado", value: ench.semInfo, color: "#A8A296" }
  ], { subtitulo: "alunos" });

  /* 7. encaminhamentos (barras) */
  const enc = Store.porEncaminhamento().filter(x => x.qtd > 0);
  const graf7 = enc.length
    ? Charts.bars(enc.map((x, i) => ({
        label: x.nome, value: x.qtd, color: x.semInfo ? "#B9B4A7" : Charts.cor.p(i)
      })))
    : `<div class="empty-note">Nenhum encaminhamento registrado ainda.</div>`;

  return `
    <div class="page-head">
      <div>
        <h2>Gráficos</h2>
        <p>Relatórios visuais dos cursos, presença e perfil social dos alunos. Passe o mouse sobre as fatias para ver os valores.</p>
      </div>
      <div class="head-actions">
        <button class="btn ghost" data-action="imprimir">Imprimir / PDF</button>
      </div>
    </div>

    <section class="grid-2-even">
      <div class="panel">
        <h3>Alunos por curso</h3>
        <p class="panel-sub">Proporção de matrículas em cada curso</p>
        ${graf1}
      </div>
      <div class="panel">
        <h3>Situação das matrículas</h3>
        <p class="panel-sub">Cursando, concluído, trancado e desistente</p>
        ${graf2}
      </div>
    </section>

    <section class="grid-2-even">
      <div class="panel">
        <h3>Presença média por turma</h3>
        <p class="panel-sub">Em vermelho, turmas abaixo do mínimo de ${Store.config.presencaMinima}%</p>
        ${graf3}
      </div>
      <div class="panel">
        <h3>Alunos por professor</h3>
        <p class="panel-sub">Total de alunos distintos por docente</p>
        ${graf4}
      </div>
    </section>

    <section class="panel">
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap;">
        <div>
          <h3>Evolução da frequência</h3>
          <p class="panel-sub">Percentual de presença aula a aula</p>
        </div>
        ${seletorEvolucao}
      </div>
      ${graf5}
    </section>

    <section class="grid-2-even">
      <div class="panel">
        <h3>Impacto das enchentes</h3>
        <p class="panel-sub">Alunos atingidos — dado social para prestação de contas</p>
        ${graf6}
      </div>
      <div class="panel">
        <h3>Origem dos encaminhamentos</h3>
        <p class="panel-sub">Como os alunos chegaram ao instituto</p>
        ${graf7}
      </div>
    </section>
  `;
};

/* seletor da turma no gráfico de evolução */
const aposRenderGraficos = Views.aposRender;
Views.aposRender = (rota, param) => {
  if (aposRenderGraficos) aposRenderGraficos(rota, param);
  if (rota !== "graficos") return;
  const sel = document.getElementById("sel-evolucao");
  if (sel) sel.addEventListener("change", () => { turmaEvolucao = sel.value; App.render(); });
};
