import { useEffect, useState } from "react";

export const YEARS = [2022, 2023, 2024, 2025, 2026];
export const PODERES = ["Executivo", "Legislativo", "Judiciario", "MPU", "DPU"];
export const PODER_COR = {
  Executivo: "#38BDF8",
  Legislativo: "#A78BFA",
  Judiciario: "#D9A821",
  MPU: "#34D399",
  DPU: "#FB923C",
};
export const poderNome = (p) => (p === "Judiciario" ? "Judiciário" : p);

export const brl = (v) => {
  const a = Math.abs(v);
  if (a >= 1e12) return `R$ ${(v / 1e12).toFixed(2)} tri`;
  if (a >= 1e9) return `R$ ${(v / 1e9).toFixed(1)} bi`;
  return `R$ ${(v / 1e6).toFixed(0)} mi`;
};

const FILES = ["mensal", "anual", "receitas", "despesas", "poderes", "orgaos_todos"];

export function useData() {
  const [state, setState] = useState({ loading: true, error: null, data: null });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const base = `${import.meta.env.BASE_URL}data/`;
        const got = await Promise.all(
          FILES.map(async (f) => {
            const r = await fetch(`${base}${f}.json`);
            if (!r.ok) throw new Error(`HTTP ${r.status} em data/${f}.json`);
            return [f, await r.json()];
          })
        );
        if (alive) setState({ loading: false, error: null, data: Object.fromEntries(got) });
      } catch (e) {
        if (alive) setState({ loading: false, error: String(e?.message || e), data: null });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return state;
}

/** soma mensal filtrada por anos -> {rec, des, res, med} */
export function resumoMensal(mensal, anos) {
  const f = mensal.filter((r) => anos.has(new Date(r.mes).getFullYear()));
  const rec = f.reduce((t, r) => t + r.receita, 0);
  const des = f.reduce((t, r) => t + r.despesa, 0);
  return { rec, des, res: rec - des, med: des / Math.max(1, f.length), rows: f };
}

/** acumulado 12 meses */
export function acum12(rows) {
  const s = [...rows].sort((a, b) => a.mes.localeCompare(b.mes));
  return s.map((r, i) => {
    const w = s.slice(Math.max(0, i - 11), i + 1);
    const sum = (k) => w.reduce((t, x) => t + x[k], 0);
    return { ...r, receita: sum("receita"), despesa: sum("despesa"), resultado_primario: sum("resultado_primario") };
  });
}

/** agrega linhas detalhadas (receitas/despesas) por categoria no filtro de anos */
export function agregar(rows, key, anos) {
  const m = {};
  rows
    .filter((r) => anos.has(new Date(r.mes).getFullYear()))
    .forEach((r) => {
      m[r[key]] = (m[r[key]] || 0) + r.valor;
    });
  const tot = Object.values(m).reduce((a, b) => a + b, 0);
  return Object.entries(m)
    .map(([nome, valor]) => ({ nome, valor, pct: +((valor / Math.max(1, tot)) * 100).toFixed(1) }))
    .sort((a, b) => b.valor - a.valor);
}

/** orgaos SIOP: filtra anos+poderes, agrupa por código (nome mais recente) */
export function agregarOrgaos(todos, anos, poderes) {
  const por = {};
  todos
    .filter((r) => anos.has(r.ano) && poderes.has(r.poder))
    .forEach((r) => {
      const k = String(r.cod_orgao);
      const o = (por[k] = por[k] || { nome: r.orgao, anoNome: 0, poder: r.poder, valor: 0, empenhado: 0 });
      if (r.ano >= o.anoNome) {
        o.nome = r.orgao;
        o.anoNome = r.ano;
        o.poder = r.poder;
      }
      o.valor += r.pago;
      o.empenhado += r.empenhado;
    });
  const tot = Object.values(por).reduce((a, b) => a + b.valor, 0);
  return Object.values(por)
    .map((o) => ({ ...o, pct: +((o.valor / Math.max(1, tot)) * 100).toFixed(2) }))
    .sort((a, b) => b.valor - a.valor);
}
