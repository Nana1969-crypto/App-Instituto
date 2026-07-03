/* Camada de dados — localStorage.
   Estrutura pensada para migração futura a um banco (Cloudflare D1):
   cada coleção é uma "tabela" com ids, e as funções de consulta
   concentram as regras de negócio. */
"use strict";

const Store = (() => {
  const KEY = "bzn-painel-v1";

  const vazio = () => ({
    cursos: [],       // {id, nome, ementa, corIndex, status, modulos:[{nome, descricao, horas}]}
    professores: [],  // {id, nome, telefone, email, formacao, experiencia}
    turmas: [],       // {id, cursoId, professorId, nome, dataInicio, dataFim, horario, local, vagas, status}
    alunos: [],       // {id, nome, nascimento, cpf, telefone, email, endereco, bairro, cidade, cep,
                      //  responsavel, encaminhamento, impactoEnchentes, rendaFamiliar, beneficios,
                      //  moradiaAtual, necessidades, observacoes}
    matriculas: [],   // {id, alunoId, turmaId, status: cursando|concluido|trancado|desistente, data}
    chamadas: [],     // {id, turmaId, data, conteudo, presencas: {alunoId: true|false}}
    config: { presencaMinima: 75 }
  });

  let db = null;

  function carregar() {
    try {
      const raw = localStorage.getItem(KEY);
      db = raw ? Object.assign(vazio(), JSON.parse(raw)) : vazio();
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
      db = vazio();
    }
    if (db.cursos.length === 0 && !localStorage.getItem(KEY)) {
      seedCursos();
    }
  }

  function salvar() {
    localStorage.setItem(KEY, JSON.stringify(db));
  }

  /* Os 5 cursos iniciais do instituto */
  function seedCursos() {
    const nomes = [
      ["Empreendedorismo Resiliente", 1],
      ["Gestão Financeira para Empreendedores", 2],
      ["Social Media", 3],
      ["Educação Financeira", 4],
      ["Maquiagem Profissional", 5]
    ];
    db.cursos = nomes.map(([nome, corIndex]) => ({
      id: U.uid(), nome, ementa: "", corIndex, status: "ativo", modulos: []
    }));
    salvar();
  }

  /* ---------- CRUD genérico ---------- */
  const col = nome => db[nome];
  const get = (nome, id) => db[nome].find(x => x.id === id) || null;

  function upsert(nome, obj) {
    if (obj.id) {
      const i = db[nome].findIndex(x => x.id === obj.id);
      if (i >= 0) db[nome][i] = { ...db[nome][i], ...obj };
      else db[nome].push(obj);
    } else {
      obj.id = U.uid();
      db[nome].push(obj);
    }
    salvar();
    return obj;
  }

  function remover(nome, id) {
    db[nome] = db[nome].filter(x => x.id !== id);
    // integridade referencial simples
    if (nome === "cursos") {
      const turmasDoCurso = db.turmas.filter(t => t.cursoId === id).map(t => t.id);
      db.turmas = db.turmas.filter(t => t.cursoId !== id);
      db.matriculas = db.matriculas.filter(m => !turmasDoCurso.includes(m.turmaId));
      db.chamadas = db.chamadas.filter(c => !turmasDoCurso.includes(c.turmaId));
    }
    if (nome === "turmas") {
      db.matriculas = db.matriculas.filter(m => m.turmaId !== id);
      db.chamadas = db.chamadas.filter(c => c.turmaId !== id);
    }
    if (nome === "alunos") {
      db.matriculas = db.matriculas.filter(m => m.alunoId !== id);
      db.chamadas.forEach(c => { delete c.presencas[id]; });
    }
    if (nome === "professores") {
      db.turmas.forEach(t => { if (t.professorId === id) t.professorId = ""; });
    }
    salvar();
  }

  /* ---------- consultas de negócio ---------- */

  function cargaHoraria(curso) {
    return (curso.modulos || []).reduce((s, m) => s + (Number(m.horas) || 0), 0);
  }

  function matriculasDaTurma(turmaId) {
    return db.matriculas.filter(m => m.turmaId === turmaId);
  }

  function matriculasDoAluno(alunoId) {
    return db.matriculas.filter(m => m.alunoId === alunoId);
  }

  function cursoDaTurma(turmaId) {
    const t = get("turmas", turmaId);
    return t ? get("cursos", t.cursoId) : null;
  }

  /* cursos distintos que o aluno fez/faz (cruzamento de dados) */
  function cursosDoAluno(alunoId) {
    const ids = new Set();
    const out = [];
    for (const m of matriculasDoAluno(alunoId)) {
      const c = cursoDaTurma(m.turmaId);
      if (c && !ids.has(c.id)) { ids.add(c.id); out.push({ curso: c, matricula: m }); }
    }
    return out;
  }

  /* presença de um aluno numa turma: {presentes, total, pct} */
  function presencaAluno(turmaId, alunoId) {
    const cs = db.chamadas.filter(c => c.turmaId === turmaId && alunoId in c.presencas);
    const total = cs.length;
    const presentes = cs.filter(c => c.presencas[alunoId]).length;
    return { presentes, total, pct: total ? Math.round((presentes / total) * 100) : null };
  }

  function presencaMediaTurma(turmaId) {
    const ms = matriculasDaTurma(turmaId);
    const pcts = ms.map(m => presencaAluno(turmaId, m.alunoId).pct).filter(p => p !== null);
    if (!pcts.length) return null;
    return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
  }

  function presencaMediaGeral() {
    const pcts = db.turmas.map(t => presencaMediaTurma(t.id)).filter(p => p !== null);
    if (!pcts.length) return null;
    return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
  }

  /* alunos abaixo da frequência mínima em turmas em andamento */
  function alunosEmRisco() {
    const min = db.config.presencaMinima;
    const out = [];
    for (const t of db.turmas.filter(t => t.status === "em andamento")) {
      for (const m of matriculasDaTurma(t.id).filter(m => m.status === "cursando")) {
        const p = presencaAluno(t.id, m.alunoId);
        if (p.pct !== null && p.pct < min) {
          out.push({ aluno: get("alunos", m.alunoId), turma: t, curso: get("cursos", t.cursoId), pct: p.pct });
        }
      }
    }
    return out;
  }

  /* contagem de alunos (matrículas únicas por aluno) por curso */
  function alunosPorCurso() {
    return db.cursos.map(c => {
      const turmaIds = db.turmas.filter(t => t.cursoId === c.id).map(t => t.id);
      const alunos = new Set(db.matriculas.filter(m => turmaIds.includes(m.turmaId)).map(m => m.alunoId));
      return { curso: c, qtd: alunos.size };
    });
  }

  /* alunos com 2+ cursos distintos e combinações mais comuns */
  function cruzamento() {
    const multi = [];
    const combos = new Map();
    for (const a of db.alunos) {
      const cs = cursosDoAluno(a.id);
      if (cs.length >= 2) {
        multi.push({ aluno: a, cursos: cs });
        const nomes = cs.map(x => x.curso.nome).sort((x, y) => x.localeCompare(y, "pt-BR"));
        for (let i = 0; i < nomes.length; i++) {
          for (let j = i + 1; j < nomes.length; j++) {
            const k = nomes[i] + " + " + nomes[j];
            combos.set(k, (combos.get(k) || 0) + 1);
          }
        }
      }
    }
    multi.sort((x, y) => y.cursos.length - x.cursos.length);
    const combosOrd = [...combos.entries()].sort((a, b) => b[1] - a[1]);
    return { multi, combos: combosOrd };
  }

  function resumo() {
    const ativas = db.matriculas.filter(m => m.status === "cursando").length;
    const porStatus = { cursando: 0, concluido: 0, trancado: 0, desistente: 0 };
    db.matriculas.forEach(m => { if (m.status in porStatus) porStatus[m.status]++; });
    return {
      alunosUnicos: db.alunos.length,
      matriculasAtivas: ativas,
      totalMatriculas: db.matriculas.length,
      porStatus,
      presencaMedia: presencaMediaGeral(),
      cursosAtivos: db.cursos.filter(c => c.status === "ativo").length,
      turmasAndamento: db.turmas.filter(t => t.status === "em andamento").length
    };
  }

  /* ---------- backup ---------- */
  function exportarJSON() {
    return JSON.stringify(db, null, 2);
  }

  function importarJSON(texto) {
    const dados = JSON.parse(texto);
    if (!dados || !Array.isArray(dados.cursos) || !Array.isArray(dados.alunos)) {
      throw new Error("Arquivo não parece ser um backup válido do painel.");
    }
    db = Object.assign(vazio(), dados);
    salvar();
  }

  /* ---------- dados de demonstração ---------- */
  function carregarDemo() {
    const profs = [
      { nome: "Carlos Mendes", telefone: "(51) 99911-2233", email: "carlos@exemplo.com", formacao: "Administração", experiencia: "15 anos como consultor de negócios; ex-gestor do Sebrae regional." },
      { nome: "Fernanda Tavares", telefone: "(51) 99822-3344", email: "fernanda@exemplo.com", formacao: "Ciências Contábeis", experiencia: "Contadora, 9 anos de experiência com microempreendedores." },
      { nome: "Juliana Lopes", telefone: "(51) 99733-4455", email: "juliana@exemplo.com", formacao: "Publicidade e Propaganda", experiencia: "Estrategista digital, agência própria há 6 anos." }
    ].map(p => upsert("professores", p));

    const nomesAlunos = [
      "Maria da Silva Santos", "João Pedro Oliveira", "Ana Beatriz Costa",
      "Camila Rodrigues Farias", "Letícia Almeida Souza", "Rafael Nunes Barbosa",
      "Bruna Ferreira Lima", "Diego Martins Araújo", "Patrícia Gomes Ribeiro",
      "Lucas Cardoso Teixeira", "Juliana Mendes Rocha", "Gabriel Santos Pereira"
    ];
    const alunos = nomesAlunos.map((nome, i) => upsert("alunos", {
      nome,
      nascimento: `19${75 + i}-0${(i % 9) + 1}-1${i % 9}`,
      cpf: "", telefone: `(51) 9${8000 + i * 7}-${1000 + i * 11}`,
      email: nome.toLowerCase().split(" ")[0] + i + "@exemplo.com",
      endereco: `Rua Exemplo, ${100 + i}`, bairro: "Zona Norte", cidade: "Porto Alegre", cep: "",
      responsavel: "", encaminhamento: i % 3 === 0 ? "CRAS Zona Norte" : "",
      impactoEnchentes: i % 4 === 0 ? "Perdeu a moradia na enchente de 2024; realocada." : (i % 4 === 1 ? "Casa atingida, sem perdas totais." : ""),
      rendaFamiliar: "", beneficios: i % 3 === 0 ? "Bolsa Família" : "", moradiaAtual: "", necessidades: "", observacoes: ""
    }));

    const cursos = db.cursos;
    const turmas = [
      { cursoId: cursos[2].id, professorId: profs[2].id, nome: "Turma B", dataInicio: "2026-05-04", dataFim: "2026-08-28", horario: "Ter e Qui, 19h–21h", local: "Sala 2", vagas: 25, status: "em andamento" },
      { cursoId: cursos[0].id, professorId: profs[0].id, nome: "Turma A", dataInicio: "2026-04-06", dataFim: "2026-07-30", horario: "Seg e Qua, 19h–21h", local: "Sala 1", vagas: 30, status: "em andamento" },
      { cursoId: cursos[3].id, professorId: profs[1].id, nome: "Turma 1", dataInicio: "2026-02-02", dataFim: "2026-04-24", horario: "Sáb, 9h–12h", local: "Sala 1", vagas: 30, status: "concluída" },
      { cursoId: cursos[4].id, professorId: profs[2].id, nome: "Turma 1", dataInicio: "2026-03-02", dataFim: "2026-05-29", horario: "Sex, 14h–17h", local: "Sala 3", vagas: 20, status: "concluída" }
    ].map(t => upsert("turmas", t));

    const mat = (aluno, turma, status) => upsert("matriculas", { alunoId: aluno.id, turmaId: turma.id, status, data: turma.dataInicio });

    // trajetórias: alguns alunos fazem vários cursos
    mat(alunos[0], turmas[2], "concluido"); mat(alunos[0], turmas[3], "concluido"); mat(alunos[0], turmas[0], "cursando");
    mat(alunos[1], turmas[1], "cursando"); mat(alunos[1], turmas[2], "concluido");
    mat(alunos[2], turmas[0], "cursando"); mat(alunos[2], turmas[3], "concluido");
    [3, 4, 5, 6, 7].forEach(i => mat(alunos[i], turmas[0], "cursando"));
    [4, 8, 9].forEach(i => mat(alunos[i], turmas[1], "cursando"));
    [8, 10, 11].forEach(i => mat(alunos[i], turmas[2], "concluido"));
    mat(alunos[10], turmas[3], "concluido");
    mat(alunos[11], turmas[1], "trancado");

    // chamadas da turma de Social Media (índices pares = mais faltas p/ 5 e 7)
    const smAlunos = matriculasDaTurma(turmas[0].id).map(m => m.alunoId);
    for (let s = 0; s < 8; s++) {
      const d = new Date(2026, 4, 5 + s * 7);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const presencas = {};
      smAlunos.forEach(id => {
        const idx = alunos.findIndex(a => a.id === id);
        presencas[id] = !((idx === 5 && s % 2 === 0) || (idx === 7 && s % 3 === 0));
      });
      upsert("chamadas", { turmaId: turmas[0].id, data: iso, conteudo: `Encontro ${s + 1}`, presencas });
    }
    salvar();
  }

  function limparTudo() {
    db = vazio();
    seedCursos();
    salvar();
  }

  carregar();

  return {
    col, get, upsert, remover, salvar,
    cargaHoraria, matriculasDaTurma, matriculasDoAluno, cursoDaTurma, cursosDoAluno,
    presencaAluno, presencaMediaTurma, presencaMediaGeral, alunosEmRisco,
    alunosPorCurso, cruzamento, resumo,
    exportarJSON, importarJSON, carregarDemo, limparTudo,
    get config() { return db.config; }
  };
})();
