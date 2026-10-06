import { useEffect, useMemo, useState } from "react";
import { SectionHead, Seg } from "../components/ui.jsx";
import { Bar, themed } from "../lib/charts.jsx";
import { brl, escalaParaValores } from "../lib/data.js";
import { tickMoeda } from "../lib/moeda.js";
import { ENTES, dataUrl } from "../lib/entes.js";
import { useTheme } from "../lib/theme.jsx";

/**
 * Comparador entre entes com dados (União + UFs do SICONFI).
 * Carrega anual.json (+ meta.json p/ população) de cada ente disponível,
 * independente do ente selecionado no filtro global.
 */
export default function Comparar() {
  const { theme } = useTheme();
  const alvos = useMemo(() => ENTES.filter((e) => e.status === "disponivel"), []);
  const [linhas, setLinhas] = useState(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const todas = await Promise.all(
        alvos.map(async (e) => {
          try {
            const [anual, meta] = await Promise.all([
              fetch(dataUrl(e, "anual")).then((r) => (r.ok ? r.json() : [])),
              // meta.json só existe para UFs (evita 404 na União)
              e.id === "uniao"
                ? Promise.resolve(null)
                : fetch(dataUrl(e, "meta")).then((r) => (r.ok ? r.json() : null)).catch(() => null),
            ]);
            return { ente: e, anual: Array.isArray(anual) ? anual : [], pop: meta?.populacao_ref || null };
          } catch {
            return { ente: e, anual: [], pop: null };
          }
        })
      );
      if (vivo) setLinhas(todas);
    })();
    return () => {
      vivo = false;
    };
  }, [alvos]);

  const anosDisp = useMemo(() => {
    if (!linhas) return [];
    const s = new Set();
    linhas.forEach((l) => l.anual.forEach((a) => s.add(a.ano)));
    return [...s].sort((a, b) => a - b);
  }, [linhas]);
  // padrão: último ano completo (o ano corrente vem parcial)
  const [ano, setAno] = useState(null);
  const anoSel = ano ?? (anosDisp.length > 1 ? anosDisp[anosDisp.length - 2] : anosDisp[anosDisp.length - 1] ?? null);

  const rows = useMemo(() => {
    if (!linhas || anoSel == null) return [];
    return linhas
      .map((l) => {
        const a = l.anual.find((x) => x.ano === anoSel);
        if (!a) return null;
        return {
          ente: l.ente,
          receita: a.receita || 0,
          despesa: a.despesa || 0,
          resultado: (a.receita || 0) - (a.despesa || 0),
          pop: l.pop,
          recHab: l.pop ? (a.receita || 0) / l.pop : null,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.receita - a.receita);
  }, [linhas, anoSel]);

  const comPop = useMemo(() => rows.filter((r) => r.recHab != null).sort((a, b) => b.recHab - a.recHab), [rows]);
  const escHab = useMemo(() => escalaParaValores(comPop.map((r) => r.recHab)), [comPop]);

  return (
    <section id="comparar" className="scroll-mt-24">
      <SectionHead index="06" eyebrow="União × estados" title="Comparar entes" />
      {!linhas ? (
        <div className="panel p-6 text-sm tx-mut">Carregando entes…</div>
      ) : (
        <>
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            {anosDisp.map((a) => (
              <Seg key={a} active={a === anoSel} onClick={() => setAno(a)}>{a}</Seg>
            ))}
          </div>
          <div className="panel p-5 sm:p-6">
            <h3 className="font-display font-semibold mb-1">
              Receita por habitante <span className="text-xs font-body font-normal tx-faint">{anoSel} · {escHab.rotulo}</span>
            </h3>
            {comPop.length > 0 ? (
              <div style={{ height: Math.max(200, comPop.length * 52) }} className="mt-2">
                <Bar
                  key={`cmp-${theme}-${anoSel}`}
                  data={{
                    labels: comPop.map((r) => r.ente.sigla),
                    datasets: [{
                      data: comPop.map((r) => r.recHab / escHab.divisor),
                      unit: `${escHab.unidade}/hab`,
                      backgroundColor: "#0E7CB5",
                      borderRadius: 6,
                    }],
                  }}
                  options={themed(theme, {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: "y",
                    plugins: { legend: { display: false } },
                    scales: { x: { title: { display: true, text: `${escHab.unidade}/hab` }, ticks: { callback: tickMoeda } } },
                  })}
                />
              </div>
            ) : (
              <p className="text-sm tx-faint mt-2">Sem população de referência para o per capita neste ano.</p>
            )}
            <p className="text-xs tx-faint mt-3 leading-relaxed">
              População de referência da coleta (SICONFI/RREO) — aproximação, não IBGE do ano. A União não tem per capita aqui.
            </p>
          </div>
          <div className="panel p-5 sm:p-6 mt-4 overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-left text-[11px] tx-faint uppercase tracking-widest">
                  <th className="py-2 pr-3">Ente</th>
                  <th className="py-2 pr-3 text-right">Receita</th>
                  <th className="py-2 pr-3 text-right">Despesa</th>
                  <th className="py-2 pr-3 text-right">Resultado</th>
                  <th className="py-2 text-right">Receita/hab</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.ente.id} style={{ borderTop: "1px solid var(--border-soft)" }}>
                    <td className="py-2 pr-3 font-semibold" style={{ color: "var(--text)" }}>
                      {r.ente.sigla} <span className="font-normal tx-faint">· {r.ente.nome.split(" (")[0]}</span>
                    </td>
                    <td className="py-2 pr-3 text-right">{brl(r.receita)}</td>
                    <td className="py-2 pr-3 text-right">{brl(r.despesa)}</td>
                    <td className="py-2 pr-3 text-right" style={{ color: r.resultado >= 0 ? "#10B981" : "#F59E0B" }}>
                      {brl(r.resultado)}
                    </td>
                    <td className="py-2 text-right">
                      {r.recHab != null ? `R$ ${Math.round(r.recHab).toLocaleString("pt-BR")}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
