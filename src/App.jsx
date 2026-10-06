import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import EnteSelector from "./components/EnteSelector.jsx";
import { AdSlot, ConsentBanner } from "./components/Ads.jsx";
import { BrandMark, ErrorBoundary, Seg, Skeleton, Spark } from "./components/ui.jsx";
import { PODERES, YEARS, agregar, anosComDados, brl, comparativo, construirDeflator, intervaloDados, periodicidade, resumoMensal, useData, varPct } from "./lib/data.js";
import { getEnte } from "./lib/entes.js";
import { useTheme } from "./lib/theme.jsx";

const Panorama = lazy(() => import("./sections/Panorama.jsx"));
const Economia = lazy(() => import("./sections/Economia.jsx"));
const ReceitasDespesas = lazy(() => import("./sections/ReceitasDespesas.jsx"));
const Orgaos = lazy(() => import("./sections/Orgaos.jsx"));
const Poderes = lazy(() => import("./sections/Poderes.jsx"));
const Comparar = lazy(() => import("./sections/Comparar.jsx"));
const Metodologia = lazy(() => import("./sections/Metodologia.jsx"));
const Privacidade = lazy(() => import("./sections/Privacidade.jsx"));
const PlanoPage = lazy(() => import("./sections/plano/PlanoPage.jsx"));

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

