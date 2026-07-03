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

  moeda(v) {
    const n = Number(v) || 0;
    return "R$ " + n.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  },

  plural(n, um, muitos) {
    return n === 1 ? um : muitos;
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
