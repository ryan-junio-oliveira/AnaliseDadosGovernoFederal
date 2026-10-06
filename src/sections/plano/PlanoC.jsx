import { useMemo, useState } from "react";
import { SectionHead } from "../../components/ui.jsx";
import { CADEIA_FUNDO, FONTES_PAGAMENTO, FONTES_TRANSP, METAS_Q, METAS_QUALI, MONITOR, RISCOS, TIMELINE } from "./dados.js";
import { TipoChip } from "./PlanoA.jsx";

export function PlanoFiscal() {
  return (
    <section id="plano-fiscal" className="scroll-mt-24">
      <SectionHead index="P5" eyebrow="Financiamento" title="Como pagar?" />
      <p className="text-sm tx-mut -mt-2 mb-3 leading-relaxed">
        A pergunta obrigatória de qualquer plano sério. Cada fonte abaixo é <TipoChip tipo="PROPOSTA" /> —
        nenhum valor de economia é prometido sem estudo que o sustente.
      </p>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {FONTES_PAGAMENTO.map((f) => (
          <div key={f.nome} className="panel p-5">
            <p className="font-display font-semibold flex items-center gap-2">
              <i className={`fa-solid ${f.icon} c-blue`} aria-hidden="true"></i>{f.nome}
            </p>
            <p className="text-sm tx-mut mt-2 leading-relaxed">{f.desc}</p>
          </div>
        ))}
        <div className="panel p-5" style={{ borderColor: "#D9A82166" }}>
          <p className="font-display font-semibold flex items-center gap-2">
            <i className="fa-solid fa-vault" style={{ color: "#D9A821" }} aria-hidden="true"></i>Fundo Brasil
          </p>
          <p className="text-sm tx-mut mt-2 leading-relaxed">
            <TipoChip tipo="PROPOSTA" /> Fundo soberano hipotético com receitas extraordinárias de recursos naturais:
          </p>
          <p className="text-xs tx-mut mt-2 leading-loose">{CADEIA_FUNDO.join(" → ")}</p>
        </div>
      </div>
    </section>
  );
}

