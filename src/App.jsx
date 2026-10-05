import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import EnteSelector from "./components/EnteSelector.jsx";
import { AdSlot, ConsentBanner } from "./components/Ads.jsx";
import { BrandMark, ErrorBoundary, Skeleton, Spark } from "./components/ui.jsx";
import { PODERES, YEARS, agregar, anosComDados, brl, comparativo, intervaloDados, resumoMensal, useData, varPct } from "./lib/data.js";
import { getEnte } from "./lib/entes.js";
import { useTheme } from "./lib/theme.jsx";

const Panorama = lazy(() => import("./sections/Panorama.jsx"));
const ReceitasDespesas = lazy(() => import("./sections/ReceitasDespesas.jsx"));
const Orgaos = lazy(() => import("./sections/Orgaos.jsx"));
const Poderes = lazy(() => import("./sections/Poderes.jsx"));
const Metodologia = lazy(() => import("./sections/Metodologia.jsx"));
const Privacidade = lazy(() => import("./sections/Privacidade.jsx"));

const toggleIn = (arr, v, min = 1) =>
  arr.includes(v) ? (arr.length > min ? arr.filter((x) => x !== v) : arr) : [...arr, v];

function copiar(texto) {
  try {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(texto);
  } catch { /* fallback abaixo */ }
  const ta = document.createElement("textarea");
  ta.value = texto;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } catch { /* sem clipboard */ }
  ta.remove();
  return Promise.resolve();
}

