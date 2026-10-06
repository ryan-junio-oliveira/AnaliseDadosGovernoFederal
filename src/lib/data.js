import { useEffect, useState } from "react";
import { ENTE_ATUAL, dataUrl } from "./entes.js";
import { escalaParaValores, formatBRL, paraReais, serieGrafico } from "./moeda.js";

// Re-export: fonte única de verdade monetária (tri/bi/mi automáticos).
export { escalaParaValores, formatBRL, paraReais, serieGrafico };

/** Janela rolante: uma decada ate o ano corrente (espelha scripts/janela.py).
 *  Ex.: em 2026 -> 2016..2026; em 2027 -> 2017..2027, sem editar codigo. */
const ANO_FIM = new Date().getFullYear();
const ANO_INI = ANO_FIM - 10;
export const YEARS = Array.from({ length: ANO_FIM - ANO_INI + 1 }, (_, i) => ANO_INI + i);
export const PODERES = ["Executivo", "Legislativo", "Judiciario", "MPU", "DPU"];
export const PODER_COR = {
  Executivo: "#0E7CB5",
  Legislativo: "#7C5CBF",
  Judiciario: "#D9A821",
  MPU: "#0E9F6E",
  DPU: "#D96C1E",
};
export const poderNome = (p) => (p === "Judiciario" ? "Judiciário" : p);

export const brl = (v) => formatBRL(v);

/** Extrai ano de "YYYY-MM-DD" sem custo de new Date() em loops quentes. */
export const anoDe = (mes) =>
  typeof mes === "string" ? +mes.slice(0, 4) : new Date(mes).getFullYear();

const MES_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Anos com dados de fato (botoes de filtro seguem os dados, nao o calendario). */
export function anosComDados(mensal) {
  if (!mensal?.length) return YEARS;
  return [...new Set(mensal.map((r) => anoDe(r.mes)))].sort((a, b) => a - b);
}

/** Rotulos derivados dos dados: {anos: "2016–2026", periodo: "jan/2016 – dez/2026"}. */
export function intervaloDados(mensal) {
  if (!mensal?.length) return { anos: `${YEARS[0]}–${YEARS[YEARS.length - 1]}`, periodo: "—" };
  const ms = mensal.map((r) => String(r.mes).slice(0, 7)).sort();
  const [a0, m0] = ms[0].split("-").map(Number);
  const [a1, m1] = ms[ms.length - 1].split("-").map(Number);
  return {
    anos: `${a0}–${a1}`,
    periodo: `${MES_PT[m0 - 1]}/${a0} – ${MES_PT[m1 - 1]}/${a1}`,
  };
}

const FILES = ["mensal", "anual", "receitas", "despesas", "poderes", "orgaos_todos"];
// Opcional: IPCA/Selic/dólar/Ibovespa (seção Economia) + emendas + meta.
// Em falha, o painel segue sem eles.
const FILES_OPT = ["conj_mensal", "emendas", "meta"];
// Chaves de conjuntura nacional: UFs sem série própria herdam a da União
// (IPCA/Selic/dólar/Ibovespa são nacionais e alimentam a seção Economia).
const CONJ_NACIONAL = ["conj_mensal"];

// Cache em memória por ente, evita refetch ao trocar de filtro/tema.
const cache = new Map();

// Campos monetários por arquivo (tudo normalizado para REAIS via paraReais).
// Percentuais/índices (participacao, ipca, selic etc.) NÃO entram aqui.
const CAMPOS_MOEDA = {
  mensal: ["receita_total", "receita", "despesa", "resultado_primario"],
  anual: ["receita_total", "receita", "despesa", "resultado_primario"],
  receitas: ["valor"],
  despesas: ["valor"],
  poderes: ["legjud_mpudpu_custeio_capital", "despesa_total"],
  orgaos_todos: ["pago", "empenhado", "liquidado", "dotacao"],
  conj_ipos: ["volume"],
  conj_fiscal: ["primario", "juros", "nominal"],
  conj_dividas: ["dbgg_rs", "dlsp_rs"],
  emendas: ["pago", "empenhado", "liquidado", "dotacao"],
};

/**
 * Normaliza registros vindos de JSON/CSV para REAIS.
 * Aceita number, string pt-BR ("13.200,50"), string com escala ("13,2 tri",
 * "13.200 bi", "450 mi", "R$ 5 bilhões") — ver lib/moeda.js.
 * Idempotente para dados já em reais; imune a null/undefined/"".
 */
