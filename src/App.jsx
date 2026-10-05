import { useEffect, useMemo, useRef, useState } from "react";
import Metodologia from "./sections/Metodologia.jsx";
import Orgaos from "./sections/Orgaos.jsx";
import Panorama from "./sections/Panorama.jsx";
import Poderes from "./sections/Poderes.jsx";
import ReceitasDespesas from "./sections/ReceitasDespesas.jsx";
import { Spark } from "./components/ui.jsx";
import { PODERES, YEARS, agregar, brl, resumoMensal, useData } from "./lib/data.js";
import { useTheme } from "./lib/theme.jsx";

const toggleIn = (arr, v, min = 1) =>
  arr.includes(v) ? (arr.length > min ? arr.filter((x) => x !== v) : arr) : [...arr, v];

export default function App() {
  const { theme, toggle } = useTheme();
  const { loading, error, data } = useData();
  const [anos, setAnos] = useState(YEARS);
  const [modo, setModo] = useState("mensal");
  const [poderes, setPoderes] = useState(PODERES);
  const [insightIdx, setInsightIdx] = useState(0);
  const headRef = useRef(null);
  const [headH, setHeadH] = useState(72);

  useEffect(() => {
    const update = () => setHeadH(headRef.current?.offsetHeight || 72);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const anosSet = useMemo(() => new Set(anos), [anos]);
  const resumo = useMemo(
    () => (data ? resumoMensal(data.mensal, anosSet) : null),
    [data, anosSet]
  );
  const { R, D, insights } = useMemo(() => {
    if (!data || !resumo) return { R: [], D: [], insights: [] };
    const R = agregar(data.receitas, "tipo", anosSet);
    const D = agregar(data.despesas, "funcao", anosSet);
    const { rec, des, res, med } = resumo;
    const ys = [...anosSet].sort();
    return {
      R,
      D,
      insights: [
        `De ${ys[0]} a ${ys[ys.length - 1]}, a União gastou <b>${brl(des)}</b> e arrecadou <b>${brl(rec)}</b>.`,
        `O maior destino do gasto é <b>${D[0]?.nome}</b>, com ${D[0]?.pct}% do total aplicado.`,
        `A principal fonte de receita é <b>${R[0]?.nome}</b>, com ${R[0]?.pct}% da arrecadação.`,
        `Resultado primário do período: <b>${brl(res)}</b> (${((res / rec) * 100).toFixed(1)}% da receita).`,
        `Gasto médio mensal da União: <b>${brl(med)}</b>.`,
      ],
    };
  }, [data, resumo, anosSet]);

  const maxMes = useMemo(() => {
    if (!data?.mensal?.length) return "—";
    const m = data.mensal.map((r) => r.mes).sort().pop();
    return `${m.slice(5, 7)}/${m.slice(0, 4)}`;
  }, [data]);

  const pos = (resumo?.res ?? 0) >= 0;
  const resColor = pos ? "#34D399" : "#FDA4AF";

  return (
    <>
      {/* barra utilitária */}
      <div style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-4 py-1.5 flex items-center gap-2 text-[11px] tx-mut flex-wrap">
          <i className="fa-solid fa-building-columns text-emerald-500"></i>
          <span>
            Fonte oficial: Tesouro Nacional — RTN · atualizado até <b style={{ color: "var(--text)" }}>{maxMes}</b>
          </span>
          <span className="ml-1 inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full" style={{ border: "1px solid var(--border)" }}>
            <i className="fa-solid fa-folder-open text-sky-400"></i>
            <span>dados estáticos locais</span>
          </span>
          <a href="#metodologia" className="ml-auto hover:opacity-80 transition">
            <i className="fa-solid fa-circle-info mr-1"></i>Metodologia
          </a>
          <button onClick={toggle} className="hover:opacity-80 transition" title="Alternar modo claro/escuro">
            <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"} mr-1`}></i>
            {theme === "dark" ? "Modo claro" : "Modo escuro"}
          </button>
        </div>
      </div>

      {/* navegação fixa */}
      <header ref={headRef} className="fixed top-0 inset-x-0 z-40 backdrop-blur-md" style={{ background: "var(--nav)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: "linear-gradient(135deg,#10B981,#0E7490)" }}>
            <i className="fa-solid fa-landmark text-lg" style={{ color: "#04120C" }}></i>
          </span>
          <div className="leading-tight">
            <p className="font-display font-bold">Painel Fiscal da União</p>
            <p className="text-[11px] tx-mut">Governo Central · 2022–2026</p>
          </div>
          <nav className="hidden lg:flex gap-5 text-sm tx-mut ml-6">
            <a href="#panorama" className="hover:opacity-70 transition">Panorama</a>
            <a href="#receitas" className="hover:opacity-70 transition">Receitas</a>
            <a href="#despesas" className="hover:opacity-70 transition">Despesas</a>
            <a href="#orgaos" className="hover:opacity-70 transition">Órgãos</a>
            <a href="#poderes" className="hover:opacity-70 transition">Poderes</a>
          </nav>
          <div className="ml-auto flex gap-1.5 flex-wrap" role="group" aria-label="Filtrar por ano">
            <button className={`segbtn${anos.length === YEARS.length ? " on" : ""}`} onClick={() => setAnos(YEARS)}>
              Todos
            </button>
            {YEARS.map((y) => (
              <button key={y} className={`segbtn${anos.includes(y) ? " on" : ""}`} onClick={() => setAnos((a) => toggleIn(a, y))}>
                {y}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4" style={{ paddingTop: headH + 24, paddingBottom: 72 }}>
        {loading && (
          <div className="panel p-10 mt-10 text-center tx-mut">
            <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>Carregando dados…
          </div>
        )}
        {error && (
          <div className="panel p-10 mt-10 text-center">
            <i className="fa-solid fa-triangle-exclamation mr-2" style={{ color: "#FDA4AF" }}></i>
            Falha ao carregar os dados: {error}
          </div>
        )}

        {data && resumo && (
          <>
            {/* hero */}
            <section className="grid lg:grid-cols-[1.15fr_.85fr] gap-5 pt-10 items-stretch">
              <div>
                <span className="chip">
                  <i className="fa-solid fa-circle-check"></i>Dados oficiais · valores correntes · conceito acima da linha
                </span>
                <h1 className="font-display font-extrabold text-4xl sm:text-[3.4rem] leading-[1.05] mt-4">
                  Para onde vai
                  <br />
                  o dinheiro da{" "}
                  <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(100deg,#34D399,#38BDF8)" }}>
                    União?
                  </span>
                </h1>
                <p className="tx-mut text-lg mt-4 max-w-xl leading-relaxed">
                  Quanto o Governo Federal <b style={{ color: "var(--text)" }}>arrecada</b>, quanto{" "}
                  <b style={{ color: "var(--text)" }}>gasta</b> e <b style={{ color: "var(--text)" }}>quais grupos concentram a despesa</b> — mês a mês, de
                  2022 a 2026, com filtros por ano.
                </p>
                <div className="flex gap-3 mt-6 flex-wrap">
                  <a href="#panorama" className="btn-primary">
                    <i className="fa-solid fa-chart-line"></i>Explorar os dados
                  </a>
                  <a href="#metodologia" className="btn-ghost">
                    <i className="fa-solid fa-book-open"></i>Como os dados são gerados
                  </a>
                </div>
                <div className="flex gap-2 mt-6 flex-wrap">
                  <span className="chip"><i className="fa-solid fa-calendar-days"></i>Jan/2022 – Jul/2026</span>
                  <span className="chip"><i className="fa-solid fa-database"></i>RTN · Tabela 1.1 + SIOP</span>
                  <span className="chip"><i className="fa-solid fa-scale-balanced"></i>Receita líquida × despesa primária</span>
                </div>
              </div>
              <div className="panel p-6 flex flex-col justify-between">
                <div className="flex items-center gap-3">
                  <span className="icon-chip"><i className="fa-solid fa-scale-balanced"></i></span>
                  <div>
                    <p className="eyebrow">Resultado primário no período</p>
                    <p className="text-xs tx-mut">
                      {pos ? "Superavit" : "Deficit"} primário em {[...anos].sort().join(" · ")}
                    </p>
                  </div>
                </div>
                <p className="font-display font-extrabold text-[2.6rem] leading-none mt-4" style={{ color: resColor }}>
                  {brl(resumo.res)}
                </p>
                <div className="mt-3">
                  <Spark id="hero" values={resumo.rows.map((r) => r.resultado_primario)} color={pos ? "#10B981" : "#D9A821"} height={54} />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2.5">
                    <span className="kpi-ic text-emerald-500"><i className="fa-solid fa-arrow-trend-up"></i></span>
                    <div>
                      <p className="text-[11px] tx-mut uppercase tracking-wider">Receita</p>
                      <p className="font-bold">{brl(resumo.rec)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="kpi-ic text-rose-500"><i className="fa-solid fa-arrow-trend-down"></i></span>
                    <div>
                      <p className="text-[11px] tx-mut uppercase tracking-wider">Despesa</p>
                      <p className="font-bold">{brl(resumo.des)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* kpis */}
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-5">
              <div className="panel p-5">
                <div className="flex items-center gap-2.5">
                  <span className="kpi-ic text-emerald-500"><i className="fa-solid fa-sack-dollar"></i></span>
                  <p className="text-[11px] font-semibold tx-mut uppercase tracking-widest">Arrecadado</p>
                </div>
                <p className="font-display font-bold text-[1.7rem] mt-2 text-emerald-500">{brl(resumo.rec)}</p>
                <p className="text-xs tx-faint mt-0.5">receita líquida no período</p>
                <div className="mt-2"><Spark id="krec" values={resumo.rows.map((r) => r.receita)} color="#10B981" /></div>
              </div>
              <div className="panel p-5">
                <div className="flex items-center gap-2.5">
                  <span className="kpi-ic text-rose-500"><i className="fa-solid fa-money-bill-transfer"></i></span>
                  <p className="text-[11px] font-semibold tx-mut uppercase tracking-widest">Executado</p>
                </div>
                <p className="font-display font-bold text-[1.7rem] mt-2 text-rose-500">{brl(resumo.des)}</p>
                <p className="text-xs tx-faint mt-0.5">despesa primária total</p>
                <div className="mt-2"><Spark id="kdes" values={resumo.rows.map((r) => r.despesa)} color="#F43F5E" /></div>
              </div>
              <div className="panel p-5">
                <div className="flex items-center gap-2.5">
                  <span className="kpi-ic text-amber-500"><i className="fa-solid fa-scale-balanced"></i></span>
                  <p className="text-[11px] font-semibold tx-mut uppercase tracking-widest">Resultado primário</p>
                </div>
                <p className="font-display font-bold text-[1.7rem] mt-2" style={{ color: resColor }}>
                  {(pos ? "+" : "-") + brl(Math.abs(resumo.res)).slice(3)}
                </p>
                <p className="text-xs tx-faint mt-0.5">
                  {pos ? "Superavit" : "Deficit"} ({((resumo.res / resumo.rec) * 100).toFixed(1)}% da receita)
                </p>
                <div className="mt-2">
                  <Spark id="kres" values={resumo.rows.map((r) => r.resultado_primario)} color={pos ? "#10B981" : "#D9A821"} fill={false} />
                </div>
              </div>
              <div className="panel p-5">
                <div className="flex items-center gap-2.5">
                  <span className="kpi-ic text-sky-500"><i className="fa-solid fa-gauge-high"></i></span>
                  <p className="text-[11px] font-semibold tx-mut uppercase tracking-widest">Gasto médio mensal</p>
                </div>
                <p className="font-display font-bold text-[1.7rem] mt-2 text-sky-500">{brl(resumo.med)}</p>
                <p className="text-xs tx-faint mt-0.5">média do período filtrado</p>
                <div className="mt-2"><Spark id="kmed" values={resumo.rows.map((r) => r.despesa)} color="#38BDF8" /></div>
              </div>
            </section>

            {/* destaque */}
            <section className="panel p-5 mt-4 flex items-center gap-4 flex-wrap">
              <span className="icon-chip" style={{ background: "linear-gradient(135deg,rgba(217,168,33,.25),rgba(217,168,33,.08))", borderColor: "rgba(217,168,33,.4)", color: "#D9A821" }}>
                <i className="fa-solid fa-lightbulb"></i>
              </span>
              <p className="text-[1.05rem] flex-1 min-w-[220px]" dangerouslySetInnerHTML={{ __html: insights[insightIdx % Math.max(1, insights.length)] || "" }} />
              <div className="flex gap-2">
                <button
                  className="btn-ghost !py-2 !px-3.5 text-sm"
                  onClick={() => setInsightIdx((i) => i + 1 + Math.floor(Math.random() * Math.max(1, insights.length - 1)))}
                >
                  <i className="fa-solid fa-shuffle"></i>Embaralhar
                </button>
                <button
                  className="btn-ghost !py-2 !px-3.5 text-sm"
                  onClick={() => {
                    const tmp = document.createElement("div");
                    tmp.innerHTML = insights[insightIdx % Math.max(1, insights.length)] || "";
                    navigator.clipboard?.writeText(tmp.innerText);
                  }}
                >
                  <i className="fa-solid fa-copy"></i><span className="hidden sm:inline">Copiar</span>
                </button>
              </div>
            </section>

            <Panorama data={data} anos={anosSet} modo={modo} setModo={setModo} />
            <ReceitasDespesas R={R} D={D} />
            <Orgaos todos={data.orgaos_todos} anos={anosSet} poderes={poderes} setPoderes={setPoderes} />
            <Poderes podm={data.poderes} anos={anosSet} />
            <Metodologia />
          </>
        )}

        <footer className="fixed bottom-0 inset-x-0 z-40 backdrop-blur-md" style={{ background: "var(--nav)", borderTop: "1px solid var(--border)" }}>
          <div className="max-w-6xl mx-auto px-4 h-12 flex items-center gap-3 text-xs tx-mut">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg flex-none" style={{ background: "linear-gradient(135deg,#10B981,#0E7490)" }}>
              <i className="fa-solid fa-landmark text-[11px]" style={{ color: "#04120C" }}></i>
            </span>
            <span className="truncate">Painel Fiscal da União · Tesouro Transparente (ODbL) + SIOP</span>
            <span className="hidden md:inline tx-faint flex-none">· React + Chart.js</span>
            <a href="#panorama" className="ml-auto hover:opacity-70 transition flex-none">
              <i className="fa-solid fa-arrow-up mr-1"></i>Topo
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}
