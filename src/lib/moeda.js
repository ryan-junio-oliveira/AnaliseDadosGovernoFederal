/**
 * moeda.js — tratamento central de valores monetários vindos de JSON/CSV.
 *
 * Problema que motivou: totais acumulados de vários anos passam de R$ 1 tri,
 * mas alguns gráficos dividiam por 1e9 com rótulo fixo "R$ bi" (ex.: 13.200 bi)
 * enquanto listas com `brl()` mostravam "R$ 13,20 tri" para o MESMO valor.
 * O número parecia diferente por causa da unidade.
 *
 * Regra única a partir daqui:
 *  - Dentro do app, todo valor monetário é normalizado para REAIS (R$).
 *  - Na exibição, a escala (tri/bi/mi) é escolhida PELO TAMANHO do dado,
 *    nunca fixa no código do gráfico. Gráfico + ranking + KPI do mesmo
 *    conjunto sempre usam a mesma unidade.
 */

// Multiplicadores canônicos -> reais
export const ESCALA_REAIS = {
  real: 1,
  reais: 1,
  "r$": 1,
  mil: 1e3,
  milhares: 1e3,
  k: 1e3,
  mi: 1e6,
  M: 1e6,
  milhoes: 1e6,
  "milhoes": 1e6,
  "milhão": 1e6,
  "milhoes_r$": 1e6,
  bi: 1e9,
  bilhoes: 1e9,
  "bilhoes_r$": 1e9,
  bn: 1e9,
  tri: 1e12,
  trilhoes: 1e12,
  tn: 1e12,
};

const SUFIXO_RE = /(trilh[õo]es?|trilhao|tri|bilh[õo]es?|bilhao|bi|bn|milh[õo]es?|milhao|mi\b|mil\b|k\b|m\b)/i;

function fold(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Converte sufixo textual em multiplicador para reais. Retorna null se desconhecido. */
export function multiplicadorDeEscala(sufixo) {
  if (sufixo == null) return null;
  const f = fold(sufixo).replace(/[.\s_$]+/g, "");
  if (!f) return null;
  if (/^tri/.test(f)) return 1e12;
  if (/^trilh/.test(f)) return 1e12;
  if (/^tn$/.test(f)) return 1e12;
  if (/^bi/.test(f) || /^bilh/.test(f) || f === "bn") return 1e9;
  if (/^mi/.test(f) || /^milh/.test(f) || f === "m") return 1e6;
  if (/^mil$/.test(f) || f === "k") return 1e3;
  if (f === "r$" || f === "r" || f === "real" || f === "reais") return 1;
  return null;
}

/**
 * Extrai a parte numérica de strings pt-BR ("13.200,50") ou en ("13,200.50").
 * Retorna NaN se não houver número.
 */
export function numeroDeTexto(texto) {
  if (typeof texto === "number") return texto;
  if (texto == null) return NaN;
  let s = String(texto).trim();
  if (!s) return NaN;
  // remove R$, espaços, NBSP
  s = s.replace(/R\$\s*/gi, "").replace(/\u00a0/g, "").replace(/\s+/g, "");
  // sinal preservado, resto: só dígitos, ponto, vírgula, menos
  const neg = s.startsWith("-");
  s = s.replace(/[^0-9.,]/g, "");
  if (!s) return NaN;
  const temPonto = s.includes(".");
  const temVirg = s.includes(",");
  let norm;
  if (temPonto && temVirg) {
    // o último separador é o decimal
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) norm = s.replace(/\./g, "").replace(",", ".");
    else norm = s.replace(/,/g, "");
  } else if (temVirg && !temPonto) {
    // "13,2" = 13.2 ; "13.200"? não — sem ponto, vírgula pode ser milhar ("13,200")
    const partes = s.split(",");
    if (partes.length === 2 && partes[1].length <= 2) norm = s.replace(",", ".");
    else if (partes.length === 2 && partes[1].length === 3 && partes[0].length <= 3) norm = s.replace(",", ""); // "13,200" -> 13200
    else norm = s.replace(",", ".");
  } else {
    // só ponto: "13.200" (pt-BR milhar) vs "13.2" (decimal)
    const partes = s.split(".");
    if (partes.length === 2 && partes[1].length === 3 && partes[0].length <= 4) norm = s.replace(/\./g, ""); // milhar pt-BR
    else norm = s; // decimal en ou inteiro
  }
  const n = parseFloat((neg ? "-" : "") + norm.replace(/^-/, ""));
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Converte QUALQUER valor vindo de JSON/CSV para REAIS (number).
 *
 * Aceita:
 *  - number (já em reais por padrão; use `origem` se vier em outra escala)
 *  - string numérica pt-BR/en: "13200000000", "13,2", "13.200,50"
 *  - string com unidade: "13,2 tri", "13.200 bi", "450 mi", "R$ 13,2 bilhões",
 *    "1.5bn", "900k"
 *  - null/undefined/"" -> 0 (neutro para somas; passe `vazioZero:false` p/ NaN)
 *
 * @param {*} valor
 * @param {object} opts { origem?: 'reais'|'mil'|'mi'|'bi'|'tri'|number, vazioZero?: boolean }
 */
export function paraReais(valor, opts = {}) {
  const { origem = "reais", vazioZero = true } = opts;
  if (valor == null || valor === "") return vazioZero ? 0 : NaN;
  if (typeof valor === "number") {
    if (!Number.isFinite(valor)) return vazioZero ? 0 : NaN;
    const mult = typeof origem === "number" ? origem : multiplicadorDeEscala(origem) ?? 1;
    return valor * mult;
  }
  if (typeof valor !== "string") {
    const n = Number(valor);
    if (Number.isFinite(n)) {
      const mult = typeof origem === "number" ? origem : multiplicadorDeEscala(origem) ?? 1;
      return n * mult;
    }
    return vazioZero ? 0 : NaN;
  }
  let s = String(valor).trim();
  if (!s) return vazioZero ? 0 : NaN;

  // separa sufixo de escala no fim ("13,2 tri", "13.200 bi", "R$ 5 milhões")
  const m = s.match(SUFIXO_RE);
  let mult = null;
  let numerica = s;
  if (m) {
    // garante que o sufixo está no fim (ignora "RFB - Demais/IR*" etc. sem número)
    const idx = s.toLowerCase().lastIndexOf(m[0].toLowerCase());
    const antes = s.slice(0, idx);
    const depois = s.slice(idx + m[0].length);
    if (/^[)\s.%]*$/.test(depois) && /[0-9]/.test(antes)) {
      mult = multiplicadorDeEscala(m[0]);
      numerica = antes;
    }
  }
  const n = numeroDeTexto(numerica);
  if (!Number.isFinite(n)) return vazioZero ? 0 : NaN;
  if (mult != null) return n * mult;
  const multOrigem = typeof origem === "number" ? origem : multiplicadorDeEscala(origem) ?? 1;
  return n * multOrigem;
}

