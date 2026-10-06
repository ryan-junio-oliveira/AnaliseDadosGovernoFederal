import { SectionHead } from "../components/ui.jsx";
import { Bar, Line, themed } from "../lib/charts.jsx";
import { anoDe, brl } from "../lib/data.js";
import { useTheme } from "../lib/theme.jsx";
import { useMemo } from "react";

const pct = (v, dec = 2) =>
  v == null || !Number.isFinite(v) ? "—" : `${v.toFixed(dec).replace(".", ",")}%`;
const moeda = (v) =>
  v == null || !Number.isFinite(v) ? "—" : `R$ ${v.toFixed(2).replace(".", ",")}`;
const num = (v) =>
  v == null || !Number.isFinite(v) ? "—" : Math.round(v).toLocaleString("pt-BR");

/** último valor não-nulo da série filtrada */
function ultimo(rows, key) {
  for (let i = rows.length - 1; i >= 0; i--) {
    const v = rows[i][key];
    if (v != null && Number.isFinite(v)) return { valor: v, ref: rows[i].mes || rows[i].tri || rows[i].ano };
  }
  return null;
}

function Kpi({ icon, label, valor, cor, sub, sparkVals, sparkColor }) {
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
          <MiniSpark values={sparkVals} color={sparkColor} />
        </div>
      )}
    </div>
  );
}

// sparkline local (usa o canvas do charts já registrado)
function MiniSpark({ values, color }) {
  const { theme } = useTheme();
  return (
    <Line
      key={theme}
      data={{ labels: values.map((_, i) => i), datasets: [{ data: values, borderColor: color, borderWidth: 2, pointRadius: 0, tension: 0.35, fill: true, backgroundColor: `${color}26`, spanGaps: true }] }}
      options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } }, animation: false }}
    />
  );
}

