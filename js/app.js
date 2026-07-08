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
    documentacao: sub => Views.documentacao(sub)
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
    const rotaLivre = rota === "professor" || (rota === "atendimentos" && param === "minha-area");
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

    document.querySelectorAll("#nav-tabs a").forEach(a => {
      const r = a.dataset.route;
      a.classList.toggle("active",
        r === rota ||
        (rota === "aluno" && r === "alunos") ||
        (rota === "paciente" && r === "atendimentos") ||
        (rota === "professor" && r === "professores") ||
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
          </div>` : ""}
        </div>
        <div class="form-actions">
          <button class="btn accent" id="portao-entrar">${primeiraVez ? "Criar senha e entrar" : "Entrar"}</button>
        </div>
        <div style="margin-top:16px; padding-top:14px; border-top:1px solid var(--border); font-size:0.82rem; display:flex; flex-direction:column; gap:6px;">
          <a href="#/professor">&#128274; Sou professor — entrar com meu PIN</a>
          <a href="#/atendimentos/minha-area">&#128274; Sou profissional de saúde — entrar com meu PIN</a>
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
        if (v.length < 4) { alert("A senha deve ter pelo menos 4 caracteres."); return; }
        if (v !== conf) { alert("As senhas não conferem. Digite igual nos dois campos."); return; }
        Store.definirSenha("admin", v);
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
