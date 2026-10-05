import { SectionHead, Seg } from "../components/ui.jsx";
import { acum12, brl } from "../lib/data.js";
import { Bar, themed } from "../lib/charts.jsx";
import { useTheme } from "../lib/theme.jsx";

export default function Panorama({ data, anos, modo, setModo }) {
  const { theme } = useTheme();
  const rows = data.mensal.filter((r) => anos.has(new Date(r.mes).getFullYear()));
  const view = modo === "acum12" ? acum12(rows) : [...rows].sort((a, b) => a.mes.localeCompare(b.mes));
  const an = data.anual.filter((a) => anos.has(a.ano));
  const anosKey = [...anos].sort().join("");

  return (
    <section id="panorama" className="scroll-mt-24">
      <SectionHead icon="fa-chart-line" eyebrow="Panorama fiscal" title="Receita, despesa e resultado mês a mês" />
      <div className="panel p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Seg active={modo === "mensal"} onClick={() => setModo("mensal")}>Mensal</Seg>
          <Seg active={modo === "acum12"} onClick={() => setModo("acum12")}>Acumulado 12 meses</Seg>
          <span className="text-xs tx-faint ml-auto">Dezembro concentra 13º, precatórios e restos a pagar</span>
        </div>
        <div style={{ height: 380 }}>
          <Bar
            key={`geral-${theme}-${modo}-${anosKey}`}
            type="bar"
            data={{
              labels: view.map((r) => r.mes.slice(0, 7)),
              datasets: [
                { type: "line", label: "Arrecadação", data: view.map((r) => r.receita / 1e9), borderColor: "#10B981", borderWidth: 2.5, tension: 0.3, pointRadius: 0 },
                { type: "line", label: "Gastos", data: view.map((r) => r.despesa / 1e9), borderColor: "#F43F5E", borderWidth: 2.5, tension: 0.3, pointRadius: 0 },
                {
                  type: "bar",
                  label: "Resultado",
                  data: view.map((r) => r.resultado_primario / 1e9),
                  backgroundColor: view.map((r) => (r.resultado_primario >= 0 ? "#10B98155" : "#D9A82155")),
                  yAxisID: "y1",
                },
              ],
            }}
            options={themed(theme, {
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: "index", intersect: false },
              scales: {
                y: { title: { display: true, text: "R$ bi" } },
                y1: { position: "right", grid: { drawOnChartArea: false } },
              },
            })}
          />
        </div>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        <div className="panel p-5">
          <h3 className="font-display font-semibold">
            <i className="fa-solid fa-chart-column text-emerald-500 mr-2"></i>Totais anuais{" "}
            <span className="text-xs font-body font-normal tx-faint">em R$ trilhões</span>
          </h3>
          <div style={{ height: 340 }} className="mt-2">
            <Bar
              key={`anual-${theme}`}
              data={{
                labels: an.map((a) => a.ano),
                datasets: [
                  { label: "Receita", data: an.map((a) => a.receita / 1e12), backgroundColor: "#10B981", borderRadius: 6 },
                  { label: "Despesa", data: an.map((a) => a.despesa / 1e12), backgroundColor: "#F43F5E", borderRadius: 6 },
                ],
              }}
              options={themed(theme, {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { title: { display: true, text: "R$ tri" } } },
              })}
            />
          </div>
        </div>
        <div className="panel p-5">
          <h3 className="font-display font-semibold">
            <i className="fa-solid fa-scale-balanced text-amber-500 mr-2"></i>Resultado primário por ano{" "}
            <span className="text-xs font-body font-normal tx-faint">em R$ bilhões</span>
          </h3>
          <div style={{ height: 340 }} className="mt-2">
            <Bar
              key={`res-${theme}`}
              data={{
                labels: an.map((a) => a.ano),
                datasets: [
                  {
                    data: an.map((a) => a.resultado_primario / 1e9),
                    borderRadius: 6,
                    backgroundColor: an.map((a) => (a.resultado_primario >= 0 ? "#10B981" : "#D9A821")),
                  },
                ],
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
            {an.map((a) => (
              <div key={a.ano} className="flex justify-between gap-2 py-1.5" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                <span className="font-display font-bold" style={{ color: "var(--text)" }}>{a.ano}</span>
                <span>
                  {brl(a.receita)} arrecadados · {brl(a.despesa)} gastos ·{" "}
                  <b style={{ color: a.resultado_primario >= 0 ? "#34D399" : "#B98A12" }}>{brl(a.resultado_primario)}</b>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
