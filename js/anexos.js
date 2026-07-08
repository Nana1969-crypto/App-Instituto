/* Helper compartilhado de anexos (PDFs, imagens e outros arquivos).
   Usado nos formulários de alunos, pacientes e profissionais de saúde.
   Mantém os arquivos como dataURL — bom para PDFs de termos e comprovantes;
   arquivos muito grandes são recusados para não estourar o navegador. */
"use strict";

const Anexos = (() => {
  let atual = [];
  let max = 5;
  const LIMITE_MB = 2;

  function iniciar(lista, maximo) {
    atual = Array.isArray(lista) ? lista.map(a => ({ ...a })) : [];
    max = maximo || 5;
  }
  function lista() { return atual.slice(0, max); }

  function campoHTML(rotulo, dica) {
    return `
      <div class="form-section">${rotulo}</div>
      <div class="full">
        ${dica ? `<p style="font-size:0.78rem; color:var(--text-muted); margin:0 0 8px;">${dica}</p>` : ""}
        <div id="anx-lista" class="cross-chips"></div>
        <div style="display:flex; gap:10px; align-items:center; margin-top:8px;">
          <button type="button" class="btn ghost sm" data-modal-action="anexosAdd">+ Anexar arquivo</button>
          <span id="anx-cont" style="font-size:0.78rem; color:var(--text-muted);"></span>
        </div>
        <input type="file" id="anx-input" accept="application/pdf,image/*" multiple hidden>
      </div>`;
  }

  function render() {
    const el = document.getElementById("anx-lista");
    const cont = document.getElementById("anx-cont");
    if (!el) return;
    el.innerHTML = atual.map((a, i) => `
      <span class="chip">${a.dataUrl && a.dataUrl.startsWith("data:image") ? "&#128247;" : "&#128196;"} ${U.esc(a.nome)}
        <button type="button" class="icon-btn anx-rem" data-i="${i}" style="padding:0 2px;" title="Remover" aria-label="Remover">&#10005;</button>
      </span>`).join("");
    cont.textContent = `${atual.length} de ${max}`;
    el.querySelectorAll(".anx-rem").forEach(b => {
      b.onclick = () => { atual.splice(Number(b.dataset.i), 1); render(); };
    });
  }

  function ligar() {
    render();
    const input = document.getElementById("anx-input");
    if (!input) return;
    input.addEventListener("change", async () => {
      const arquivos = [...input.files];
      input.value = "";
      for (const arq of arquivos) {
        if (atual.length >= max) { U.toast(`Limite de ${max} arquivos atingido.`); break; }
        try {
          if (arq.type.startsWith("image/")) {
            atual.push({ nome: arq.name, dataUrl: await U.comprimirImagem(arq) });
          } else {
            if (arq.size > LIMITE_MB * 1024 * 1024) {
              alert(`"${arq.name}" tem mais de ${LIMITE_MB} MB.\nPara arquivos grandes, use a área Documentação com link (ex.: Google Drive).`);
              continue;
            }
            const dataUrl = await new Promise((res, rej) => {
              const r = new FileReader();
              r.onerror = () => rej(new Error("falha na leitura"));
              r.onload = () => res(r.result);
              r.readAsDataURL(arq);
            });
            atual.push({ nome: arq.name, dataUrl });
          }
        } catch (e) {
          alert(`"${arq.name}": ${e.message}`);
        }
      }
      render();
    });
  }

  /* chips clicáveis para baixar, usados nas fichas */
  function links(itens) {
    return (itens || []).map(a =>
      `<a class="chip" href="${a.dataUrl}" download="${U.esc(a.nome)}" style="text-decoration:none;">&#128196; ${U.esc(a.nome)}</a>`).join("");
  }

  return { iniciar, lista, campoHTML, render, ligar, links };
})();

Actions.anexosAdd = () => {
  const input = document.getElementById("anx-input");
  if (input) input.click();
};
