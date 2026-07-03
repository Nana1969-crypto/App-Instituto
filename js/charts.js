/* Gráficos em SVG puro — sem bibliotecas externas (funciona offline e no
   Cloudflare). Rótulos e legendas diretas em todos, para a identidade nunca
   depender só da cor. */
"use strict";

const Charts = (() => {

  /* ---------- rosca / pizza ---------- */
  // dados: [{label, value, color}]
  function donut(dados, { espessura = 6, casa = "", subtitulo = "" } = {}) {
    const total = dados.reduce((s, d) => s + d.value, 0);
    if (!total) return `<div class="empty-note">Sem dados para exibir.</div>`;
    const gap = 0.8; // fenda entre fatias (de 100)
    let offset = 25; // começa no topo
    const arcos = dados.map(d => {
      const frac = (d.value / total) * 100;
      if (d.value <= 0) return "";
      const len = Math.max(0.5, frac - gap);
      const svg = `<circle cx="21" cy="21" r="15.9" fill="none" stroke="${d.color}" stroke-width="${espessura}"
        stroke-dasharray="${len} ${100 - len}" stroke-dashoffset="${offset}">
        <title>${escTitle(d.label)}: ${d.value} (${Math.round(frac)}%)</title></circle>`;
      offset -= frac;
      return svg;
    }).join("");

    const legenda = dados.map(d => {
      const frac = Math.round((d.value / total) * 100);
      return `<li>
        <span class="dot" style="background:${d.color}"></span>
        <span>${escTitle(d.label)}</span>
        <span class="n">${d.value}<span style="color:var(--text-muted); font-weight:600;"> · ${frac}%</span></span>
      </li>`;
    }).join("");

    return `
      <div class="donut-wrap">
        <svg class="donut" viewBox="0 0 42 42" role="img" aria-label="Gráfico de rosca">
          <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--surface-2)" stroke-width="${espessura}"></circle>
          ${arcos}
          <text x="21" y="20.6" text-anchor="middle" style="font-size:7px; font-weight:800; fill:var(--text);">${total}${casa}</text>
          ${subtitulo ? `<text x="21" y="26" text-anchor="middle" style="font-size:2.6px; fill:var(--text-muted); letter-spacing:0.08em;">${escTitle(subtitulo).toUpperCase()}</text>` : ""}
        </svg>
        <div class="legend" style="flex:1;"><ul>${legenda}</ul></div>
      </div>`;
  }

  /* ---------- barras horizontais ---------- */
  // dados: [{label, value, color}]  sufixo: ex. "%" ou ""
  function bars(dados, { sufixo = "", maxForcado = null } = {}) {
    if (!dados.length) return `<div class="empty-note">Sem dados para exibir.</div>`;
    const max = maxForcado || Math.max(1, ...dados.map(d => d.value));
    return `<div class="chart-bars">${dados.map(d => `
      <div class="bar-row">
        <span class="bar-label"><span class="dot" style="background:${d.color}"></span>${escTitle(d.label)}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width:${Math.round((d.value / max) * 100)}%; background:${d.color}"></div>
        </div>
        <span class="bar-count" style="color:${d.color}">${d.value}${sufixo}</span>
      </div>`).join("")}</div>`;
  }

  /* ---------- linha (evolução) ---------- */
  // pontos: [{rotulo, value 0-100}]  ref: linha de referência opcional (ex. 75)
  function line(pontos, { cor = "var(--p4)", ref = null, refLabel = "" } = {}) {
    if (pontos.length < 2) return `<div class="empty-note">São necessárias ao menos 2 aulas registradas para o gráfico de evolução.</div>`;
    const W = 320, H = 150, padL = 28, padR = 12, padT = 12, padB = 26;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const x = i => padL + (i / (pontos.length - 1)) * plotW;
    const y = v => padT + (1 - v / 100) * plotH;

    const grade = [0, 25, 50, 75, 100].map(v =>
      `<line x1="${padL}" y1="${y(v)}" x2="${W - padR}" y2="${y(v)}" stroke="var(--border)" stroke-width="0.5"></line>
       <text x="${padL - 5}" y="${y(v) + 2.5}" text-anchor="end" style="font-size:7px; fill:var(--text-muted);">${v}</text>`).join("");

    const refLine = ref != null ? `
      <line x1="${padL}" y1="${y(ref)}" x2="${W - padR}" y2="${y(ref)}" stroke="var(--danger)" stroke-width="1" stroke-dasharray="3 3"></line>
      <text x="${W - padR}" y="${y(ref) - 3}" text-anchor="end" style="font-size:7px; fill:var(--danger); font-weight:700;">${escTitle(refLabel)}</text>` : "";

    const linhaPontos = pontos.map((p, i) => `${x(i)},${y(p.value)}`).join(" ");
    const area = `${padL},${y(0)} ${linhaPontos} ${x(pontos.length - 1)},${y(0)}`;

    const marcas = pontos.map((p, i) => {
      const ultimo = i === pontos.length - 1;
      return `<circle cx="${x(i)}" cy="${y(p.value)}" r="${ultimo ? 3.2 : 2.4}" fill="${cor}" stroke="var(--surface)" stroke-width="1.2">
        <title>${escTitle(p.rotulo)}: ${p.value}%${p.total ? ` (${p.pres}/${p.total})` : ""}</title></circle>`;
    }).join("");

    // rótulos do eixo x: mostra alguns para não poluir
    const passo = Math.ceil(pontos.length / 6);
    const rotulos = pontos.map((p, i) =>
      (i % passo === 0 || i === pontos.length - 1)
        ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" style="font-size:6.5px; fill:var(--text-muted);">${escTitle(p.rotulo)}</text>`
        : "").join("");

    return `
      <div class="chart-line-wrap">
        <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de evolução da frequência" style="width:100%; height:auto;">
          ${grade}
          <polygon points="${area}" fill="${cor}" opacity="0.12"></polygon>
          <polyline points="${linhaPontos}" fill="none" stroke="${cor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline>
          ${refLine}
          ${marcas}
          ${rotulos}
        </svg>
      </div>`;
  }

  function escTitle(s) {
    return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* cores de apoio para categorias fora da paleta de cursos */
  const cor = {
    navy: "var(--navy-strong)", accent: "var(--accent)",
    good: "var(--good)", warn: "var(--warn)", danger: "var(--danger)",
    p: n => `var(--p${((n) % 8) + 1})`
  };
  const corCurso = c => c ? `var(--p${c.corIndex})` : "var(--p8)";

  return { donut, bars, line, cor, corCurso };
})();