export function normalizarRegistros(nome, linhas, origem = "reais") {
  if (!Array.isArray(linhas)) return linhas;
  const campos = CAMPOS_MOEDA[nome];
  if (!campos) return linhas;
  for (const r of linhas) {
    if (!r || typeof r !== "object") continue;
    for (const c of campos) {
      // null/ausente = lacuna (preservado p/ o gráfico); só converte o presente
      if (c in r && r[c] != null && r[c] !== "") r[c] = paraReais(r[c], { origem });
    }
  }
  return linhas;
}

async function fetchJson(url, signal) {
  const r = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
  return r.json();
}

export function useData(ente = ENTE_ATUAL) {
  const [state, setState] = useState({ loading: true, error: null, data: null });

  useEffect(() => {
    const ctrl = new AbortController();
    let alive = true;
    (async () => {
      try {
        const key = ente.id;
        if (cache.has(key)) {
          if (alive) setState({ loading: false, error: null, data: cache.get(key) });
          return;
        }
        const got = await Promise.all(
          FILES.map(async (f) => [f, normalizarRegistros(f, await fetchJson(dataUrl(ente, f), ctrl.signal))])
        );
        const optFiles = ente.id === "uniao" ? FILES_OPT.filter((f) => f !== "meta") : FILES_OPT;
        const opt = await Promise.all(
          optFiles.map(async (f) => {
            try {
              return [f, normalizarRegistros(f, await fetchJson(dataUrl(ente, f), ctrl.signal))];
            } catch {
              return [f, null]; // serie ausente: secao correspondente se oculta
            }
          })
        );
        const data = { ...Object.fromEntries(got), ...Object.fromEntries(opt) };
        if (ente.id !== "uniao") {
          // UFs: herdam a conjuntura nacional quando não têm série própria.
          let uniConj = cache.get("uniao-conj");
          if (!uniConj) {
            uniConj = {};
            await Promise.all(
              CONJ_NACIONAL.map(async (f) => {
                try {
                  uniConj[f] = normalizarRegistros(f, await fetchJson(dataUrl(ENTE_ATUAL, f), ctrl.signal));
                } catch {
                  uniConj[f] = null;
                }
              })
            );
            cache.set("uniao-conj", uniConj);
          }
          for (const k of CONJ_NACIONAL) {
            const v = data[k];
            if ((!v || (Array.isArray(v) && !v.length)) && uniConj[k]) data[k] = uniConj[k];
          }
        }
        cache.set(key, data);
        if (alive) setState({ loading: false, error: null, data });
      } catch (e) {
        if (ctrl.signal.aborted || !alive) return;
        setState({ loading: false, error: String(e?.message || e), data: null });
      }
    })();
    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [ente.id]);

  return state;
}

/** soma mensal filtrada por anos -> {rec, des, res, med} (per autodetectado) */
export function resumoMensal(mensal, anos, f = IDENT, per = periodicidade(mensal)) {
  let rec = 0,
    des = 0;
  const rows = [];
  for (const r of mensal) {
    if (!anos.has(anoDe(r.mes))) continue;
    const k = f(r.mes) || 1;
    rec += (paraReais(r.receita) || 0) * k;
    des += (paraReais(r.despesa) || 0) * k;
    rows.push(r);
  }
  rows.sort((a, b) => (a.mes < b.mes ? -1 : 1));
  return { rec, des, res: rec - des, med: des / Math.max(1, rows.length * per), rows };
}

/** acumulado 12 meses (6 bimestres p/ UFs; deflaciona antes de acumular) */
export function acum12(rows, f = IDENT, per = periodicidade(rows)) {
  const jan = per === 2 ? 6 : 12;
  const s = [...rows].sort((a, b) => (a.mes < b.mes ? -1 : a.mes > b.mes ? 1 : 0));
  return s.map((r, i) => {
    const w = s.slice(Math.max(0, i - (jan - 1)), i + 1);
    let rec = 0,
      des = 0,
      res = 0;
    for (const x of w) {
      const k = f(x.mes) || 1;
      rec += (paraReais(x.receita) || 0) * k;
      des += (paraReais(x.despesa) || 0) * k;
      res += (paraReais(x.resultado_primario) || 0) * k;
    }
    return { ...r, receita: rec, despesa: des, resultado_primario: res };
  });
}

/** agrega linhas detalhadas (receitas/despesas) por categoria no filtro de anos */
export function agregar(rows, key, anos, f = IDENT) {
  const m = new Map();
  for (const r of rows) {
    if (!anos.has(anoDe(r.mes))) continue;
    m.set(r[key], (m.get(r[key]) || 0) + (paraReais(r.valor) || 0) * (f(r.mes) || 1));
  }
  let tot = 0;
  for (const v of m.values()) tot += v;
  return [...m.entries()]
    .map(([nome, valor]) => ({ nome, valor, pct: +((valor / Math.max(1, tot)) * 100).toFixed(1) }))
    .sort((a, b) => b.valor - a.valor);
}

/** orgaos SIOP: filtra anos+poderes, agrupa por código (fAno = fator anual p/ modo real) */
export function agregarOrgaos(todos, anos, poderes, fAno = IDENT) {
  const por = new Map();
  for (const r of todos) {
    if (!anos.has(r.ano) || !poderes.has(r.poder)) continue;
    const ck = String(r.cod_orgao);
    const def = fAno(r.ano) || 1;
    let o = por.get(ck);
    if (!o) {
      o = { cod: ck, nome: r.orgao, anoNome: 0, poder: r.poder, valor: 0, empenhado: 0 };
      por.set(ck, o);
    }
    if (r.ano >= o.anoNome) {
      o.nome = r.orgao;
      o.anoNome = r.ano;
      o.poder = r.poder;
    }
    o.valor += (paraReais(r.pago) || 0) * def;
    o.empenhado += (paraReais(r.empenhado) || 0) * def;
  }
  let tot = 0;
  for (const o of por.values()) tot += o.valor;
  return [...por.values()]
    .map((o) => ({ ...o, pct: +((o.valor / Math.max(1, tot)) * 100).toFixed(2) }))
    .sort((a, b) => b.valor - a.valor);
}

/** Bloco de 12 meses imediatamente anterior ao filtro (6 bimestres p/ UFs). */
export function comparativo(mensal, anos, f = IDENT, per = periodicidade(mensal)) {
  const jan = per === 2 ? 6 : 12;
  const ord = [...mensal].sort((a, b) => (String(a.mes) < String(b.mes) ? -1 : 1));
  const flt = ord.filter((r) => anos.has(anoDe(r.mes)));
  if (!flt.length) return null;
  const idx = ord.indexOf(flt[0]);
  const prev = ord.slice(Math.max(0, idx - jan), idx);
  if (prev.length < jan) return null;
  const rec = prev.reduce((t, r) => t + (paraReais(r.receita) || 0) * (f(r.mes) || 1), 0);
  const des = prev.reduce((t, r) => t + (paraReais(r.despesa) || 0) * (f(r.mes) || 1), 0);
  const ys = [...new Set(prev.map((r) => anoDe(r.mes)))].sort((a, b) => a - b);
  return {
    rec, des, res: rec - des, med: des / (jan * per),
    rotulo: ys.length > 1 ? `${ys[0]}–${ys[ys.length - 1]}` : `${ys[0]}`,
  };
}

/** Variação % vs base; null se base zerada (evita Infinito/NaN). */
export const varPct = (atual, base) =>
  base ? ((atual - base) / Math.abs(base)) * 100 : null;

const IDENT = () => 1;

/** Meses cobertos por ponto da série: 1 = mensal (União), 2 = bimestral (UFs/RREO). */
export function periodicidade(mensal) {
  return Array.isArray(mensal) && mensal.some((r) => r?.bimestre != null) ? 2 : 1;
}

/**
 * Deflator IPCA: converte valores nominais para R$ do mês-base (último mês
 * do filtro com IPCA conhecido). Construído sobre conj_mensal().ipca_m.
 * Retorna null se não houver IPCA (ex.: ente sem conjuntura) — o chamador
 * esconde o toggle e segue em nominal.
 *
 * @returns {{f:(mesISO)=>number, fAno:(ano)=>number, rotulo:string}|null
 */
export function construirDeflator(conjMensal, anosSet) {
  const pts = (conjMensal || [])
    .filter((r) => Number.isFinite(r.ipca_m))
    .sort((a, b) => (a.mes < b.mes ? -1 : 1));
  if (pts.length < 2) return null;
  const idx = new Map(); // "YYYY-MM" -> índice acumulado
  let acc = 100;
  for (const r of pts) {
    acc *= 1 + r.ipca_m / 100;
    idx.set(String(r.mes).slice(0, 7), acc);
  }
  const chaves = [...idx.keys()].sort();
  // base: último mês do filtro com índice; senão, último índice disponível
  let base = chaves[chaves.length - 1];
  if (anosSet?.size) {
    const candidatas = chaves.filter((k) => anosSet.has(+k.slice(0, 4)));
    if (candidatas.length) base = candidatas[candidatas.length - 1];
  }
  const idxBase = idx.get(base);
  const [ba, bm] = base.split("-").map(Number);
  const f = (mesISO) => {
    const k = String(mesISO || "").slice(0, 7);
    if (idx.has(k)) return idxBase / idx.get(k);
    // mês fora da série: usa o índice mais próximo (sem extrapolar)
    const prox = k < chaves[0] ? chaves[0] : chaves[chaves.length - 1];
    return idxBase / idx.get(prox);
  };
  const porAno = new Map();
  for (const k of chaves) {
    const a = +k.slice(0, 4);
    if (!porAno.has(a)) porAno.set(a, []);
    porAno.get(a).push(idxBase / idx.get(k));
  }
  const anosOrd = [...porAno.keys()].sort((a, b) => a - b);
  const fAno = (ano) => {
    if (porAno.has(ano)) {
      const v = porAno.get(ano);
      return v.reduce((t, x) => t + x, 0) / v.length;
    }
    const p = ano < anosOrd[0] ? anosOrd[0] : anosOrd[anosOrd.length - 1];
    const v = porAno.get(p);
    return v.reduce((t, x) => t + x, 0) / v.length;
  };
  return { f, fAno, rotulo: `R$ de ${MES_PT[bm - 1]}/${ba}`, base };
}

/** Recompõe totais anuais a partir do mensal (usado no modo real). */
export function anualizar(rows, f = IDENT) {
  const por = new Map();
  for (const r of rows || []) {
    const y = anoDe(r.mes);
    const k = f(r.mes) || 1;
    const a = por.get(y) || { ano: y, receita: 0, despesa: 0, resultado_primario: 0 };
    a.receita += (paraReais(r.receita) || 0) * k;
    a.despesa += (paraReais(r.despesa) || 0) * k;
    a.resultado_primario += (paraReais(r.resultado_primario) || 0) * k;
    por.set(y, a);
  }
  return [...por.values()].sort((a, b) => a.ano - b.ano);
}

/**
 * Faixa de cobertura de uma série: {n, ini, fim, rotulo, anos}.
 * Usada para separar visualmente os dados da década fiscal (2016–2026)
 * dos que têm cobertura menor (ex.: Serasa 2024–2026, Atlas 2023–2024).
 * Calcula-se sobre a base CHEIA (sem filtro de anos); o filtro só recorta.
 *
 * @param {object[]} linhas registros com campo de data
 * @param {"auto"|"mes"|"ano"|"tri"} campo "mes"=YYYY-MM-DD, "ano"=número, "tri"=AAAA-Tn
 */
export function cobertura(linhas, campo = "auto") {
  const vazia = { n: 0, ini: null, fim: null, rotulo: "sem dados", anos: new Set() };
  if (!Array.isArray(linhas) || !linhas.length) return vazia;
  let c = campo;
  if (c === "auto") {
    const r0 = linhas.find((r) => r && typeof r === "object") || {};
    c = r0.mes ? "mes" : r0.ano != null ? "ano" : r0.tri ? "tri" : "mes";
  }
  const rot = (v) => {
    if (c === "mes") {
      const s = String(v).slice(0, 7);
      const [a, m] = s.split("-").map(Number);
      if (Number.isFinite(a)) anos.add(a);
      return Number.isFinite(a) && Number.isFinite(m) && MES_PT[m - 1]
        ? `${MES_PT[m - 1]}/${a}` : s;
    }
    if (c === "ano") {
      const a = +v;
      if (Number.isFinite(a)) anos.add(a);
      return String(v);
    }
    const m = String(v).match(/(\d{4})-T([1-4])/);
    if (m) anos.add(+m[1]);
    else {
      const a = parseInt(String(v).slice(0, 4), 10);
      if (Number.isFinite(a)) anos.add(a);
    }
    return String(v);
  };
  const anos = new Set();
  const bruta = linhas.map((r) => r?.[c]).filter((v) => v != null && v !== "");
  if (!bruta.length) return vazia;
  for (const v of bruta) rot(v); // preenche `anos`
  const ord = [...bruta].sort((a, b) => (String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0));
  const ini = rot(ord[0]);
  const fim = rot(ord[ord.length - 1]);
  return { n: bruta.length, ini, fim, rotulo: ini === fim ? ini : `${ini} – ${fim}`, anos };
}
