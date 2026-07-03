/* Utilitários gerais */
"use strict";

/* Espaços globais preenchidos pelos arquivos de view e usados pelo roteador */
const Views = {};
const Actions = {};

const U = {
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },

  esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  },

  // "2026-07-03" -> "03/07/2026"
  fmtData(iso) {
    if (!iso) return "—";
    const [a, m, d] = String(iso).split("-");
    if (!a || !m || !d) return iso;
    return `${d}/${m}/${a}`;
  },

  hojeISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  },

  idade(nascISO) {
    if (!nascISO) return null;
    const n = new Date(nascISO + "T00:00:00");
    if (isNaN(n)) return null;
    const hoje = new Date();
    let i = hoje.getFullYear() - n.getFullYear();
    const m = hoje.getMonth() - n.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < n.getDate())) i--;
    return i;
  },

  iniciais(nome) {
    const p = String(nome || "").trim().split(/\s+/);
    if (!p[0]) return "?";
    return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  },

  ordenarPorNome(lista, campo = "nome") {
    return [...lista].sort((a, b) =>
      String(a[campo] || "").localeCompare(String(b[campo] || ""), "pt-BR", { sensitivity: "base" }));
  },

  pct(parte, total) {
    if (!total) return 0;
    return Math.round((parte / total) * 100);
  },

  /* hash simples para o PIN do profissional (organizacional, não criptografia forte) */
  hashPin(s) {
    let h = 5381;
    for (const c of String(s)) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0;
    return h.toString(36);
  },

  moeda(v) {
    const n = Number(v) || 0;
    return "R$ " + n.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  },

  plural(n, um, muitos) {
    return n === 1 ? um : muitos;
  },

  /* lê uma imagem do input e devolve dataURL comprimido (máx. 900px, JPEG),
     para caber no armazenamento do navegador */
  comprimirImagem(arquivo, maxLado = 900, qualidade = 0.72) {
    return new Promise((resolver, rejeitar) => {
      const leitor = new FileReader();
      leitor.onerror = () => rejeitar(new Error("Não foi possível ler a imagem."));
      leitor.onload = () => {
        const img = new Image();
        img.onerror = () => rejeitar(new Error("Arquivo não é uma imagem válida."));
        img.onload = () => {
          const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * escala);
          canvas.height = Math.round(img.height * escala);
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          resolver(canvas.toDataURL("image/jpeg", qualidade));
        };
        img.src = leitor.result;
      };
      leitor.readAsDataURL(arquivo);
    });
  },

  baixarArquivo(nome, conteudo, tipo) {
    const blob = new Blob([conteudo], { type: tipo || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  },

  linhaCSV(campos) {
    return campos.map(c => {
      const s = String(c ?? "");
      return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(";");
  },

  toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(U._toastTimer);
    U._toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
  }
};
