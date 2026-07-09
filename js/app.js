/* Roteador, navegação e modal */
"use strict";

const App = (() => {
  const rotas = {
    dashboard: () => Views.dashboard(),
    cursos: () => Views.cursos(),
    turmas: () => Views.turmas(),
    professores: sub => Views.professores(sub),
    alunos: () => Views.alunos(),
    aluno: id => Views.alunoDetalhe(id),
    chamada: id => Views.chamada(id),
    indicadores: sub => sub === "relatorios" ? Views.relatorios() : Views.graficos(),
    /* rotas antigas continuam funcionando */
    graficos: () => Views.graficos(),
    relatorios: () => Views.relatorios(),
    atendimentos: sub => Views.atendimentos(sub),
    paciente: id => Views.pacienteDetalhe(id),
    professor: () => Views.professorArea(),
    agenda: () => Views.agenda(),
    documentacao: sub => Views.documentacao(sub),
    financeiro: sub => Views.financeiro(sub),
    assistencia: sub => Views.assistencia(sub),
    assistido: id => Views.assistidoDetalhe(id),
    seguranca: () => Views.seguranca()
  };

  const CHAVE_NIVEL = "bzn-nivel";
  const nivel = () => sessionStorage.getItem(CHAVE_NIVEL) || "";

  /* permissões por nível. Hoje: admin e secretaria têm acesso completo
     (só o admin gerencia senhas/PINs). */
  function rotaPermitida() {
    const n = nivel();
    return n === "admin" || n === "secretaria";
  }

  function render() {
    const hash = location.hash.replace(/^#\//, "") || "dashboard";
    const [rota, param] = hash.split("/");
    const fn = rotas[rota] || rotas.dashboard;

    /* portão de entrada: sem login, só as áreas restritas de professor e
       profissional de saúde (que têm PIN próprio) */
    /* rotas com controle próprio: PIN de professor, de profissional e do financeiro */
    const rotaLivre = rota === "professor" ||
      (rota === "atendimentos" && param === "minha-area") ||
      rota === "financeiro" ||
      rota === "assistencia" || rota === "assistido";
    const btnSair = document.getElementById("btn-sair-sistema");
    if (!nivel() && !rotaLivre) {
      if (btnSair) btnSair.hidden = true;
      renderPortao();
      return;
    }
    if (btnSair) {
      btnSair.hidden = !nivel();
      btnSair.textContent = nivel() ? "Sair (" + ({ admin: "admin", secretaria: "secretaria" }[nivel()] || "") + ")" : "Sair";
    }
    const btnSeg = document.getElementById("btn-seguranca");
    if (btnSeg) btnSeg.hidden = nivel() !== "admin";

    document.querySelectorAll("#nav-tabs a").forEach(a => {
      const r = a.dataset.route;
      a.classList.toggle("active",
        r === rota ||
        (rota === "aluno" && r === "alunos") ||
        (rota === "paciente" && r === "atendimentos") ||
        (rota === "professor" && r === "professores") ||
        (rota === "assistido" && r === "assistencia") ||
        ((rota === "graficos" || rota === "relatorios") && r === "indicadores"));
    });
    document.getElementById("nav-tabs").classList.remove("open");

    const view = document.getElementById("view");
    view.innerHTML = fn(param) || "";
    view.querySelectorAll("[data-action]").forEach(el => {
      el.addEventListener("click", ev => {
        ev.stopPropagation();
        const { action, id } = el.dataset;
        if (Actions[action]) Actions[action](id, el);
      });
    });
    if (Views.aposRender) Views.aposRender(rota, param);
    window.scrollTo(0, 0);
  }

  /* ---------- portão de entrada (perfis: admin, secretaria, usuário) ---------- */
  function renderPortao() {
    document.querySelectorAll("#nav-tabs a").forEach(a => a.classList.remove("active"));
    const view = document.getElementById("view");
    const primeiraVez = !Store.temSenha("admin");

    view.innerHTML = `
      <div class="panel" style="max-width:440px; margin:40px auto 0;">
        <h3 style="margin-bottom:2px;">${primeiraVez ? "Bem-vindo! Crie a senha do administrador" : "Acesso restrito"}</h3>
        <p class="panel-sub">${primeiraVez
          ? "Esta é a senha principal do sistema. Só o administrador cria e troca as demais senhas."
          : "Escolha seu perfil e digite a senha."}</p>
        <div class="form-grid" style="grid-template-columns:1fr;">
          ${primeiraVez ? "" : `
          <div class="field">
            <label for="portao-perfil">Perfil</label>
            <select id="portao-perfil">
              <option value="admin">Administração</option>
              <option value="secretaria">Secretaria</option>
            </select>
          </div>`}
          <div class="field">
            <label for="portao-senha">${primeiraVez ? "Nova senha do administrador (mínimo 4 caracteres)" : "Senha"}</label>
            <input id="portao-senha" type="password" autocomplete="${primeiraVez ? "new-password" : "current-password"}">
          </div>
          ${primeiraVez ? `
          <div class="field">
            <label for="portao-confirma">Confirme a senha</label>
            <input id="portao-confirma" type="password" autocomplete="new-password">
          </div>
          <div class="field">
            <label for="portao-pergunta">Pergunta de segurança (obrigatória — protege a recuperação da senha)</label>
            <input id="portao-pergunta" placeholder="ex.: Qual o nome do seu primeiro cachorro?">
          </div>
          <div class="field">
            <label for="portao-resposta">Resposta secreta</label>
            <input id="portao-resposta" placeholder="só o administrador deve saber">
          </div>` : ""}
        </div>
        <div class="form-actions">
          <button class="btn accent" id="portao-entrar">${primeiraVez ? "Criar senha e entrar" : "Entrar"}</button>
        </div>
        <div style="margin-top:16px; padding-top:14px; border-top:1px solid var(--border); font-size:0.82rem; display:flex; flex-direction:column; gap:6px;">
          <a href="#/professor">&#128274; Sou professor — entrar com meu PIN</a>
          <a href="#/atendimentos/minha-area">&#128274; Sou profissional de saúde — entrar com meu PIN</a>
          <a href="#/assistencia">&#128274; Sou da assistência social — entrar com meu PIN</a>
          <a href="#/financeiro">&#128274; Sou gestor(a) financeiro(a) — entrar com meu PIN</a>
          ${primeiraVez ? "" : `<a href="#" id="portao-esqueci" style="color:var(--text-muted);">Esqueci a senha do administrador</a>`}
        </div>
      </div>`;

    const senha = document.getElementById("portao-senha");
    const aviso = msg => {
      const el = document.getElementById("toast");
      el.textContent = msg;
      el.hidden = false;
      setTimeout(() => { el.hidden = true; }, 2600);
    };
    const entrar = () => {
      const v = senha.value;
      if (primeiraVez) {
        const conf = document.getElementById("portao-confirma").value;
        const pergunta = document.getElementById("portao-pergunta").value.trim();
        const resposta = document.getElementById("portao-resposta").value.trim();
        if (v.length < 4) { alert("A senha deve ter pelo menos 4 caracteres."); return; }
        if (v !== conf) { alert("As senhas não conferem. Digite igual nos dois campos."); return; }
        if (!pergunta || !resposta) { alert("Cadastre a pergunta de segurança e a resposta.\nElas protegem a recuperação da senha — sem elas, qualquer pessoa poderia redefinir seu acesso."); return; }
        Store.definirSenha("admin", v);
        Store.definirPerguntaSeguranca(pergunta, resposta);
        sessionStorage.setItem(CHAVE_NIVEL, "admin");
        render();
        return;
      }
      const perfil = document.getElementById("portao-perfil").value;
      if (!Store.temSenha(perfil)) {
        alert("Este perfil ainda não tem senha cadastrada.\nPeça ao administrador para criar em Indicadores → Relatórios → Segurança.");
        return;
      }
      if (!Store.conferirSenha(perfil, v)) {
        senha.value = "";
        senha.focus();
        aviso("Senha incorreta.");
        return;
      }
      sessionStorage.setItem(CHAVE_NIVEL, perfil);
      render();
    };
    document.getElementById("portao-entrar").addEventListener("click", entrar);
    view.querySelectorAll("input").forEach(i =>
      i.addEventListener("keydown", ev => { if (ev.key === "Enter") entrar(); }));

    /* recuperação: redefine só a senha do admin, mantendo todos os dados.
       Só funciona neste computador (quem tem acesso físico já controla tudo). */
    const esqueci = document.getElementById("portao-esqueci");
    if (esqueci) esqueci.addEventListener("click", ev => {
      ev.preventDefault();
      /* a recuperação SÓ funciona com a pergunta de segurança — sem ela,
         não permitimos redefinir (evita que qualquer pessoa troque o acesso) */
      if (!Store.temPerguntaSeguranca()) {
        alert("A recuperação está bloqueada porque não há pergunta de segurança cadastrada.\n\nEntre com a sua senha e cadastre a pergunta em ⚙ Logins. Se realmente perdeu a senha, será preciso apoio técnico neste computador.");
        return;
      }
      const resp = prompt("Pergunta de segurança:\n\n" + Store.perguntaSeguranca());
      if (resp === null) return;
      if (!Store.conferirResposta(resp)) { alert("Resposta incorreta. A senha não foi alterada."); return; }
      const nova = prompt("Digite a NOVA senha do administrador (mínimo 4 caracteres):");
      if (nova === null) return;
      if (nova.trim().length < 4) { alert("A senha deve ter pelo menos 4 caracteres."); return; }
      const conf = prompt("Digite a nova senha de novo para confirmar:");
      if (nova !== conf) { alert("As senhas não conferem. Nada foi alterado."); return; }
      Store.definirSenha("admin", nova);
      sessionStorage.setItem(CHAVE_NIVEL, "admin");
      aviso("Senha do administrador redefinida.");
      render();
    });

    senha.focus();
    window.scrollTo(0, 0);
  }

  /* ---------- modal ---------- */
  const backdrop = document.getElementById("modal-backdrop");
  const modalBody = document.getElementById("modal-body");
  const modalTitle = document.getElementById("modal-title");

  function abrirModal(titulo, html, aoEnviar) {
    modalTitle.textContent = titulo;
    modalBody.innerHTML = html;
    backdrop.hidden = false;
    const form = modalBody.querySelector("form");
    if (form && aoEnviar) {
      form.addEventListener("submit", ev => {
        ev.preventDefault();
        const dados = Object.fromEntries(new FormData(form).entries());
        if (aoEnviar(dados, form) !== false) fecharModal();
      });
    }
    modalBody.querySelectorAll("[data-modal-action]").forEach(el => {
      el.addEventListener("click", () => {
        const a = el.dataset.modalAction;
        if (a === "cancelar") fecharModal();
        else if (Actions[a]) Actions[a](el.dataset.id, el);
      });
    });
    const primeiro = modalBody.querySelector("input, select, textarea");
    if (primeiro) primeiro.focus();
  }

  function fecharModal() {
    backdrop.hidden = true;
    modalBody.innerHTML = "";
  }

  document.getElementById("modal-close").addEventListener("click", fecharModal);
  backdrop.addEventListener("click", ev => { if (ev.target === backdrop) fecharModal(); });
  document.addEventListener("keydown", ev => { if (ev.key === "Escape" && !backdrop.hidden) fecharModal(); });

  document.getElementById("menu-btn").addEventListener("click", () => {
    document.getElementById("nav-tabs").classList.toggle("open");
  });

  const btnSeguranca = document.getElementById("btn-seguranca");
  if (btnSeguranca) btnSeguranca.addEventListener("click", () => { location.hash = "#/seguranca"; });

  const btnSairSistema = document.getElementById("btn-sair-sistema");
  if (btnSairSistema) {
    btnSairSistema.addEventListener("click", () => {
      sessionStorage.removeItem(CHAVE_NIVEL);
      location.hash = "#/dashboard";
      render();
    });
  }

  window.addEventListener("hashchange", render);
  window.addEventListener("DOMContentLoaded", render);

  return { render, abrirModal, fecharModal, nivel };
})();