export default function Conjuntura({ data, anos }) {
  const { theme } = useTheme();
  const cm = useMemo(() => (data.conj_mensal || []).filter((r) => anos.has(anoDe(r.mes))), [data, anos]);
  const dv = useMemo(() => (data.conj_dividas || []).filter((r) => anos.has(anoDe(r.mes))), [data, anos]);
  const tri = useMemo(() => (data.conj_desemprego || []).filter((r) => anos.has(anoDe(r.mes))), [data, anos]);
  const emp = useMemo(() => (data.conj_empresas || []).filter((r) => anos.has(anoDe(r.mes))), [data, anos]);
  const crime = useMemo(() => (data.conj_crime || []).filter((r) => anos.has(r.ano)), [data, anos]);
  const ipos = useMemo(() => (data.conj_ipos || []).filter((r) => anos.has(r.ano)), [data, anos]);

  const temMensal = cm.length > 0;
  const temEmpresas = emp.length > 0;
  const temCrime = crime.length > 0;
  const temDes = tri.length > 0;
  const temIpo = ipos.length > 0;
  const temAbertas = temEmpresas && emp.some((r) => r.abertas != null);
  if (!temMensal && !temEmpresas && !temCrime && !temDes && !temIpo && !dv.length) {
    return (
      <section id="conjuntura" className="scroll-mt-24">
        <SectionHead index="02" eyebrow="Preços, juros, emprego e empresas" title="Conjuntura" />
        <div className="panel p-6 text-sm tx-mut">Sem dados de conjuntura para o filtro atual.</div>
      </section>
    );
  }

  const ipca12 = ultimo(cm, "ipca_12m");
  const selic = ultimo(cm, "selic");
  const dolar = ultimo(cm, "dolar");
  const des = temDes ? tri[tri.length - 1] : null;
  const rj12 = temEmpresas ? emp.slice(-12).reduce((t, r) => t + (r.rj_req || 0), 0) : null;
  const fal12 = temEmpresas ? emp.slice(-12).reduce((t, r) => t + (r.fal_req || 0), 0) : null;
  const hom = temCrime ? crime[crime.length - 1] : null;
  const ibov = ultimo(cm, "ibov");
  const totIpo = temIpo ? ipos.reduce((t, r) => t + (r.ipos || 0), 0) : null;
  const volIpo = temIpo ? ipos.reduce((t, r) => t + (r.volume || 0), 0) : null;
  const corIpca = ipca12 && ipca12.valor > 4.5 ? "var(--brick)" : "var(--green)";

  return (
    <section id="conjuntura" className="scroll-mt-24">
      <SectionHead index="02" eyebrow="Preços, juros, emprego e empresas" title="Conjuntura" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {ipca12 && (
          <Kpi icon="fa-tag" label="IPCA em 12 meses" valor={pct(ipca12.valor)} cor={corIpca}
            sub={`ref. ${ipca12.ref.slice(0, 7)} · centro da meta: 3,0%`}
            sparkVals={cm.map((r) => r.ipca_12m)} sparkColor={ipca12.valor > 4.5 ? "#F43F5E" : "#10B981"} />
        )}
        {selic && (
          <Kpi icon="fa-percent" label="Selic meta" valor={pct(selic.valor)} cor="var(--text)"
            sub={`ref. ${selic.ref.slice(0, 7)} · BCB SGS 432`}
            sparkVals={cm.map((r) => r.selic)} sparkColor="#7C5CBF" />
        )}
        {dolar && (
          <Kpi icon="fa-dollar-sign" label="Dólar comercial" valor={moeda(dolar.valor)} cor="var(--text)"
            sub={`ref. ${dolar.ref.slice(0, 7)} · BCB SGS 1`}
            sparkVals={cm.map((r) => r.dolar)} sparkColor="#0E7CB5" />
        )}
        {ibov && (
          <Kpi icon="fa-arrow-trend-up" label="Ibovespa" valor={`${Math.round(ibov.valor).toLocaleString("pt-BR")} pts`} cor="var(--text)"
            sub={`ref. ${ibov.ref.slice(0, 7)} · fechamento mensal ajustado`}
            sparkVals={cm.map((r) => r.ibov)} sparkColor="#10B981" />
        )}
        {temIpo && (
          <Kpi icon="fa-handshake" label="IPOs no período" valor={`${totIpo} · ${brl(volIpo)}`} cor="var(--text)"
            sub="ofertas iniciais de ações · CVM" />
        )}
        {des && (
          <Kpi icon="fa-briefcase" label="Desocupação (PNADc)" valor={pct(des.desemprego, 1)} cor="var(--text)"
            sub={`${des.tri} · IBGE SIDRA 4095`}
            sparkVals={tri.map((r) => r.desemprego)} sparkColor="#0E7CB5" />
        )}
        {temEmpresas && (
          <Kpi icon="fa-scale-unbalanced" label="RJ + falências (12m)" valor={`${num(rj12)} · ${num(fal12)}`}
            cor="var(--text)" sub="pedidos RJ · falências requeridas · Serasa" />
        )}
        {hom && (
          <Kpi icon="fa-shield-halved" label="Homicídios no ano" valor={num(hom.homicidios)} cor="var(--text)"
            sub={`${hom.ano} · Atlas da Violência IPEA/FBSP`} />
        )}
      </div>

      {temMensal && (
        <div className="grid lg:grid-cols-2 gap-4 mt-4">
          <div className="panel p-5">
            <h3 className="font-display font-semibold mb-1">IPCA mensal × 12 meses <span className="text-xs font-body font-normal tx-faint">% a.m. + % 12m</span></h3>
            <div style={{ height: 300 }} className="mt-2">
              <Bar
                key={`ipca-${theme}`}
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
            <h3 className="font-display font-semibold mb-1">Selic × dólar <span className="text-xs font-body font-normal tx-faint">% a.a. + R$</span></h3>
            <div style={{ height: 300 }} className="mt-2">
              <Bar
                key={`selic-${theme}`}
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
          {dv.length > 1 && (
            <div className="panel p-5">
              <h3 className="font-display font-semibold mb-1">Dívida pública <span className="text-xs font-body font-normal tx-faint">% do PIB · BCB</span></h3>
              <div style={{ height: 300 }} className="mt-2">
                <Bar
                  key={`div-${theme}`}
                  data={{
                    labels: dv.map((r) => r.mes.slice(0, 7)),
                    datasets: [
                      { type: "line", label: "Bruta (DBGG)", data: dv.map((r) => r.dbgg), unit: "% do PIB", borderColor: "#F43F5E", borderWidth: 2.5, tension: 0.3, pointRadius: 0, spanGaps: true },
                      { type: "line", label: "Líquida (DLSP)", data: dv.map((r) => r.dlsp), unit: "% do PIB", borderColor: "#0E7CB5", borderWidth: 2, tension: 0.3, pointRadius: 0, spanGaps: true },
                    ],
                  }}
                  options={themed(theme, {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: "index", intersect: false },
                    scales: {
                      x: { ticks: { maxTicksLimit: 10, maxRotation: 45 } },
                      y: { title: { display: true, text: "% do PIB" } },
                    },
                  })}
                />
              </div>
            </div>
          )}
          {temDes && (
            <div className="panel p-5">
              <h3 className="font-display font-semibold mb-1">Desocupação por trimestre <span className="text-xs font-body font-normal tx-faint">% · PNADc</span></h3>
              <div style={{ height: 300 }} className="mt-2">
                <Bar
                  key={`des-${theme}`}
                  data={{
                    labels: tri.map((r) => r.tri),
                    datasets: [{ data: tri.map((r) => r.desemprego), unit: "%", backgroundColor: "#0E7CB5", borderRadius: 5 }],
                  }}
                  options={themed(theme, {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { ticks: { maxTicksLimit: 12, maxRotation: 45 } },
                      y: { title: { display: true, text: "%" } },
                    },
                  })}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {temIpo && (
        <div className="grid lg:grid-cols-2 gap-4 mt-4">
          <div className="panel p-5">
            <h3 className="font-display font-semibold mb-1">Ibovespa <span className="text-xs font-body font-normal tx-faint">pontos · fechamento mensal</span></h3>
            <div style={{ height: 300 }} className="mt-2">
              <Line
                key={`ibov-${theme}`}
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
          <div className="panel p-5">
            <h3 className="font-display font-semibold mb-1">IPOs por ano <span className="text-xs font-body font-normal tx-faint">qtd + volume · CVM</span></h3>
            <div style={{ height: 300 }} className="mt-2">
              <Bar
                key={`ipo-${theme}`}
                data={{
                  labels: ipos.map((r) => r.ano),
                  datasets: [
                    { type: "bar", label: "IPOs", data: ipos.map((r) => r.ipos), unit: "ofertas", backgroundColor: "#0E7CB5", borderRadius: 5 },
                    { type: "line", label: "Volume", data: ipos.map((r) => +(r.volume / 1e9).toFixed(2)), unit: "R$ bi", borderColor: "#F59E0B", borderWidth: 2.5, tension: 0.3, pointRadius: 3, yAxisID: "y1" },
                  ],
                }}
                options={themed(theme, {
                  responsive: true, maintainAspectRatio: false,
                  interaction: { mode: "index", intersect: false },
                  scales: {
                    y: { title: { display: true, text: "IPOs" } },
                    y1: { position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "R$ bi" } },
                  },
                })}
              />
            </div>
          </div>
        </div>
      )}

      {temEmpresas && (
        <div className="panel p-5 sm:p-6 mt-4">
          <h3 className="font-display font-semibold mb-1">Pedidos de RJ × falências <span className="text-xs font-body font-normal tx-faint">por mês · Serasa Experian</span></h3>
          <div style={{ height: 320 }} className="mt-2">
            <Bar
              key={`emp-${theme}`}
              data={{
                labels: emp.map((r) => r.mes.slice(0, 7)),
                datasets: [
                  { label: "RJ requeridas", data: emp.map((r) => r.rj_req), unit: "pedidos", backgroundColor: "#7C5CBF", borderRadius: 3 },
                  { label: "Falências requeridas", data: emp.map((r) => r.fal_req), unit: "pedidos", backgroundColor: "#F43F5E", borderRadius: 3 },
                ],
              }}
              options={themed(theme, {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                scales: {
                  x: { ticks: { maxTicksLimit: 12, maxRotation: 45 } },
                  y: { title: { display: true, text: "pedidos" } },
                },
              })}
            />
          </div>
          <p className="text-xs tx-faint mt-3">
            Série com quebra metodológica em 2025 (Serasa passou a separar processos de CNPJs). Últimos meses são preliminares (defasagem de ~3 meses).
            {temAbertas
              ? " Abertas × fechadas vindas do Mapa de Empresas aparecem no gráfico abaixo."
              : " Aberturas × fechamentos (Mapa de Empresas) entram aqui quando data/manual/manual_empresas.csv for preenchido."}
          </p>
        </div>
      )}

      {temAbertas && (
        <div className="panel p-5 sm:p-6 mt-4">
          <h3 className="font-display font-semibold mb-1">Empresas abertas × fechadas <span className="text-xs font-body font-normal tx-faint">por mês · Mapa de Empresas</span></h3>
          <div style={{ height: 300 }} className="mt-2">
            <Bar
              key={`abe-${theme}`}
              data={{
                labels: emp.filter((r) => r.abertas != null).map((r) => r.mes.slice(0, 7)),
                datasets: [
                  { label: "Abertas", data: emp.filter((r) => r.abertas != null).map((r) => r.abertas), unit: "empresas", backgroundColor: "#10B981", borderRadius: 3 },
                  { label: "Fechadas", data: emp.filter((r) => r.abertas != null).map((r) => r.fechadas), unit: "empresas", backgroundColor: "#F43F5E", borderRadius: 3 },
                ],
              }}
              options={themed(theme, {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                scales: {
                  x: { ticks: { maxTicksLimit: 12, maxRotation: 45 } },
                  y: { title: { display: true, text: "empresas" } },
                },
              })}
            />
          </div>
        </div>
      )}

      {temCrime && (
        <div className="panel p-5 sm:p-6 mt-4">
          <h3 className="font-display font-semibold mb-1">Homicídios por ano <span className="text-xs font-body font-normal tx-faint">total BR · Atlas da Violência IPEA/FBSP</span></h3>
          <div style={{ height: 280 }} className="mt-2">
            <Bar
              key={`cri-${theme}`}
              data={{
                labels: crime.map((r) => r.ano),
                datasets: [{ data: crime.map((r) => r.homicidios), unit: "homicídios", backgroundColor: "#64748B", borderRadius: 6 }],
              }}
              options={themed(theme, {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { title: { display: true, text: "homicídios" } } },
              })}
            />
          </div>
          <p className="text-xs tx-faint mt-3">Fonte SIM/Ministério da Saúde via Atlas; divulgação anual com ~2 anos de defasagem.</p>
        </div>
      )}
    </section>
  );
}
