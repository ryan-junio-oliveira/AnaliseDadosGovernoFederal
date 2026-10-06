import { SectionHead, useMediaQuery } from "../components/ui.jsx";
import { Bar, themed } from "../lib/charts.jsx";
import { anoDe, brl } from "../lib/data.js";
import { useTheme } from "../lib/theme.jsx";
import { useMemo } from "react";

export default function Poderes({ podm, anos }) {
  const { theme } = useTheme();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const pf = useMemo(() => podm.filter((r) => anos.has(anoDe(r.mes))).sort((a, b) => a.mes.localeCompare(b.mes)), [podm, anos]);

  const pa = useMemo(() => {
    const pam = {};
    pf.forEach((r) => {
      const y = anoDe(r.mes);
    pam[y] = pam[y] || { ano: y, valor: 0, despesa: 0 };
      pam[y].valor += r.legjud_mpudpu_custeio_capital;
      pam[y].despesa += r.despesa_total;
    });
    return Object.values(pam).sort((a, b) => a.ano - b.ano);
  }, [pf]);

  return (
    <section id="poderes" className="scroll-mt-24">
      <SectionHead
        index="05"
        eyebrow="Outros Poderes"
        title="Legislativo, Judiciário, MPU e DPU"
      />
      <div className="panel p-5">
        <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
          <i className="fa-solid fa-triangle-exclamation mr-2"></i>
          <b>Leia o escopo:</b> o Tesouro publica esses gastos de forma <b>agregada</b> (RTN 4.3.12 — custeio e capital). O <b>pessoal do
          Legislativo/Judiciário está dentro de “Pessoal e Encargos”</b>, misturado com o Executivo. Para o custo <b>total por órgão</b> (Câmara,
          Senado, STF…), veja a seção <b>Órgãos</b> acima, alimentada pelo SIOP.
        </p>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        <div className="panel p-5">
          <h3 className="font-display font-semibold mb-1">
            Evolução mensal <span className="text-xs font-body font-normal tx-faint">barras em R$ bi + participação na despesa total</span>
          </h3>
          <div style={{ height: isMobile ? 300 : 360 }} className="mt-2">
            <Bar
              key={`pod-${theme}-${isMobile ? "m" : "d"}`}
              type="bar"
              data={{
                labels: pf.map((r) => r.mes.slice(0, 7)),
                datasets: [
                  { type: "bar", label: "Custeio + capital", data: pf.map((r) => r.legjud_mpudpu_custeio_capital / 1e9), unit: "R$ bi", backgroundColor: "#D9A821", hoverBackgroundColor: "#F5D67B", borderRadius: 4 },
                  { type: "line", label: "% da despesa total", data: pf.map((r) => +r.participacao.toFixed(2)), unit: "%", borderColor: "#0E7CB5", borderWidth: 2, tension: 0.3, pointRadius: 0, yAxisID: "y1" },
                ],
              }}
              options={themed(theme, {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                scales: {
                  x: { ticks: { maxTicksLimit: isMobile ? 8 : 14, maxRotation: isMobile ? 45 : 0 } },
                  y: { title: { display: true, text: "R$ bi" } },
                  y1: { position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "%" } },
                },
              })}
            />
          </div>
        </div>
        <div className="panel p-5">
          <h3 className="font-display font-semibold mb-1">
            Totais anuais <span className="text-xs font-body font-normal tx-faint">custeio + capital</span>
          </h3>
          <div style={{ height: isMobile ? 280 : 360 }} className="mt-2">
            <Bar
              key={`podan-${theme}`}
              data={{
                labels: pa.map((a) => a.ano),
                datasets: [{ data: pa.map((a) => +(a.valor / 1e9).toFixed(1)), unit: "R$ bi", backgroundColor: "#D9A821", hoverBackgroundColor: "#F5D67B", borderRadius: 6 }],
              }}
              options={themed(theme, {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { title: { display: true, text: "R$ bi" } } },
              })}
            />
          </div>
          <div className="text-sm tx-mut mt-3 flex flex-col gap-1.5">
            {pa.map((a) => (
              <div key={a.ano} className="flex justify-between gap-2 py-1.5 flex-wrap" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                <span className="font-display font-bold" style={{ color: "var(--text)" }}>{a.ano}</span>
                <span className="text-right">
                  <b style={{ color: "var(--text)" }}>{brl(a.valor)}</b> · {((a.valor / a.despesa) * 100).toFixed(2)}% da despesa total
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