export function PlanoTimeline() {
  return (
    <section id="plano-timeline" className="scroll-mt-24">
      <SectionHead index="P6" eyebrow="Implementação" title="O caminho até 2040" />
      <div className="flex gap-3.5 overflow-x-auto pb-3" role="list" aria-label="Fases de implementação">
        {TIMELINE.map((t, i) => (
          <div key={t.fase} role="listitem" className="panel p-5 min-w-[260px] flex-1">
            <p className="rank-pos !w-8 !h-8 mb-2">{i + 1}</p>
            <p className="font-display font-semibold">{t.fase}</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {t.itens.map((it) => (
                <li key={it} className="text-sm tx-mut leading-relaxed flex gap-2">
                  <span className="tx-faint flex-none">—</span><span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PlanoMetas() {
  return (
    <section id="plano-metas" className="scroll-mt-24">
      <SectionHead index="P7" eyebrow="Objetivos" title="Onde queremos chegar?" />
      <p className="text-xs tx-faint -mt-2 mb-3">Tudo aqui é <TipoChip tipo="META" /> — objetivo proposto, não previsão.</p>
      <div className="grid md:grid-cols-2 gap-4">
        {METAS_Q.map((m) => (
          <div key={m.area} className="panel p-5">
            <p className="text-[11px] font-semibold tx-mut uppercase tracking-widest">{m.area}</p>
            <p className="font-display font-semibold mt-1 leading-snug">{m.objetivo}</p>
            <p className="text-xs tx-faint mt-2">{m.base}</p>
          </div>
        ))}
      </div>
      <div className="panel p-5 sm:p-6 mt-4">
        <h3 className="font-display font-semibold mb-3">Metas qualitativas</h3>
        <ul className="grid sm:grid-cols-2 gap-2">
          {METAS_QUALI.map((m) => (
            <li key={m} className="text-sm tx-mut leading-relaxed flex gap-2">
              <i className="fa-solid fa-star c-blue mt-1 flex-none" aria-hidden="true"></i><span>{m}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const BRL_TRI = (v) => `R$ ${(v / 1e12).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} tri`;

function Slider({ label, val, min, max, step, fmt, onChange }) {
  return (
    <label className="block">
      <span className="text-sm flex justify-between gap-2"><span className="tx-mut">{label}</span><b style={{ color: "var(--text)" }}>{fmt(val)}</b></span>
      <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => onChange(+e.target.value)} className="w-full mt-1" aria-label={label} />
    </label>
  );
}

export function PlanoSimulador() {
  const [g, setG] = useState(3.0);
  const [pop, setPop] = useState(203.1);
  const basePIB = 11.7447; // R$ tri, IBGE 2024
  const anos = 2040 - 2024;
  const res = useMemo(() => {
    const pib = basePIB * Math.pow(1 + g / 100, anos);
    return { pib, perCapita: (pib * 1e12) / (pop * 1e6) };
  }, [g, pop]);
  return (
    <section id="plano-simulador" className="scroll-mt-24">
      <SectionHead index="P8" eyebrow="Hipótese" title="E se o plano funcionar?" />
      <p className="text-xs tx-faint -mt-2 mb-3">
        <TipoChip tipo="SIMULACAO" /> Hipótese matemática, não previsão econômica. Fórmula aberta abaixo.
      </p>
      <div className="panel p-5 sm:p-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <Slider label="Crescimento real do PIB (% a.a.)" val={g} min={0} max={7} step={0.1} fmt={(v) => `${v.toFixed(1).replace(".", ",")}%`} onChange={setG} />
          <Slider label="População 2040 (milhões)" val={pop} min={200} max={230} step={0.5} fmt={(v) => `${v.toFixed(1).replace(".", ",")} mi`} onChange={setPop} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3.5 mt-4">
          <div className="panel p-5" style={{ background: "var(--chip-bg)" }}>
            <p className="text-[11px] font-semibold tx-mut uppercase tracking-widest">PIB em 2040</p>
            <p className="font-display font-bold text-[1.7rem] c-blue">{BRL_TRI(res.pib)}</p>
          </div>
          <div className="panel p-5" style={{ background: "var(--chip-bg)" }}>
            <p className="text-[11px] font-semibold tx-mut uppercase tracking-widest">PIB per capita em 2040</p>
            <p className="font-display font-bold text-[1.7rem] c-blue">R$ {Math.round(res.perCapita).toLocaleString("pt-BR")}</p>
          </div>
        </div>
        <p className="text-xs tx-faint mt-3 leading-relaxed">
          Premissas declaradas: PIB 2024 = R$ 11,7447 tri (IBGE); crescimento real constante de {g.toFixed(1).replace(".", ",")}% a.a. por 16 anos, sem ciclos, sem inflação no cálculo; população fixa em {pop.toFixed(1).replace(".", ",")} milhões. Dívida, emprego e renda dependem de hipóteses adicionais — por isso não são simulados aqui. <b>Dados insuficientes para estimar o resto sem um modelo macro completo.</b>
        </p>
      </div>
    </section>
  );
}

export function PlanoMonitor() {
  return (
    <section id="plano-monitor" className="scroll-mt-24">
      <SectionHead index="P9" eyebrow="Acompanhamento" title="Brasil 2040 — Monitor" />
      <p className="text-xs tx-faint -mt-2 mb-3">
        Sem percentuais fictícios: cada meta nasce em <b>linha de base</b> (⏳), com o que medir e onde. O status só muda com dado observado.
      </p>
      <div className="panel p-5 sm:p-6">
        <div className="flex flex-col gap-4">
          {MONITOR.map((m) => (
            <div key={m.area}>
              <div className="flex items-center gap-2.5">
                <span className="text-lg" aria-hidden="true">⏳</span>
                <span className="font-display font-semibold flex-1">{m.area}</span>
                <span className="chip">linha de base</span>
              </div>
              <p className="text-xs tx-faint mt-1" style={{ marginLeft: 42 }}>Medir: {m.medir}</p>
              <div className="track" style={{ marginLeft: 42 }}>
                <div className="fill" style={{ width: "4%", background: "var(--faint)" }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PlanoRiscos() {
  return (
    <section id="plano-riscos" className="scroll-mt-24">
      <SectionHead index="P10" eyebrow="Honestidade" title="Nenhum plano é perfeito" />
      <div className="flex flex-col gap-4">
        {RISCOS.map((r) => (
          <div key={r.proposta} className="panel p-5 sm:p-6">
            <h3 className="font-display font-semibold">{r.proposta}</h3>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mt-3 text-sm">
              {[["Benefícios", r.beneficios, "var(--green)"], ["Custos", r.custos, "var(--brick)"], ["Riscos", r.riscos, "#D9A821"], ["Condição", r.condicao, "var(--text)"]].map(([k, v, c]) => (
                <div key={k} className="flex gap-2 leading-relaxed">
                  <dt className="font-semibold flex-none w-24" style={{ color: c }}>{k}</dt>
                  <dd className="tx-mut">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PlanoTransparencia() {
  return (
    <section id="plano-fontes" className="scroll-mt-24">
      <SectionHead index="P11" eyebrow="Método" title="De onde vêm os dados?" />
      <div className="flex gap-1.5 flex-wrap mb-3">
        {Object.entries({ DADO: 0, PROPOSTA: 0, META: 0, SIMULACAO: 0 }).map(([k]) => (
          <TipoChip key={k} tipo={k} />
        ))}
      </div>
      <div className="panel p-5 sm:p-6">
        <ul className="flex flex-col gap-4">
          {FONTES_TRANSP.map((f) => (
            <li key={f.fonte} className="flex flex-col gap-1" style={{ borderTop: "1px solid var(--border-soft)", paddingTop: "0.9rem" }}>
              <p className="font-display font-semibold" style={{ color: "var(--text)" }}>{f.fonte}</p>
              <p className="text-sm tx-mut">{f.uso}</p>
              <a href={f.link} target="_blank" rel="noreferrer" className="text-xs c-blue hover:opacity-75 transition">
                <i className="fa-solid fa-arrow-up-right-from-square mr-1"></i>Fonte oficial
              </a>
            </li>
          ))}
        </ul>
        <p className="text-xs tx-faint mt-4 leading-relaxed">
          Regra do plano: sem fonte, sem número — escrevemos "dados insuficientes para estimativa". Divergências entre estudos são mostradas, nunca escondidas.
        </p>
      </div>
    </section>
  );
}

export function PlanoFinal() {
  return (
    <section id="plano-final" className="scroll-mt-24">
      <div className="panel p-6 sm:p-10 text-center">
        <p className="eyebrow" style={{ textAlign: "center" }}>O Brasil que queremos construir</p>
        <div className="max-w-2xl mx-auto mt-4 flex flex-col gap-3 text-[1.02rem] leading-relaxed tx-mut">
          <p>Um país onde nascer em uma região diferente não determine o futuro de uma pessoa.</p>
          <p>Onde uma criança tenha acesso a uma educação de qualidade.</p>
          <p>Onde uma empresa possa crescer sem enfrentar burocracia desnecessária.</p>
          <p>Onde inovação seja transformada em riqueza.</p>
          <p>Onde infraestrutura reduza distâncias.</p>
          <p>Onde segurança permita liberdade.</p>
          <p>Onde recursos naturais sejam transformados em patrimônio.</p>
          <p>Onde o Estado funcione.</p>
          <p>E onde crescimento econômico e qualidade de vida caminhem juntos.</p>
        </div>
        <h2 className="font-display font-bold text-[1.8rem] sm:text-[2.4rem] mt-8">BRASIL 2040</h2>
        <p className="tx-mut mt-1 tracking-wide">Planejamento. Produtividade. Oportunidade.</p>
      </div>
    </section>
  );
}
