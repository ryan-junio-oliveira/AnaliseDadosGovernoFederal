import { useEffect, useState } from "react";
import { ENTE_ATUAL, dataUrl } from "./entes.js";

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

export const brl = (v) => {
  if (!Number.isFinite(v)) return "—";
  const a = Math.abs(v);
  if (a >= 1e12) return `R$ ${(v / 1e12).toFixed(2)} tri`;
  if (a >= 1e9) return `R$ ${(v / 1e9).toFixed(1)} bi`;
  if (a >= 1e6) return `R$ ${(v / 1e6).toFixed(0)} mi`;
  return `R$ ${Math.round(v).toLocaleString("pt-BR")}`;
};

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
// Conjuntura e opcional: ETL separado; em falha, o painel segue sem ela.
const FILES_OPT = ["conj_mensal", "conj_dividas", "conj_desemprego", "conj_empresas", "conj_empresas_anual", "conj_ipos", "conj_crime"];

// Cache em memória por ente, evita refetch ao trocar de filtro/tema.
const cache = new Map();

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
          FILES.map(async (f) => [f, await fetchJson(dataUrl(ente, f), ctrl.signal)])
        );
        const opt = await Promise.all(
          FILES_OPT.map(async (f) => {
            try {
              return [f, await fetchJson(dataUrl(ente, f), ctrl.signal)];
            } catch {
              return [f, null]; // serie ausente: secao correspondente se oculta
            }
          })
        );
        const data = { ...Object.fromEntries(got), ...Object.fromEntries(opt) };
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

/** soma mensal filtrada por anos -> {rec, des, res, med} */
export function resumoMensal(mensal, anos) {
  let rec = 0,
    des = 0;
  const rows = [];
  for (const r of mensal) {
    if (!anos.has(anoDe(r.mes))) continue;
    rec += r.receita || 0;
    des += r.despesa || 0;
    rows.push(r);
  }
  rows.sort((a, b) => (a.mes < b.mes ? -1 : 1));
  return { rec, des, res: rec - des, med: des / Math.max(1, rows.length), rows };
}

/** acumulado 12 meses */
export function acum12(rows) {
  const s = [...rows].sort((a, b) => (a.mes < b.mes ? -1 : a.mes > b.mes ? 1 : 0));
  return s.map((r, i) => {
    const w = s.slice(Math.max(0, i - 11), i + 1);
    let rec = 0,
      des = 0,
      res = 0;
    for (const x of w) {
      rec += x.receita || 0;
      des += x.despesa || 0;
      res += x.resultado_primario || 0;
    }
    return { ...r, receita: rec, despesa: des, resultado_primario: res };
  });
}

/** agrega linhas detalhadas (receitas/despesas) por categoria no filtro de anos */
export function agregar(rows, key, anos) {
  const m = new Map();
  for (const r of rows) {
    if (!anos.has(anoDe(r.mes))) continue;
    m.set(r[key], (m.get(r[key]) || 0) + (r.valor || 0));
  }
  let tot = 0;
  for (const v of m.values()) tot += v;
  return [...m.entries()]
    .map(([nome, valor]) => ({ nome, valor, pct: +((valor / Math.max(1, tot)) * 100).toFixed(1) }))
    .sort((a, b) => b.valor - a.valor);
}

/** orgaos SIOP: filtra anos+poderes, agrupa por código (nome mais recente) */
export function agregarOrgaos(todos, anos, poderes) {
  const por = new Map();
  for (const r of todos) {
    if (!anos.has(r.ano) || !poderes.has(r.poder)) continue;
    const k = String(r.cod_orgao);
    let o = por.get(k);
    if (!o) {
      o = { cod: k, nome: r.orgao, anoNome: 0, poder: r.poder, valor: 0, empenhado: 0 };
      por.set(k, o);
    }
    if (r.ano >= o.anoNome) {
      o.nome = r.orgao;
      o.anoNome = r.ano;
      o.poder = r.poder;
    }
    o.valor += r.pago || 0;
    o.empenhado += r.empenhado || 0;
  }
  let tot = 0;
  for (const o of por.values()) tot += o.valor;
  return [...por.values()]
    .map((o) => ({ ...o, pct: +((o.valor / Math.max(1, tot)) * 100).toFixed(2) }))
    .sort((a, b) => b.valor - a.valor);
}

/** Bloco de 12 meses imediatamente anterior ao filtro (base do "vs"). */
export function comparativo(mensal, anos) {
  const f = mensal
    .filter((r) => anos.has(anoDe(r.mes)))
    .sort((a, b) => (a.mes < b.mes ? -1 : 1));
  if (!f.length) return null;
  const [y0, m0] = f[0].mes.slice(0, 7).split("-").map(Number);
  const base = new Date(y0, m0 - 1, 1);
  const alvos = new Set();
  for (let i = 1; i <= 12; i++) {
    const t = new Date(base.getFullYear(), base.getMonth() - i, 1);
    alvos.add(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`);
  }
  const prev = mensal.filter((r) => alvos.has(String(r.mes).slice(0, 7)));
  if (prev.length < 12) return null;
  const rec = prev.reduce((t, r) => t + (r.receita || 0), 0);
  const des = prev.reduce((t, r) => t + (r.despesa || 0), 0);
  const ys = [...new Set(prev.map((r) => anoDe(r.mes)))].sort((a, b) => a - b);
  return {
    rec, des, res: rec - des, med: des / 12,
    rotulo: ys.length > 1 ? `${ys[0]}–${ys[ys.length - 1]}` : `${ys[0]}`,
  };
}

/** Variação % vs base; null se base zerada (evita Infinito/NaN). */
export const varPct = (atual, base) =>
  base ? ((atual - base) / Math.abs(base)) * 100 : null;
