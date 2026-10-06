import { SectionHead } from "../components/ui.jsx";
import { Bar, themed } from "../lib/charts.jsx";
import { useTheme } from "../lib/theme.jsx";
import { useMemo } from "react";

const num = (v) =>
  v == null || !Number.isFinite(v) ? "—" : Math.round(v).toLocaleString("pt-BR");

export default function Seguranca({ data, anos }) {
  const { theme } = useTheme();
  const crime = useMemo(() => (data.conj_crime || []).filter((r) => anos.has(r.ano)), [data, anos]);

  if (!crime.length) return null;

  const hom = crime[crime.length - 1];

  return (
    <section id="seguranca" className="scroll-mt-24">
      <SectionHead index="07" eyebrow="Letalidade violenta" title="Segurança Pública" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
        <div className="panel p-5">
          <div className="flex items-center gap-2.5">
            <span className="kpi-ic" style={{ color: "var(--text)" }}><i className="fa-solid fa-shield-halved" aria-hidden="true"></i></span>
            <p className="text-[11px] font-semibold tx-mut uppercase tracking-widest">Homicídios no ano</p>
          </div>
          <p className="font-display font-bold text-[1.6rem] mt-2" style={{ color: "var(--text)" }}>{num(hom.homicidios)}</p>
          <p className="text-xs tx-faint mt-0.5">{hom.ano} · Atlas da Violência IPEA/FBSP</p>
        </div>
      </div>
      <div className="panel p-5 sm:p-6 mt-4">
        <h3 className="font-display font-semibold mb-1">Homicídios por ano <span className="text-xs font-body font-normal tx-faint">total BR · Atlas da Violência IPEA/FBSP</span></h3>
        <div style={{ height: 300 }} className="mt-2">
          <Bar
            key={`seg-${theme}`}
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
        <p className="text-xs tx-faint mt-3 leading-relaxed">
          Fonte SIM/Ministério da Saúde via Atlas; divulgação anual com ~2 anos de defasagem.
          A série recente convive com alta de homicídios ocultos (subnotificação) — ver Metodologia.
        </p>
      </div>
    </section>
  );
}
