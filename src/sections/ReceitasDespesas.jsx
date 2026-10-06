import { SectionHead, useMediaQuery } from "../components/ui.jsx";
import { Bar, Doughnut, themed } from "../lib/charts.jsx";
import { brl } from "../lib/data.js";
import { useTheme } from "../lib/theme.jsx";

function RankList({ items, tone }) {
  const max = Math.max(1, ...items.map((i) => i.valor));
  return (
    <div className="flex flex-col gap-4">
      {items.map((it, i) => (
        <div key={it.nome}>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="rank-pos">{i + 1}</span>
            <span className="text-sm flex-1 min-w-0 leading-snug" style={{ color: "var(--text)" }}>{it.nome}</span>
            <span className="text-sm text-right flex-none">
              <b style={{ color: "var(--text)" }}>{brl(it.valor)}</b> <span className="tx-faint">· {it.pct}%</span>
            </span>
          </div>
          <div className="track" style={{ marginLeft: 42 }}>
            <div className={`fill ${tone}`} style={{ width: `${((it.valor / max) * 100).toFixed(1)}%` }}></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ReceitasDespesas({ R, D }) {
  const { theme } = useTheme();
  const isMobile = useMediaQuery("(max-width: 640px)");
  return (
    <>
      <section id="receitas" className="scroll-mt-24">
        <SectionHead index="02" eyebrow="Origem dos recursos" title="De onde vem o dinheiro" />
        <div className="flex flex-col gap-4">
          <div className="panel p-5">
            <h3 className="font-display font-semibold mb-1">Composição da arrecadação</h3>
            <p className="text-xs tx-faint mb-2">Participação de cada fonte no período filtrado</p>
            <div style={{ height: isMobile ? 380 : 420 }}>
              <Doughnut
                key={`rec-${theme}-${isMobile ? "m" : "d"}`}
                data={{
                  labels: R.map((i) => i.nome),
                  datasets: [
                    {
                      data: R.map((i) => +(i.valor / 1e9).toFixed(1)),
                      unit: "R$ bi",
                      backgroundColor: ["#10B981", "#0E7CB5", "#F59E0B", "#0E9F8A", "#F43F5E", "#D96C1E", "#64748B", "#65A30D", "#DB2777", "#4F46E5", "#B45309", "#9333EA", "#334155"],
                      borderColor: theme === "light" ? "#ffffff" : "#0F1D33",
                      borderWidth: 3,
                    },
                  ],
                }}
                options={themed(theme, {
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: "62%",
                  plugins: { legend: { position: isMobile ? "bottom" : "right" } },
                })}
              />
            </div>
          </div>
          <div className="panel p-5">
            <h3 className="font-display font-semibold mb-4">Ranking de fontes</h3>
            <RankList items={R} tone="" />
          </div>
        </div>
      </section>

      <section id="despesas" className="scroll-mt-24">
        <SectionHead
          index="03"
          eyebrow="Aplicação dos recursos"
          eyebrowColor="#F43F5E"
          title="Com o que se gasta"
        />
        <div className="panel p-5 sm:p-6">
          <h3 className="font-display font-semibold mb-1">
            Gasto por grupo <span className="text-xs font-body font-normal tx-faint">em R$ bilhões no período</span>
          </h3>
          <div style={{ height: 400 }} className="mt-2">
            <Bar
              key={`des-${theme}`}
              data={{
                labels: D.map((i) => i.nome),
                datasets: [{ data: D.map((i) => +(i.valor / 1e9).toFixed(1)), unit: "R$ bi", backgroundColor: "#F43F5E", hoverBackgroundColor: "#FB7185", borderRadius: 6 }],
              }}
              options={themed(theme, {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: "y",
                plugins: { legend: { display: false } },
                scales: { x: { title: { display: true, text: "R$ bi" } } },
              })}
            />
          </div>
        </div>
        <div className="panel p-5 mt-4">
          <h3 className="font-display font-semibold mb-4">Ranking de gastos</h3>
          <RankList items={D} tone="rose" />
        </div>
      </section>
    </>
  );
}
