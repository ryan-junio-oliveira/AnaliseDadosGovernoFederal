import { SectionHead, Seg, SeloCobertura, useMediaQuery } from "../components/ui.jsx";
import { Bar, themed } from "../lib/charts.jsx";
import { PODERES, PODER_COR, agregarOrgaos, brl, cobertura, escalaParaValores, poderNome } from "../lib/data.js";
import { paraReais, tickMoeda } from "../lib/moeda.js";
import { useTheme } from "../lib/theme.jsx";
import { useMemo } from "react";

const RP_COR = { 6: "#0E7CB5", 7: "#7C5CBF", 8: "#D9A821", 9: "#D96C1E" };
const RP_NOME = { 6: "Individuais (RP 6)", 7: "Bancada estadual (RP 7)", 8: "Comissão (RP 8)", 9: "Relator-geral (RP 9)" };

/** Bloco próprio de emendas (SIOP por RP) dentro da seção Órgãos. */
function Emendas({ linhas, anos, defl, totalPago }) {
  const { theme } = useTheme();
  const fx = useMemo(() => cobertura(linhas, "ano"), [linhas]);
  const RPS = ["6", "7", "8", "9"];
  const porAno = useMemo(() => {
    const m = new Map();
    for (const r of linhas || []) {
      if (!anos.has(r.ano) || !RP_NOME[r.rp]) continue;
      const k = (defl?.fAno?.(r.ano) || 1);
      const a = m.get(r.ano) || { ano: r.ano, 6: 0, 7: 0, 8: 0, 9: 0 };
      a[r.rp] += (paraReais(r.pago) || 0) * k;
      m.set(r.ano, a);
    }
    return [...m.values()].sort((a, b) => a.ano - b.ano);
  }, [linhas, anos, defl]);
  const porRp = useMemo(() => RPS.map((rp) => ({
    rp, valor: porAno.reduce((t, a) => t + (a[rp] || 0), 0),
  })).filter((i) => i.valor > 0), [porAno]);
  const totEm = porRp.reduce((t, i) => t + i.valor, 0);
  const esc = useMemo(
    () => escalaParaValores([...porAno.flatMap((a) => RPS.map((rp) => a[rp] || 0)), totEm]),
    [porAno, totEm]
  );
  if (!porAno.length) return null;
  return (
    <div className="panel p-5 sm:p-6 mt-4">
      <h3 className="font-display font-semibold mb-1">
        Emendas parlamentares <span className="text-xs font-body font-normal tx-faint">pagas por ano e tipo · {esc.rotulo}{defl ? ` · ${defl.rotulo}` : ""}</span>{" "}
        <SeloCobertura faixa={fx} fonte="SIOP" parcial={!(fx.n > 0 && fx.anos.size >= 10)} />
      </h3>
      <div style={{ height: 320 }} className="mt-2">
        <Bar
          key={`eme-${theme}-${esc.unidade}-${defl ? "real" : "nom"}`}
          data={{
            labels: porAno.map((a) => a.ano),
            datasets: RPS.filter((rp) => porAno.some((a) => a[rp] > 0)).map((rp) => ({
              label: RP_NOME[rp], data: porAno.map((a) => a[rp] / esc.divisor),
              unit: esc.unidade, backgroundColor: RP_COR[rp], borderRadius: 3,
            })),
          }}
          options={themed(theme, {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            scales: {
              x: { stacked: true },
              y: { stacked: true, title: { display: true, text: esc.unidade }, ticks: { callback: tickMoeda } },
            },
          })}
        />
      </div>
      <p className="text-sm tx-mut mt-3 leading-relaxed">
        Total pago no período: <b style={{ color: "var(--text)" }}>{brl(totEm)}</b>
        {totalPago > 0 && <> · {((totEm / totalPago) * 100).toFixed(1).replace(".", ",")}% do pago total dos órgãos</>}
        .
      </p>
      <div className="flex flex-col gap-4 mt-3">
        {porRp.map((it) => (
          <div key={it.rp}>
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: RP_COR[it.rp] }}></span>
              <span className="text-sm flex-1 min-w-0 leading-snug" style={{ color: "var(--text)" }}>{RP_NOME[it.rp]}</span>
              <span className="text-sm text-right flex-none">
                <b style={{ color: "var(--text)" }}>{brl(it.valor)}</b>{" "}
                <span className="tx-faint">· {((it.valor / Math.max(1, totEm)) * 100).toFixed(1).replace(".", ",")}%</span>
              </span>
            </div>
            <div className="track" style={{ marginLeft: 22 }}>
              <div className="fill" style={{ width: `${((it.valor / Math.max(1, totEm)) * 100).toFixed(1)}%`, background: RP_COR[it.rp] }}></div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs tx-faint mt-3 leading-relaxed">
        RP 9 (relator-geral) só existe até 2021; RP 8 (comissão) ganha volume a partir de 2022. Execução do orçamento do próprio ano (SIOP) — restos pagos em anos seguintes saem no ano de origem.
      </p>
    </div>
  );
}

export default function Orgaos({ todos, anos, poderes, setPoderes, defl, emendas }) {
  const { theme } = useTheme();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const poderesSet = useMemo(() => new Set(poderes), [poderes]);
  const OT = useMemo(() => agregarOrgaos(todos, anos, poderesSet, defl?.fAno), [todos, anos, poderesSet, defl]);
  const TOP_N = isMobile ? 10 : 15;
  const TOP = useMemo(() => OT.slice(0, TOP_N), [OT, TOP_N]);
  const corta = (s) => {
    const lim = isMobile ? 22 : 34;
    return s.length > lim ? s.slice(0, lim - 1) + "…" : s;
  };

  const porPoder = useMemo(() => PODERES.map((p) => ({
    poder: p,
    valor: todos.filter((r) => anos.has(r.ano) && r.poder === p).reduce((a, b) => a + (paraReais(b.pago) || 0) * (defl?.fAno?.(b.ano) || 1), 0),
  })), [todos, anos, defl]);
  const maxTop = Math.max(1, TOP[0]?.valor || 1);
  const escTop = escalaParaValores(TOP.map((i) => i.valor));
  const totalPago = useMemo(() => OT.reduce((t, o) => t + o.valor, 0), [OT]);

  return (
    <section id="orgaos" className="scroll-mt-24">
      <SectionHead
        index="04"
        eyebrow="Execução por órgão superior"
        title="Todos os órgãos: Executivo, Legislativo e Judiciário"
      />
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {PODERES.map((p) => (
          <Seg key={p} active={poderes.includes(p)} onClick={() => setPoderes((s) => (s.includes(p) ? (s.length > 1 ? s.filter((x) => x !== p) : s) : [...s, p]))}>
            <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: PODER_COR[p] }}></span>
            {poderNome(p)}
          </Seg>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {porPoder.map(({ poder, valor }) => (
          <div key={poder} className="panel p-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: PODER_COR[poder] }}></span>
              <p className="text-[11px] font-semibold tx-mut uppercase tracking-widest">{poderNome(poder)}</p>
            </div>
            <p className="font-display font-bold text-xl mt-1.5" style={{ color: PODER_COR[poder] }}>{brl(valor)}</p>
            <p className="text-[11px] tx-faint">pagos no período filtrado</p>
          </div>
        ))}
      </div>
      <div className="panel p-5 sm:p-6 mt-4">
        <h3 className="font-display font-semibold mb-1">
          Maiores executores <span className="text-xs font-body font-normal tx-faint">valores pagos no período filtrado, {escTop.rotulo}{defl ? ` · ${defl.rotulo}` : ""}</span>
        </h3>
        <div style={{ height: isMobile ? 400 : 520 }} className="mt-2">
          <Bar
            key={`org-${theme}-${isMobile ? "m" : "d"}-${escTop.unidade}-${defl ? "real" : "nom"}`}
            data={{
              labels: TOP.map((i) => corta(i.nome)),
              datasets: [{ data: TOP.map((i) => i.valor / escTop.divisor), unit: escTop.unidade, backgroundColor: TOP.map((i) => PODER_COR[i.poder] || "#0E7CB5"), borderRadius: 6 }],
            }}
            options={themed(theme, {
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: "y",
              plugins: { legend: { display: false } },
              scales: { x: { title: { display: true, text: `${escTop.unidade} pagos` }, ticks: { callback: tickMoeda } } },
            })}
          />
        </div>
      </div>
      <Emendas linhas={emendas} anos={anos} defl={defl} totalPago={totalPago} />
      <div className="panel p-5 mt-4">
        <h3 className="font-display font-semibold mb-1">Ranking completo por órgão superior</h3>
        <p className="text-xs tx-faint mb-4">Fonte: SIOP — execução orçamentária (pago). Inclui juros, amortização da dívida, transferências e operações de crédito.</p>
        <div className="flex flex-col gap-4">
          {OT.length === 0 && <p className="text-sm tx-faint">Nenhum órgão no filtro.</p>}
          {OT.map((it, i) => (
            <div key={it.cod ?? `${it.nome}-${i}`}>
              <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                <span className="rank-pos">{i + 1}</span>
                <span className="text-sm flex-1 min-w-[140px] leading-snug" style={{ color: "var(--text)" }}>{it.nome}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ color: PODER_COR[it.poder], border: `1px solid ${PODER_COR[it.poder]}55` }}>
                  {poderNome(it.poder)}
                </span>
                <span className="text-sm text-right">
                  <b style={{ color: "var(--text)" }}>{brl(it.valor)}</b> <span className="tx-faint">· {it.pct}%</span>
                </span>
              </div>
              <div className="track" style={{ marginLeft: 42 }}>
                <div className="fill" style={{ width: `${((it.valor / maxTop) * 100).toFixed(1)}%`, background: PODER_COR[it.poder] }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
