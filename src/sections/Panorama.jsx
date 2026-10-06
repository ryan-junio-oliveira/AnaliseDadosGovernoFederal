import { SectionHead, Seg, useMediaQuery } from "../components/ui.jsx";
import { acum12, anoDe, anualizar, brl, escalaParaValores } from "../lib/data.js";
import { tickMoeda } from "../lib/moeda.js";
import { Bar, themed } from "../lib/charts.jsx";
import { useTheme } from "../lib/theme.jsx";
import { useMemo } from "react";

export default function Panorama({ data, anos, modo, setModo, defl, bimestral, per = 1 }) {
  const { theme } = useTheme();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const f = defl?.f || (() => 1);
  const rows = useMemo(() => data.mensal.filter((r) => anos.has(anoDe(r.mes))), [data, anos]);
  const view = modo === "acum12"
    ? acum12(rows, f, per)
    : rows.map((r) => {
        const k = f(r.mes) || 1;
        return { ...r, receita: r.receita * k, despesa: r.despesa * k, resultado_primario: r.resultado_primario * k };
      });
  // Em modo real, o anual é recomposto do mensal deflacionado (soma de
  // nominais × fator único estaria errada); em nominal, usa anual.json.
  const an = useMemo(() => {
    if (!defl) return data.anual.filter((a) => anos.has(a.ano));
    return anualizar(rows.filter((r) => anos.has(anoDe(r.mes))), f);
  }, [data, anos, rows, defl, f]);
  const anosKey = [...anos].sort().join("");
  // Escalas dinâmicas: mensal (~bi), anual receita/despesa (~tri),
  // resultado anual (~bi, pode ser negativo). Eixo + tooltip mesma unidade.
  const escMensal = escalaParaValores([...view.map((r) => r.receita), ...view.map((r) => r.despesa), ...view.map((r) => r.resultado_primario)]);
  const escAnual = useMemo(() => escalaParaValores([...an.map((a) => a.receita), ...an.map((a) => a.despesa)]), [an]);
  const escRes = useMemo(() => escalaParaValores(an.map((a) => a.resultado_primario)), [an]);

  return (
    <section id="panorama" className="scroll-mt-24">
      <SectionHead index="01" eyebrow="Panorama fiscal" title="Receita, despesa e resultado mês a mês" />
      <div className="panel p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Seg active={modo === "mensal"} onClick={() => setModo("mensal")}>Mensal</Seg>
          <Seg active={modo === "acum12"} onClick={() => setModo("acum12")}>Acumulado 12 meses</Seg>
          {bimestral
            ? <span className="text-xs tx-faint ml-auto">série bimestral · RREO/SICONFI</span>
            : <span className="text-xs tx-faint ml-auto">Dezembro concentra 13º, precatórios e restos a pagar</span>}
        </div>
        <div style={{ height: isMobile ? 300 : 380 }}>
          <Bar
            key={`geral-${theme}-${modo}-${anosKey}-${defl ? "real" : "nom"}-${isMobile ? "m" : "d"}`}
            type="bar"
            data={{
              labels: view.map((r) => r.mes.slice(0, 7)),
              datasets: [
                { type: "line", label: "Arrecadação", data: view.map((r) => r.receita / escMensal.divisor), unit: escMensal.unidade, borderColor: "#10B981", borderWidth: 2.5, tension: 0.3, pointRadius: 0 },
                { type: "line", label: "Gastos", data: view.map((r) => r.despesa / escMensal.divisor), unit: escMensal.unidade, borderColor: "#F43F5E", borderWidth: 2.5, tension: 0.3, pointRadius: 0 },
                {
                  type: "bar",
                  label: "Resultado",
                  data: view.map((r) => r.resultado_primario / escMensal.divisor),
                  unit: escMensal.unidade,
                  backgroundColor: view.map((r) => (r.resultado_primario >= 0 ? "#10B98155" : "#F59E0B55")),
                  yAxisID: "y1",
                },
              ],
            }}
            options={themed(theme, {
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: "index", intersect: false },
              scales: {
                x: { ticks: { maxTicksLimit: isMobile ? 8 : 14, maxRotation: isMobile ? 45 : 0 } },
                y: { title: { display: true, text: escMensal.unidade }, ticks: { callback: tickMoeda } },
                y1: { position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: escMensal.unidade }, ticks: { callback: tickMoeda } },
              },
            })}
          />
        </div>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        <div className="panel p-5">
          <h3 className="font-display font-semibold">
            <i className="fa-solid fa-chart-column text-emerald-500 mr-2"></i>Totais anuais{" "}
            <span className="text-xs font-body font-normal tx-faint">{escAnual.rotulo}{defl ? ` · ${defl.rotulo}` : ""}</span>
          </h3>
          <div style={{ height: isMobile ? 280 : 340 }} className="mt-2">
            <Bar
              key={`anual-${theme}-${escAnual.unidade}-${defl ? "real" : "nom"}`}
              data={{
                labels: an.map((a) => a.ano),
                datasets: [
                  { label: "Receita", data: an.map((a) => a.receita / escAnual.divisor), unit: escAnual.unidade, backgroundColor: "#10B981", borderRadius: 6 },
                  { label: "Despesa", data: an.map((a) => a.despesa / escAnual.divisor), unit: escAnual.unidade, backgroundColor: "#F43F5E", borderRadius: 6 },
                ],
              }}
              options={themed(theme, {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { ticks: { maxRotation: isMobile ? 45 : 0 } },
                  y: { title: { display: true, text: escAnual.unidade }, ticks: { callback: tickMoeda } },
                },
              })}
            />
          </div>
        </div>
        <div className="panel p-5">
          <h3 className="font-display font-semibold">
            <i className="fa-solid fa-scale-balanced text-amber-500 mr-2"></i>Resultado primário por ano{" "}
            <span className="text-xs font-body font-normal tx-faint">{escRes.rotulo}{defl ? ` · ${defl.rotulo}` : ""}</span>
          </h3>
          <div style={{ height: isMobile ? 280 : 340 }} className="mt-2">
            <Bar
              key={`res-${theme}-${escRes.unidade}-${defl ? "real" : "nom"}`}
              data={{
                labels: an.map((a) => a.ano),
                datasets: [
                  {
                    data: an.map((a) => a.resultado_primario / escRes.divisor),
                    unit: escRes.unidade,
                    borderRadius: 6,
                    backgroundColor: an.map((a) => (a.resultado_primario >= 0 ? "#10B981" : "#F59E0B")),
                  },
                ],
              }}
              options={themed(theme, {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { title: { display: true, text: escRes.unidade }, ticks: { callback: tickMoeda } } },
              })}
            />
          </div>
          <div className="text-sm tx-mut mt-3 flex flex-col gap-1.5">
            {an.map((a) => (
              <div key={a.ano} className="flex justify-between gap-2 py-1.5 flex-wrap" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                <span className="font-display font-bold" style={{ color: "var(--text)" }}>{a.ano}</span>
                <span className="text-right">
                  {brl(a.receita)} arrecadados · {brl(a.despesa)} gastos ·{" "}
                  <b style={{ color: a.resultado_primario >= 0 ? "#10B981" : "#B98A12" }}>{brl(a.resultado_primario)}</b>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
