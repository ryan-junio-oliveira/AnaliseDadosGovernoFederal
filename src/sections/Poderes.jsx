import { SectionHead, useMediaQuery } from "../components/ui.jsx";
import { Bar, themed } from "../lib/charts.jsx";
import { anoDe, brl, escalaParaValores } from "../lib/data.js";
import { paraReais, tickMoeda } from "../lib/moeda.js";
import { useTheme } from "../lib/theme.jsx";
import { useMemo } from "react";

export default function Poderes({ podm, anos, defl }) {
  const { theme } = useTheme();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const f = defl?.f || (() => 1);
  const pf = useMemo(() => podm.filter((r) => anos.has(anoDe(r.mes))).sort((a, b) => a.mes.localeCompare(b.mes)).map((r) => {
    const k = f(r.mes) || 1;
    return { ...r, legjud_mpudpu_custeio_capital: r.legjud_mpudpu_custeio_capital * k, despesa_total: r.despesa_total * k };
  }), [podm, anos, f, defl]);

  const pa = useMemo(() => {
    const pam = {};
    pf.forEach((r) => {
      const y = anoDe(r.mes);
    pam[y] = pam[y] || { ano: y, valor: 0, despesa: 0 };
      pam[y].valor += paraReais(r.legjud_mpudpu_custeio_capital);
      pam[y].despesa += paraReais(r.despesa_total);
    });
    return Object.values(pam).sort((a, b) => a.ano - b.ano);
  }, [pf]);

  const escMensal = useMemo(() => escalaParaValores(pf.map((r) => r.legjud_mpudpu_custeio_capital)), [pf]);
  const escAnual = useMemo(() => escalaParaValores(pa.map((a) => a.valor)), [pa]);

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
            Evolução mensal <span className="text-xs font-body font-normal tx-faint">barras {escMensal.rotulo} + participação na despesa total</span>
          </h3>
          <div style={{ height: isMobile ? 300 : 360 }} className="mt-2">
            <Bar
              key={`pod-${theme}-${isMobile ? "m" : "d"}-${escMensal.unidade}-${defl ? "real" : "nom"}`}
              type="bar"
              data={{
                labels: pf.map((r) => r.mes.slice(0, 7)),
                datasets: [
                  { type: "bar", label: "Custeio + capital", data: pf.map((r) => paraReais(r.legjud_mpudpu_custeio_capital) / escMensal.divisor), unit: escMensal.unidade, backgroundColor: "#D9A821", hoverBackgroundColor: "#F5D67B", borderRadius: 4 },
                  { type: "line", label: "% da despesa total", data: pf.map((r) => +r.participacao.toFixed(2)), unit: "%", borderColor: "#0E7CB5", borderWidth: 2, tension: 0.3, pointRadius: 0, yAxisID: "y1" },
                ],
              }}
              options={themed(theme, {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                scales: {
                  x: { ticks: { maxTicksLimit: isMobile ? 8 : 14, maxRotation: isMobile ? 45 : 0 } },
                  y: { title: { display: true, text: escMensal.unidade }, ticks: { callback: tickMoeda } },
                  y1: { position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "%" } },
                },
              })}
            />
          </div>
        </div>
        <div className="panel p-5">
          <h3 className="font-display font-semibold mb-1">
            Totais anuais <span className="text-xs font-body font-normal tx-faint">custeio + capital · {escAnual.rotulo}{defl ? ` · ${defl.rotulo}` : ""}</span>
          </h3>
          <div style={{ height: isMobile ? 280 : 360 }} className="mt-2">
            <Bar
              key={`podan-${theme}-${escAnual.unidade}-${defl ? "real" : "nom"}`}
              data={{
                labels: pa.map((a) => a.ano),
                datasets: [{ data: pa.map((a) => a.valor / escAnual.divisor), unit: escAnual.unidade, backgroundColor: "#D9A821", hoverBackgroundColor: "#F5D67B", borderRadius: 6 }],
              }}
              options={themed(theme, {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { title: { display: true, text: escAnual.unidade }, ticks: { callback: tickMoeda } } },
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