/**
 * Normaliza um campo monetário de um registro (linha de JSON/CSV).
 * Útil no carregamento: `normalizarCampo(r, 'valor')` converte in-place-safe.
 */
export function normalizarCampo(registro, campo, opts) {
  if (registro && campo in registro) registro[campo] = paraReais(registro[campo], opts);
  return registro;
}

/**
 * Escolhe a melhor escala de exibição para um conjunto de valores (em reais).
 * Critério: maior valor absoluto do conjunto.
 *  >= 1 tri -> { divisor: 1e12, unidade: "R$ tri", curta: "tri" }
 *  >= 1 bi  -> { divisor: 1e9,  unidade: "R$ bi",  curta: "bi" }
 *  >= 1 mi  -> { divisor: 1e6,  unidade: "R$ mi",  curta: "mi" }
 *  senão    -> { divisor: 1,    unidade: "R$",     curta: "R$" }
 *
 * @param {number[]|number} valoresOuMax valores em reais ou o máximo já calculado
 */
export function escalaParaValores(valoresOuMax) {
  let max = 0;
  if (Array.isArray(valoresOuMax)) {
    for (const v of valoresOuMax) {
      const n = typeof v === "number" ? Math.abs(v) : Math.abs(paraReais(v));
      if (Number.isFinite(n) && n > max) max = n;
    }
  } else if (typeof valoresOuMax === "number" && Number.isFinite(valoresOuMax)) {
    max = Math.abs(valoresOuMax);
  }
  if (max >= 1e12) return { divisor: 1e12, unidade: "R$ tri", curta: "tri", rotulo: "em R$ trilhões" };
  if (max >= 1e9) return { divisor: 1e9, unidade: "R$ bi", curta: "bi", rotulo: "em R$ bilhões" };
  if (max >= 1e6) return { divisor: 1e6, unidade: "R$ mi", curta: "mi", rotulo: "em R$ milhões" };
  return { divisor: 1, unidade: "R$", curta: "R$", rotulo: "em R$" };
}

/** Formata valor em reais com unidade automática (tri/bi/mi). Substitui `brl` antigo. */
export function formatBRL(v, opts = {}) {
  const num = typeof v === "number" ? v : paraReais(v, { vazioZero: false });
  if (!Number.isFinite(num)) return "—";
  const a = Math.abs(num);
  if (a >= 1e12) return `R$ ${(num / 1e12).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} tri`;
  if (a >= 1e9) return `R$ ${(num / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} bi`;
  if (a >= 1e6) return `R$ ${(num / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`;
  if (opts.compacto && a >= 1e3) return `R$ ${(num / 1e3).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return `R$ ${Math.round(num).toLocaleString("pt-BR")}`;
}

/**
 * Prepara série para Chart.js com escala automática compartilhada.
 * @returns {{ dados:number[], divisor:number, unidade:string, rotulo:string, curta:string }}
 */
export function serieGrafico(valoresEmReais) {
  const reais = (valoresEmReais || []).map((v) => (typeof v === "number" ? v : paraReais(v)));
  const esc = escalaParaValores(reais);
  return { dados: reais.map((v) => v / esc.divisor), divisor: esc.divisor, unidade: esc.unidade, rotulo: esc.rotulo, curta: esc.curta };
}

/** Callback de ticks do Chart.js que respeita a escala (pt-BR). */
export function tickMoeda(v) {
  return Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

/**
 * Heurística de sanidade: detecta se uma série parece estar em escala errada.
 * Ex.: mensal receita federal ~ R$ 100–400 bi/mês. Se a média mensal estiver
 * abaixo de R$ 1 mi ou acima de R$ 100 tri, algo veio na escala errada.
 * Retorna null se ok, ou mensagem de alerta.
 */
export function alertaEscala(valoresEmReais, rotulo = "série") {
  const reais = (valoresEmReais || []).filter((v) => Number.isFinite(v) && v !== 0);
  if (!reais.length) return null;
  const media = reais.reduce((a, b) => a + b, 0) / reais.length;
  const a = Math.abs(media);
  if (a > 0 && a < 1e3) return `${rotulo}: média de R$ ${a.toFixed(2)} — suspeito: valores podem estar em outra escala (mil/milhões não convertidos?)`;
  return null;
}
