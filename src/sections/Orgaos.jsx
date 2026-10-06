import { SectionHead, Seg, useMediaQuery } from "../components/ui.jsx";
import { Bar, themed } from "../lib/charts.jsx";
import { PODERES, PODER_COR, agregarOrgaos, brl, poderNome } from "../lib/data.js";
import { useTheme } from "../lib/theme.jsx";
import { useMemo } from "react";

export default function Orgaos({ todos, anos, poderes, setPoderes }) {
  const { theme } = useTheme();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const poderesSet = useMemo(() => new Set(poderes), [poderes]);
  const OT = useMemo(() => agregarOrgaos(todos, anos, poderesSet), [todos, anos, poderesSet]);
  const TOP_N = isMobile ? 10 : 15;
  const TOP = useMemo(() => OT.slice(0, TOP_N), [OT, TOP_N]);
  const corta = (s) => {
    const lim = isMobile ? 22 : 34;
    return s.length > lim ? s.slice(0, lim - 1) + "…" : s;
  };

  const porPoder = useMemo(() => PODERES.map((p) => ({
    poder: p,
    valor: todos.filter((r) => anos.has(r.ano) && r.poder === p).reduce((a, b) => a + b.pago, 0),
  })), [todos, anos]);
  const maxTop = Math.max(1, TOP[0]?.valor || 1);

  return (
    <section id="orgaos" className="scroll-mt-24">
      <SectionHead
        index="05"
        eyebrow="Execução por órgão superior"
        title="Todos os órgãos: Executivo, Legislativo e Judiciário"
      />
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {PODERES.map((p) => (
          <Seg key={p} active={poderes.includes(p)} onClick={() => setPoderes((s) => (s.includes(p) ? (s.length > 1 ? s.filter((x) => x !== p) : s) : [...s, p]))}>
            <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: PODER_COR[p] }}></span>
            {poderNome(p)}
          </Seg>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {porPoder.map(({ poder, valor }) => (
          <div key={poder} className="panel p-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: PODER_COR[poder] }}></span>
              <p className="text-[11px] font-semibold tx-mut uppercase tracking-widest">{poderNome(poder)}</p>
            </div>
            <p className="font-display font-bold text-xl mt-1.5" style={{ color: PODER_COR[poder] }}>{brl(valor)}</p>
            <p className="text-[11px] tx-faint">pagos no período filtrado</p>
          </div>
        ))}
      </div>
      <div className="panel p-5 sm:p-6 mt-4">
        <h3 className="font-display font-semibold mb-1">
          Maiores executores <span className="text-xs font-body font-normal tx-faint">valores pagos no período filtrado, em R$ bi</span>
        </h3>
        <div style={{ height: isMobile ? 400 : 520 }} className="mt-2">
          <Bar
            key={`org-${theme}-${isMobile ? "m" : "d"}`}
            data={{
              labels: TOP.map((i) => corta(i.nome)),
              datasets: [{ data: TOP.map((i) => +(i.valor / 1e9).toFixed(1)), unit: "R$ bi", backgroundColor: TOP.map((i) => PODER_COR[i.poder] || "#0E7CB5"), borderRadius: 6 }],
            }}
            options={themed(theme, {
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: "y",
              plugins: { legend: { display: false } },
              scales: { x: { title: { display: true, text: "R$ bi pagos" } } },
            })}
          />
        </div>
      </div>
      <div className="panel p-5 mt-4">
        <h3 className="font-display font-semibold mb-1">Ranking completo por órgão superior</h3>
        <p className="text-xs tx-faint mb-4">Fonte: SIOP — execução orçamentária (pago). Inclui juros, amortização da dívida, transferências e operações de crédito.</p>
        <div className="flex flex-col gap-4">
          {OT.length === 0 && <p className="text-sm tx-faint">Nenhum órgão no filtro.</p>}
          {OT.map((it, i) => (
            <div key={it.cod ?? `${it.nome}-${i}`}>
              <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                <span className="rank-pos">{i + 1}</span>
                <span className="text-sm flex-1 min-w-[140px] leading-snug" style={{ color: "var(--text)" }}>{it.nome}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ color: PODER_COR[it.poder], border: `1px solid ${PODER_COR[it.poder]}55` }}>
                  {poderNome(it.poder)}
                </span>
                <span className="text-sm text-right">
                  <b style={{ color: "var(--text)" }}>{brl(it.valor)}</b> <span className="tx-faint">· {it.pct}%</span>
                </span>
              </div>
              <div className="track" style={{ marginLeft: 42 }}>
                <div className="fill" style={{ width: `${((it.valor / maxTop) * 100).toFixed(1)}%`, background: PODER_COR[it.poder] }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