function exportCSV(rows, anos, enteId, bimestral) {
  const head = bimestral ? "mes;bimestre;receita;despesa;resultado_primario\n" : "mes;receita;despesa;resultado_primario\n";
  const body = rows
    .map((r) => (bimestral
      ? [r.mes, r.bimestre ?? "", Math.round(r.receita), Math.round(r.despesa), Math.round(r.resultado_primario)].join(";")
      : [r.mes, Math.round(r.receita), Math.round(r.despesa), Math.round(r.resultado_primario)].join(";")))
    .join("\n");
  const blob = new Blob(["\uFEFF" + head + body], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `observatorio-fiscal-${enteId}-${[...anos].sort().join("-")}.csv`;
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
  const [real, setReal] = useState(false); // false = nominal (corrente); true = R$ do mês-base (IPCA)
  const [poderes, setPoderes] = useState(PODERES);
  const [insightIdx, setInsightIdx] = useState(0);
  const [copiado, setCopiado] = useState(false);
  // Visão: painel fiscal (padrão) ou página dedicada Plano Brasil 2040.
  const [visao, setVisao] = useState(() => {
    try { return localStorage.getItem("pfu-visao") || "painel"; } catch { return "painel"; }
  });
  useEffect(() => {
    try { localStorage.setItem("pfu-visao", visao); } catch { /* sem storage */ }
    document.title = visao === "plano"
      ? "Brasil 2040 — Um Projeto de País"
      : "Observatório dos Dados — Receitas, despesas e resultado fiscal";
  }, [visao]);
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
  // Textos por ente: União usa "a União/da União/primário"; UFs usam o nome
  // próprio e "resultado orçamentário" (RREO: receita realizada − despesa paga).
  // (Declarados aqui em cima: o useMemo dos insights, abaixo, já os utiliza.)
  const eUniao = ente.id === "uniao";
  const curto = ente.nome.split(" (")[0];
  const sujeito = eUniao ? "a União" : curto;
  const deEnte = eUniao ? "da União" : ente.id === "df" ? "do Distrito Federal" : `de ${curto}`;
  const rotResultado = eUniao ? "Resultado primário" : "Resultado orçamentário";
  // Deflator IPCA: só existe com conjuntura (União). Sem ele, tudo é nominal.
  const temDeflator = !!data?.conj_mensal?.some((r) => Number.isFinite(r.ipca_m));
  const defl = useMemo(
    () => (real && data ? construirDeflator(data.conj_mensal, anosSet) : null),
    [real, data, anosSet]
  );
  const resumo = useMemo(
    () => (data ? resumoMensal(data.mensal, anosSet, defl?.f, periodicidade(data.mensal)) : null),
    [data, anosSet, defl]
  );
  const comp = useMemo(
    () => (data ? comparativo(data.mensal, anosSet, defl?.f, periodicidade(data.mensal)) : null),
    [data, anosSet, defl]
  );
  const { R, D, insights } = useMemo(() => {
    if (!data || !resumo) return { R: [], D: [], insights: [] };
    const R = agregar(data.receitas, "tipo", anosSet, defl?.f);
    const D = agregar(data.despesas, "funcao", anosSet, defl?.f);
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
        { html: (<>De {periodo}, {sujeito} gastou <b>{brl(des)}</b> e arrecadou <b>{brl(rec)}</b>.</>), txt: `De ${periodo}, ${sujeito} gastou ${brl(des)} e arrecadou ${brl(rec)}.` },
        { html: (<>O maior destino do gasto é <b>{D[0]?.nome}</b>, com {D[0]?.pct}% do total aplicado.</>), txt: `O maior destino do gasto é ${D[0]?.nome}, com ${D[0]?.pct}% do total aplicado.` },
        { html: (<>A principal fonte de receita é <b>{R[0]?.nome}</b>, com {R[0]?.pct}% da arrecadação.</>), txt: `A principal fonte de receita é ${R[0]?.nome}, com ${R[0]?.pct}% da arrecadação.` },
        { html: (<>{rotResultado} do período: <b>{brl(res)}</b> ({pctRes}% da receita).</>), txt: `${rotResultado} do período: ${brl(res)} (${pctRes}% da receita).` },
        { html: (<>Gasto médio mensal {deEnte}: <b>{brl(med)}</b>.</>), txt: `Gasto médio mensal {deEnte}: ${brl(med)}.` },
      ],
    };
  }, [data, resumo, anosSet, sujeito, deEnte, rotResultado]);

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
            <p className="text-[10px] tx-faint hidden min-[420px]:block">{eUniao ? "União" : ente.sigla} {intervalo?.anos || ""}</p>
          </div>
          <span className="ml-auto flex-none flex items-center gap-1.5">
            <button type="button" className={`segbtn${visao === "painel" ? " on" : ""}`} onClick={() => setVisao("painel")}>
              Painel
            </button>
            <button type="button" className={`segbtn${visao === "plano" ? " on" : ""}`} onClick={() => setVisao("plano")} title="Página dedicada ao Plano Brasil 2040">
              Plano 2040
            </button>
            {themeBtn}
          </span>
        </div>
      </header>

      <div>
        <main id="conteudo" className="max-w-6xl mx-auto px-4" style={{ paddingTop: headH + 8, paddingBottom: 104 }}>
          {visao === "plano" ? (
            <ErrorBoundary><Suspense fallback={<Skeleton />}><PlanoPage /></Suspense></ErrorBoundary>
          ) : (
            <>
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
                    {anosBtns.length} anos fiscais · {intervalo?.periodo || ""}
                  </span>
                </div>
                <YearFilter anos={anos} anosBtns={anosBtns} setAnos={setAnos} />
                <div className="flex items-center gap-1.5 flex-wrap">
                  {temDeflator && (
                    <>
                      <Seg active={!real} onClick={() => setReal(false)}>Nominal</Seg>
                      <Seg active={real} onClick={() => setReal(true)}>Real (IPCA)</Seg>
                    </>
                  )}
                  {real && defl && (
                    <span className="text-xs tx-faint">valores em {defl.rotulo}</span>
                  )}
                </div>
                <p className="text-xs tx-faint leading-relaxed">
                  O filtro de anos vale para a década fiscal (série bimestral nas UFs).
                </p>
              </section>

              {/* cabeçalho da página */}
              <section className="pt-6 lg:pt-8" aria-label="Resumo fiscal">
                <p className="dateline">Visão geral · {intervalo?.periodo || ""}</p>
                <div className="flex items-end justify-between gap-3 flex-wrap mt-1.5">
                  <h1 className="font-display font-bold text-[1.75rem] sm:text-[2.1rem] leading-none">
                    Resultado fiscal {deEnte}
                  </h1>
                  <div className="flex gap-2">
                    <button type="button" className="btn-ghost !py-2 !px-3.5 text-sm" onClick={() => exportCSV(resumo.rows, anos, ente.id, !eUniao)}>
                      <i className="fa-solid fa-download" aria-hidden="true"></i>CSV
                    </button>
                  </div>
                </div>
                <p className="tx-faint text-[13px] mt-2">
                  {eUniao
                    ? <>Receita líquida × despesa primária · {defl ? `valores em ${defl.rotulo} (IPCA)` : "valores correntes"} · RTN Tabela 1.1 + SIOP</>
                    : <>Receita realizada × despesa paga (bimestral) · valores correntes · RREO Anexo 1 · SICONFI</>}
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
                  <div className="mt-2"><Spark id="krec" values={resumo.rows.map((r) => r.receita * (defl?.f?.(r.mes) || 1))} color="#10B981" /></div>
                </div>
                <div className="panel p-5">
                  <div className="flex items-center gap-2.5">
                    <span className="kpi-ic c-des"><i className="fa-solid fa-money-bill-transfer" aria-hidden="true"></i></span>
                    <p className="text-[11px] font-semibold tx-mut uppercase tracking-widest">Executado</p>
                  </div>
                  <p className="font-display font-bold text-[1.6rem] mt-2 c-des">{brl(resumo.des)}</p>
                  <Delta valor={dDes} bomQuandoSobe={false} rotulo={rotuloVs} />
                  <p className="text-xs tx-faint mt-0.5">despesa primária total</p>
                  <div className="mt-2"><Spark id="kdes" values={resumo.rows.map((r) => r.despesa * (defl?.f?.(r.mes) || 1))} color="#F43F5E" /></div>
                </div>
                <div className="panel p-5">
                  <div className="flex items-center gap-2.5">
                    <span className="kpi-ic c-warn"><i className="fa-solid fa-scale-balanced" aria-hidden="true"></i></span>
                    <p className="text-[11px] font-semibold tx-mut uppercase tracking-widest">{rotResultado}</p>
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
                    <Spark id="kres" values={resumo.rows.map((r) => r.resultado_primario * (defl?.f?.(r.mes) || 1))} color={pos ? "#10B981" : "#F59E0B"} fill={false} />
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
                  <div className="mt-2"><Spark id="kmed" values={resumo.rows.map((r) => r.despesa * (defl?.f?.(r.mes) || 1))} color="#0E7CB5" /></div>
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

              <ErrorBoundary><Suspense fallback={<Skeleton />}><Panorama data={data} anos={anosSet} modo={modo} setModo={setModo} defl={defl} bimestral={!eUniao} per={periodicidade(data.mensal)} /></Suspense></ErrorBoundary>
              <AdSlot name="hero" />
              {R.length > 0 && D.length > 0 && (
              <ErrorBoundary><Suspense fallback={<Skeleton />}><ReceitasDespesas R={R} D={D} defl={defl} /></Suspense></ErrorBoundary>
              )}
              <AdSlot name="mid" />
              {data.orgaos_todos?.length > 0 && (
              <ErrorBoundary><Suspense fallback={<Skeleton />}><Orgaos todos={data.orgaos_todos} anos={anosSet} poderes={poderes} setPoderes={setPoderes} defl={defl} emendas={data.emendas || []} /></Suspense></ErrorBoundary>
              )}
              {data.poderes?.length > 0 && (
              <ErrorBoundary><Suspense fallback={<Skeleton />}><Poderes podm={data.poderes} anos={anosSet} defl={defl} /></Suspense></ErrorBoundary>
              )}
              <ErrorBoundary><Suspense fallback={<Skeleton />}><Comparar /></Suspense></ErrorBoundary>
              <AdSlot name="bottom" />
              {/* Economia (IPCA/Selic/dólar/Ibovespa) acima de Metodologia/fontes. */}
              <ErrorBoundary><Suspense fallback={<Skeleton />}><Economia data={data} anos={anosSet} /></Suspense></ErrorBoundary>
              <ErrorBoundary><Suspense fallback={<Skeleton />}><Metodologia /></Suspense></ErrorBoundary>
              <ErrorBoundary><Suspense fallback={<Skeleton />}><Privacidade /></Suspense></ErrorBoundary>
            </>
          )}
            </>
          )}
        </main>

        <footer className="fixed bottom-0 inset-x-0 z-40 backdrop-blur-md" style={{ background: "var(--nav)", borderTop: "1px solid var(--border)" }}>
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 text-xs tx-mut flex-wrap">
            <BrandMark size={24} />
            <span>Observatório dos Dados · Tesouro Transparente (ODbL) + SIOP</span>
            <span className="ml-auto flex gap-4">
              <button type="button" className="hover:opacity-70 transition" onClick={() => { setVisao("plano"); document.getElementById("conteudo")?.scrollIntoView(); }}>Plano 2040</button>
              <a href="#metodologia" className="hover:opacity-70 transition" onClick={() => setVisao("painel")}>Metodologia</a>
              <a href="#sobre" className="hover:opacity-70 transition">Sobre</a>
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
