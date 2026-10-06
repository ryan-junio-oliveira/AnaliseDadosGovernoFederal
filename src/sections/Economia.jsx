import { SectionHead, useMediaQuery } from "../components/ui.jsx";
import { Bar, Line, themed } from "../lib/charts.jsx";
import { anoDe } from "../lib/data.js";
import { useTheme } from "../lib/theme.jsx";
import { useMemo } from "react";

const pct = (v, dec = 2) =>
  v == null || !Number.isFinite(v) ? "—" : `${v.toFixed(dec).replace(".", ",")}%`;
const moeda = (v) =>
  v == null || !Number.isFinite(v) ? "—" : `R$ ${v.toFixed(2).replace(".", ",")}`;

function Kpi({ icon, label, valor, cor, sub, sparkVals, sparkColor }) {
  const { theme } = useTheme();
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2.5">
        <span className="kpi-ic" style={{ color: cor }}><i className={`fa-solid ${icon}`} aria-hidden="true"></i></span>
        <p className="text-[11px] font-semibold tx-mut uppercase tracking-widest">{label}</p>
      </div>
      <p className="font-display font-bold text-[1.6rem] mt-2" style={{ color: cor }}>{valor}</p>
      {sub && <p className="text-xs tx-faint mt-0.5">{sub}</p>}
      {sparkVals?.length > 1 && (
        <div className="mt-2" style={{ height: 46 }} aria-hidden="true">
          <Line
            key={theme}
            data={{ labels: sparkVals.map((_, i) => i), datasets: [{ data: sparkVals, borderColor: sparkColor, borderWidth: 2, pointRadius: 0, tension: 0.35, fill: true, backgroundColor: `${sparkColor}26`, spanGaps: true }] }}
            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } }, animation: false }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Economia no período: só o essencial (IPCA, Selic, dólar, Ibovespa).
 * Posição no fim do filtro — não se soma.
 */
