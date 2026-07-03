/* Roteador, navegação e modal */
"use strict";

const App = (() => {
  const rotas = {
    dashboard: () => Views.dashboard(),
    cursos: () => Views.cursos(),
    turmas: () => Views.turmas(),
    professores: () => Views.professores(),
    alunos: () => Views.alunos(),
    aluno: id => Views.alunoDetalhe(id),
    chamada: id => Views.chamada(id),
    relatorios: () => Views.relatorios()
  };

  function render() {
    const hash = location.hash.replace(/^#\//, "") || "dashboard";
    const [rota, param] = hash.split("/");
    const fn = rotas[rota] || rotas.dashboard;

    document.querySelectorAll("#nav-tabs a").forEach(a => {
      const r = a.dataset.route;
      a.classList.toggle("active", r === rota || (rota === "aluno" && r === "alunos"));
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

  window.addEventListener("hashchange", render);
  window.addEventListener("DOMContentLoaded", render);

  return { render, abrirModal, fecharModal };
})();