function exportCSV(rows, anos) {
  const head = "mes;receita;despesa;resultado_primario\n";
  const body = rows
    .map((r) => [r.mes, Math.round(r.receita), Math.round(r.despesa), Math.round(r.resultado_primario)].join(";"))
    .join("\n");
  const blob = new Blob(["\uFEFF" + head + body], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `observatorio-fiscal-${[...anos].sort().join("-")}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function fmtPct(v) {
  if (v == null || !Number.isFinite(v)) return null;
  const s = v >= 0 ? "▲" : "▼";
  return `${s} ${Math.abs(v).toFixed(1).replace(".", ",")}%`;
}

function Delta({ valor, bomQuandoSobe, rotulo }) {
  const txt = fmtPct(valor);
  if (txt == null) return <div className="h-[18px] mt-1" />;
  const bom = valor >= 0 ? bomQuandoSobe : !bomQuandoSobe;
  return (
    <p className="delta mt-1" style={{ color: bom ? "var(--green)" : "var(--brick)" }}>
      {txt} <small>vs {rotulo}</small>
    </p>
  );
}

function YearFilter({ anos, anosBtns, setAnos }) {
  const todos = anos.length === anosBtns.length;
  const faixa = useRef(null);
  const rola = (dx) => faixa.current?.scrollBy({ left: dx, behavior: "smooth" });
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" className="segbtn !px-2.5 flex-none" aria-label="Ver anos anteriores" onClick={() => rola(-240)}>
        ‹
      </button>
      <div ref={faixa} className="yearscroll" role="group" aria-label="Filtrar por ano">
        <button className={`segbtn${todos ? " on" : ""}`} aria-pressed={todos} onClick={() => setAnos(anosBtns)}>
          Todos
        </button>
        {anosBtns.map((y) => (
          <button
            key={y}
            className={`segbtn${anos.includes(y) ? " on" : ""}`}
            aria-pressed={anos.includes(y)}
            onClick={() => setAnos((a) => toggleIn(a, y))}
          >
            {y}
          </button>
        ))}
      </div>
      <button type="button" className="segbtn !px-2.5 flex-none" aria-label="Ver anos seguintes" onClick={() => rola(240)}>
        ›
      </button>
    </div>
  );
}

export default function App() {
  const { theme, toggle } = useTheme();
  const [enteId, setEnteId] = useState(() => {
    try { return localStorage.getItem("pfu-ente") || "uniao"; } catch { return "uniao"; }
  });
  const ente = getEnte(enteId);
  useEffect(() => {
    try { localStorage.setItem("pfu-ente", ente.id); } catch { /* sem storage */ }
  }, [ente.id]);

  const { loading, error, data } = useData(ente);
  const [anos, setAnos] = useState(YEARS);
  const [modo, setModo] = useState("mensal");
  const [poderes, setPoderes] = useState(PODERES);
  const [insightIdx, setInsightIdx] = useState(0);
  const [copiado, setCopiado] = useState(false);
  const headRef = useRef(null);
  const [headH, setHeadH] = useState(64);

  useEffect(() => {
    const update = () => setHeadH(headRef.current?.offsetHeight || 64);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const anosSet = useMemo(() => new Set(anos), [anos]);
  const anosBtns = useMemo(() => (data ? anosComDados(data.mensal) : YEARS), [data]);
  // Sincroniza o filtro com os anos que existem nos dados (ex.: apos
  // regenerar a decada, ou ao trocar de ente). Evita "Todos" apagado
  // com todos os anos visiveis selecionados.
  useEffect(() => {
    if (data) setAnos(anosComDados(data.mensal));
  }, [data]);
  const intervalo = useMemo(() => (data ? intervaloDados(data.mensal) : null), [data]);
  const resumo = useMemo(
    () => (data ? resumoMensal(data.mensal, anosSet) : null),
    [data, anosSet]
  );
  const comp = useMemo(
    () => (data ? comparativo(data.mensal, anosSet) : null),
    [data, anosSet]
  );
  const { R, D, insights } = useMemo(() => {
    if (!data || !resumo) return { R: [], D: [], insights: [] };
    const R = agregar(data.receitas, "tipo", anosSet);
    const D = agregar(data.despesas, "funcao", anosSet);
    const { rec, des, res, med } = resumo;
    const ys = [...anosSet].sort();
    const periodo = `${ys[0]}–${ys[ys.length - 1]}`;
    const pctRes = rec ? ((res / rec) * 100).toFixed(1) : "0.0";
    if (!R.length || !D.length || !resumo.rows.length) {
      return {
        R, D,
        insights: [
          { html: <>Sem dados para os anos selecionados. Ajuste o filtro.</>, txt: "Sem dados para os anos selecionados." },
        ],
      };
    }
    return {
      R,
      D,
      insights: [
        { html: (<>De {periodo}, a União gastou <b>{brl(des)}</b> e arrecadou <b>{brl(rec)}</b>.</>), txt: `De ${periodo}, a União gastou ${brl(des)} e arrecadou ${brl(rec)}.` },
        { html: (<>O maior destino do gasto é <b>{D[0]?.nome}</b>, com {D[0]?.pct}% do total aplicado.</>), txt: `O maior destino do gasto é ${D[0]?.nome}, com ${D[0]?.pct}% do total aplicado.` },
        { html: (<>A principal fonte de receita é <b>{R[0]?.nome}</b>, com {R[0]?.pct}% da arrecadação.</>), txt: `A principal fonte de receita é ${R[0]?.nome}, com ${R[0]?.pct}% da arrecadação.` },
        { html: (<>Resultado primário do período: <b>{brl(res)}</b> ({pctRes}% da receita).</>), txt: `Resultado primário do período: ${brl(res)} (${pctRes}% da receita).` },
        { html: (<>Gasto médio mensal da União: <b>{brl(med)}</b>.</>), txt: `Gasto médio mensal da União: ${brl(med)}.` },
      ],
    };
  }, [data, resumo, anosSet]);

  const maxMes = useMemo(() => {
    if (!data?.mensal?.length) return "—";
    const m = data.mensal.reduce((a, b) => (a.mes > b.mes ? a : b)).mes;
    return `${m.slice(5, 7)}/${m.slice(0, 4)}`;
  }, [data]);

  const pos = (resumo?.res ?? 0) >= 0;
  const resColor = pos ? "#10B981" : "#F59E0B";
  const insight = insights.length ? insights[insightIdx % insights.length] : null;

  const dRec = resumo && comp ? varPct(resumo.rec, comp.rec) : null;
  const dDes = resumo && comp ? varPct(resumo.des, comp.des) : null;
  const dMed = resumo && comp ? varPct(resumo.med, comp.med) : null;
  const dRes = resumo && comp ? resumo.res - comp.res : null;
  const rotuloVs = comp?.rotulo || "";

  const themeBtn = (
    <button
      type="button"
      onClick={toggle}
      className="segbtn"
      title={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
      aria-label={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
      aria-pressed={theme === "light"}
    >
      <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"}`} aria-hidden="true"></i>
    </button>
  );

  return (
    <>
      {/* ============ barra superior ============ */}
      <header ref={headRef} className="fixed top-0 inset-x-0 z-40 backdrop-blur-md" style={{ background: "var(--nav)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">
          <BrandMark size={30} />
          <div className="leading-tight min-w-0">
            <p className="font-display font-bold truncate">Observatório dos Dados</p>
            <p className="text-[10px] tx-faint hidden min-[420px]:block">União {intervalo?.anos || ""}</p>
          </div>
          <span className="ml-auto flex-none">{themeBtn}</span>
        </div>
      </header>

      <div>
        <main id="conteudo" className="max-w-6xl mx-auto px-4" style={{ paddingTop: headH + 8, paddingBottom: 40 }}>
          {loading && <Skeleton lines={4} />}
          {error && !loading && (
            <div className="panel p-10 mt-6 text-center" role="alert">
              <i className="fa-solid fa-triangle-exclamation mr-2" style={{ color: "var(--brick)" }} aria-hidden="true"></i>
              Falha ao carregar os dados: {error}
              <div className="mt-3">
                <button className="btn-ghost !py-2 !px-4 text-sm" onClick={() => window.location.reload()}>
                  <i className="fa-solid fa-rotate-right"></i>Recarregar
                </button>
              </div>
            </div>
          )}

          {data && resumo && (
            <>
              {/* filtros: acima do conteudo, largura total */}
              <section className="panel p-4 mt-4 flex flex-col gap-3" aria-label="Filtros">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="dateline">Filtros</p>
                  <EnteSelector value={ente.id} onChange={setEnteId} />
                  <span className="tx-faint text-xs ml-auto hidden sm:inline">
                    {anosBtns.length} anos · {intervalo?.periodo || ""}
                  </span>
                </div>
                <YearFilter anos={anos} anosBtns={anosBtns} setAnos={setAnos} />
              </section>

              {/* cabeçalho da página */}
              <section className="pt-6 lg:pt-8" aria-label="Resumo fiscal">
                <p className="dateline">Visão geral · {intervalo?.periodo || ""}</p>
                <div className="flex items-end justify-between gap-3 flex-wrap mt-1.5">
                  <h1 className="font-display font-bold text-[1.75rem] sm:text-[2.1rem] leading-none">
                    Resultado fiscal da União
                  </h1>
                  <div className="flex gap-2">
                    <button type="button" className="btn-ghost !py-2 !px-3.5 text-sm" onClick={() => exportCSV(resumo.rows, anos)}>
                      <i className="fa-solid fa-download" aria-hidden="true"></i>CSV
                    </button>
                  </div>
                </div>
                <p className="tx-faint text-[13px] mt-2">
                  Receita líquida × despesa primária · valores correntes · RTN Tabela 1.1 + SIOP
                </p>
              </section>

              {/* kpis */}
              <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 mt-5" aria-label="Indicadores">
                <div className="panel p-5">
                  <div className="flex items-center gap-2.5">
                    <span className="kpi-ic c-rec"><i className="fa-solid fa-sack-dollar" aria-hidden="true"></i></span>
                    <p className="text-[11px] font-semibold tx-mut uppercase tracking-widest">Arrecadado</p>
                  </div>
                  <p className="font-display font-bold text-[1.6rem] mt-2 c-rec">{brl(resumo.rec)}</p>
                  <Delta valor={dRec} bomQuandoSobe rotulo={rotuloVs} />
                  <p className="text-xs tx-faint mt-0.5">receita líquida no período</p>
                  <div className="mt-2"><Spark id="krec" values={resumo.rows.map((r) => r.receita)} color="#10B981" /></div>
                </div>
                <div className="panel p-5">
                  <div className="flex items-center gap-2.5">
                    <span className="kpi-ic c-des"><i className="fa-solid fa-money-bill-transfer" aria-hidden="true"></i></span>
                    <p className="text-[11px] font-semibold tx-mut uppercase tracking-widest">Executado</p>
                  </div>
                  <p className="font-display font-bold text-[1.6rem] mt-2 c-des">{brl(resumo.des)}</p>
                  <Delta valor={dDes} bomQuandoSobe={false} rotulo={rotuloVs} />
                  <p className="text-xs tx-faint mt-0.5">despesa primária total</p>
                  <div className="mt-2"><Spark id="kdes" values={resumo.rows.map((r) => r.despesa)} color="#F43F5E" /></div>
                </div>
                <div className="panel p-5">
                  <div className="flex items-center gap-2.5">
                    <span className="kpi-ic c-warn"><i className="fa-solid fa-scale-balanced" aria-hidden="true"></i></span>
                    <p className="text-[11px] font-semibold tx-mut uppercase tracking-widest">Resultado primário</p>
                  </div>
                  <p className="font-display font-bold text-[1.6rem] mt-2" style={{ color: resColor }}>
                    {(pos ? "+" : "-") + brl(Math.abs(resumo.res)).slice(3)}
                  </p>
                  <p className="delta mt-1" style={{ color: dRes == null ? undefined : dRes >= 0 ? "var(--green)" : "var(--brick)" }}>
                    {dRes == null ? <span className="tx-faint font-medium">sem base anterior</span> : (<>{dRes >= 0 ? "▲" : "▼"} {brl(Math.abs(dRes))} <small>vs {rotuloVs}</small></>)}
                  </p>
                  <p className="text-xs tx-faint mt-0.5">
                    {pos ? "Superavit" : "Deficit"} ({((resumo.res / Math.max(1, resumo.rec)) * 100).toFixed(1)}% da receita)
                  </p>
                  <div className="mt-2">
                    <Spark id="kres" values={resumo.rows.map((r) => r.resultado_primario)} color={pos ? "#10B981" : "#F59E0B"} fill={false} />
                  </div>
                </div>
                <div className="panel p-5">
                  <div className="flex items-center gap-2.5">
                    <span className="kpi-ic c-blue"><i className="fa-solid fa-gauge-high" aria-hidden="true"></i></span>
                    <p className="text-[11px] font-semibold tx-mut uppercase tracking-widest">Gasto médio mensal</p>
                  </div>
                  <p className="font-display font-bold text-[1.6rem] mt-2 c-blue">{brl(resumo.med)}</p>
                  <Delta valor={dMed} bomQuandoSobe={false} rotulo={rotuloVs} />
                  <p className="text-xs tx-faint mt-0.5">média do período filtrado</p>
                  <div className="mt-2"><Spark id="kmed" values={resumo.rows.map((r) => r.despesa)} color="#0E7CB5" /></div>
                </div>
              </section>

              {/* destaque */}
              {insight && (
                <section className="panel p-4 sm:p-5 mt-3.5 flex items-center gap-3.5 flex-wrap" aria-live="polite" aria-label="Destaque">
                  <span className="rank-pos !w-8 !h-8" aria-hidden="true">
                    <i className="fa-solid fa-lightbulb text-[13px]"></i>
                  </span>
                  <p className="text-[0.95rem] flex-1 min-w-[220px] leading-relaxed">{insight.html}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-ghost !py-2 !px-3.5 text-sm"
                      onClick={() => setInsightIdx((i) => (i + 1) % insights.length)}
                    >
                      <i className="fa-solid fa-shuffle" aria-hidden="true"></i>Próximo
                    </button>
                    <button
                      type="button"
                      className="btn-ghost !py-2 !px-3.5 text-sm"
                      onClick={() => { copiar(insight.txt); setCopiado(true); setTimeout(() => setCopiado(false), 1600); }}
                    >
                      <i className={`fa-solid ${copiado ? "fa-check" : "fa-copy"}`} aria-hidden="true"></i>
                      <span className="hidden sm:inline">{copiado ? "Copiado!" : "Copiar"}</span>
                    </button>
                  </div>
                </section>
              )}

              <ErrorBoundary><Suspense fallback={<Skeleton />}><Panorama data={data} anos={anosSet} modo={modo} setModo={setModo} /></Suspense></ErrorBoundary>
              <AdSlot name="hero" />
              <ErrorBoundary><Suspense fallback={<Skeleton />}><ReceitasDespesas R={R} D={D} /></Suspense></ErrorBoundary>
              <AdSlot name="mid" />
              <ErrorBoundary><Suspense fallback={<Skeleton />}><Orgaos todos={data.orgaos_todos} anos={anosSet} poderes={poderes} setPoderes={setPoderes} /></Suspense></ErrorBoundary>
              <ErrorBoundary><Suspense fallback={<Skeleton />}><Poderes podm={data.poderes} anos={anosSet} /></Suspense></ErrorBoundary>
              <AdSlot name="bottom" />
              <ErrorBoundary><Suspense fallback={<Skeleton />}><Metodologia /></Suspense></ErrorBoundary>
              <ErrorBoundary><Suspense fallback={<Skeleton />}><Privacidade /></Suspense></ErrorBoundary>
            </>
          )}
        </main>

        <footer style={{ borderTop: "1px solid var(--border)" }}>
          <div className="max-w-6xl mx-auto px-4 py-5 flex items-center gap-3 text-xs tx-mut flex-wrap">
            <BrandMark size={24} />
            <span>Observatório dos Dados · Tesouro Transparente (ODbL) + SIOP</span>
            <span className="ml-auto flex gap-4">
              <a href="#metodologia" className="hover:opacity-70 transition">Metodologia</a>
              <a href="#privacidade" className="hover:opacity-70 transition">Privacidade</a>
              <a href="#conteudo" className="hover:opacity-70 transition">Topo</a>
            </span>
          </div>
        </footer>
      </div>
      <ConsentBanner />
    </>
  );
}