export default function Economia({ data, anos }) {
  const { theme } = useTheme();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const cm = useMemo(
    () => (data.conj_mensal || []).filter((r) => anos.has(anoDe(r.mes))).sort((a, b) => (a.mes < b.mes ? -1 : 1)),
    [data, anos]
  );
  // Resumos DO PERÍODO (não do ponto final): acumulado, médias e variação.
  const mesesValidos = (key) => cm.filter((r) => Number.isFinite(r[key]));
  const periodoRef = cm.length
    ? `${cm[0].mes.slice(0, 7)} – ${cm[cm.length - 1].mes.slice(0, 7)}`
    : "—";
  const ipcaAcum = (() => {
    const vs = mesesValidos("ipca_m");
    if (!vs.length) return null;
    const f = vs.reduce((a, r) => a * (1 + r.ipca_m / 100), 1);
    const anualizado = Math.pow(f, 12 / vs.length) - 1;
    return { acum: (f - 1) * 100, anualizado: anualizado * 100 };
  })();
  const media = (key) => {
    const vs = mesesValidos(key);
    if (!vs.length) return null;
    return vs.reduce((t, r) => t + r[key], 0) / vs.length;
  };
  const selicMedia = media("selic");
  const dolarMedio = media("dolar");
  const ibovVar = (() => {
    const vs = mesesValidos("ibov");
    if (vs.length < 2 || !vs[0].ibov) return null;
    return ((vs[vs.length - 1].ibov / vs[0].ibov) - 1) * 100;
  })();
  const corIpca = ipcaAcum && ipcaAcum.anualizado > 4.5 ? "var(--brick)" : "var(--green)";

  if (!cm.length) return null;

  return (
    <section id="economia" className="scroll-mt-24">
      <SectionHead index="07" eyebrow="Preços, juros, câmbio e bolsa" title="Economia no período" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {ipcaAcum && (
          <Kpi icon="fa-tag" label="IPCA acumulado no período" valor={pct(ipcaAcum.acum)} cor={corIpca}
            sub={`${periodoRef} · ~${pct(ipcaAcum.anualizado)} a.a. · meta 3,0%`}
            sparkVals={cm.map((r) => r.ipca_12m)} sparkColor={ipcaAcum.anualizado > 4.5 ? "#F43F5E" : "#10B981"} />
        )}
        {selicMedia != null && (
          <Kpi icon="fa-percent" label="Selic média no período" valor={pct(selicMedia)} cor="var(--text)"
            sub={`${periodoRef} · BCB`}
            sparkVals={cm.map((r) => r.selic)} sparkColor="#7C5CBF" />
        )}
        {dolarMedio != null && (
          <Kpi icon="fa-dollar-sign" label="Dólar médio no período" valor={moeda(dolarMedio)} cor="var(--text)"
            sub={`${periodoRef} · BCB`}
            sparkVals={cm.map((r) => r.dolar)} sparkColor="#0E7CB5" />
        )}
        {ibovVar != null && (
          <Kpi icon="fa-arrow-trend-up" label="Ibovespa no período" valor={`${ibovVar >= 0 ? "+" : ""}${ibovVar.toFixed(1).replace(".", ",")}%`} cor="var(--text)"
            sub={`${periodoRef} · fechamento mensal`}
            sparkVals={cm.map((r) => r.ibov)} sparkColor="#10B981" />
        )}
      </div>
      <div className="flex flex-col gap-4 mt-4">
        <div className="panel p-5">
          <h3 className="font-display font-semibold mb-1">IPCA mensal × 12 meses <span className="text-xs font-body font-normal tx-faint">% a.m. + % 12m · BCB</span></h3>
          <div style={{ height: 300 }} className="mt-2">
            <Bar
              key={`eco-ipca-${theme}`}
              data={{
                labels: cm.map((r) => r.mes.slice(0, 7)),
                datasets: [
                  { type: "bar", label: "Mensal", data: cm.map((r) => r.ipca_m), unit: "% a.m.", backgroundColor: "#10B98188", borderRadius: 3 },
                  { type: "line", label: "12 meses", data: cm.map((r) => r.ipca_12m), unit: "% em 12m", borderColor: "#F59E0B", borderWidth: 2.5, tension: 0.3, pointRadius: 0, spanGaps: true },
                ],
              }}
              options={themed(theme, {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                scales: {
                  x: { ticks: { maxTicksLimit: 10, maxRotation: 45 } },
                  y: { title: { display: true, text: "%" } },
                },
              })}
            />
          </div>
        </div>
        <div className="panel p-5">
          <h3 className="font-display font-semibold mb-1">Selic × dólar <span className="text-xs font-body font-normal tx-faint">% a.a. + R$ · BCB</span></h3>
          <div style={{ height: 300 }} className="mt-2">
            <Bar
              key={`eco-selic-${theme}`}
              data={{
                labels: cm.map((r) => r.mes.slice(0, 7)),
                datasets: [
                  { type: "line", label: "Selic", data: cm.map((r) => r.selic), unit: "% a.a.", borderColor: "#7C5CBF", borderWidth: 2.5, tension: 0.3, pointRadius: 0, spanGaps: true },
                  { type: "line", label: "Dólar", data: cm.map((r) => r.dolar), unit: "R$", borderColor: "#0E7CB5", borderWidth: 2, tension: 0.3, pointRadius: 0, spanGaps: true, yAxisID: "y1" },
                ],
              }}
              options={themed(theme, {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                scales: {
                  x: { ticks: { maxTicksLimit: 10, maxRotation: 45 } },
                  y: { title: { display: true, text: "% a.a." } },
                  y1: { position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "R$" } },
                },
              })}
            />
          </div>
        </div>
        <div className="panel p-5">
          <h3 className="font-display font-semibold mb-1">Ibovespa <span className="text-xs font-body font-normal tx-faint">pontos · fechamento mensal</span></h3>
          <div style={{ height: 300 }} className="mt-2">
            <Line
              key={`eco-ibov-${theme}`}
              data={{
                labels: cm.map((r) => r.mes.slice(0, 7)),
                datasets: [{ label: "Ibovespa", data: cm.map((r) => r.ibov), unit: "pontos", borderColor: "#10B981", borderWidth: 2.5, tension: 0.3, pointRadius: 0, spanGaps: true, fill: true, backgroundColor: "#10B98122" }],
              }}
              options={themed(theme, {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { maxTicksLimit: 10, maxRotation: 45 } },
                  y: { title: { display: true, text: "pontos" } },
                },
              })}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
