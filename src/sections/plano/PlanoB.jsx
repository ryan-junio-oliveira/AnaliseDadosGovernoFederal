import { SectionHead } from "../../components/ui.jsx";
import { CADEIA_AGRO, CADEIA_PRODUTIVIDADE, CADEIA_VALOR, ESTADO_FLUXO, MISSOES } from "./dados.js";
import { TipoChip } from "./PlanoA.jsx";

function Cadeia({ titulo, itens }) {
  return (
    <div className="panel p-5">
      <h3 className="font-display font-semibold mb-3">{titulo}</h3>
      <div className="flex flex-col gap-1.5" role="list" aria-label={titulo}>
        {itens.map((it, i) => (
          <div key={it} role="listitem">
            <div className="chip !text-[0.72rem] !py-2 !px-3 w-full !justify-start" style={{ color: "var(--text)" }}>
              <span className="rank-pos !w-6 !h-6 !text-[11px]">{i + 1}</span>{it}
            </div>
            {i < itens.length - 1 && (
              <div className="text-center tx-faint leading-none py-0.5" aria-hidden="true">
                <i className="fa-solid fa-arrow-down text-xs"></i>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlanoMissoes() {
  return (
    <section id="plano-missoes" className="scroll-mt-24">
      <SectionHead index="P3" eyebrow="Soluções" title="As 10 grandes missões" />
      <p className="text-xs tx-faint -mt-2 mb-3">Tudo abaixo é <TipoChip tipo="PROPOSTA" /> — medida sugerida, não política vigente.</p>
      <div className="flex flex-col gap-4">
        {MISSOES.map((m) => (
          <article key={m.n} className="panel p-5 sm:p-6" aria-label={`Missão ${m.n}: ${m.nome}`}>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="rank-pos !w-10 !h-10 !text-sm" style={{ color: m.cor, borderColor: `${m.cor}66` }}>{m.n}</span>
              <div className="flex-1 min-w-[180px]">
                <p className="text-[11px] font-semibold tx-mut uppercase tracking-widest">{m.nome}</p>
                <h3 className="font-display font-bold text-xl leading-tight">{m.titulo}</h3>
              </div>
              <i className={`fa-solid ${m.icon} text-2xl`} style={{ color: m.cor }} aria-hidden="true"></i>
            </div>
            <p className="text-sm tx-mut mt-2 leading-relaxed"><b style={{ color: "var(--text)" }}>Objetivo:</b> {m.objetivo}</p>
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {m.projetos.map((p) => (
                <span key={p} className="chip !py-1.5 !px-3 !text-xs !normal-case !tracking-normal">{p}</span>
              ))}
            </div>
            {m.nota && <p className="text-xs tx-faint mt-3 leading-relaxed"><i className="fa-solid fa-scale-balanced mr-1.5"></i>{m.nota}</p>}
          </article>
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-4 mt-4">
        <Cadeia titulo="Produtividade vira serviço público" itens={CADEIA_PRODUTIVIDADE} />
        <Cadeia titulo="Do minério à exportação" itens={CADEIA_VALOR} />
        <Cadeia titulo="Do campo à tecnologia" itens={CADEIA_AGRO} />
      </div>
    </section>
  );
}

export function PlanoEstado() {
  return (
    <section id="plano-estado" className="scroll-mt-24">
      <SectionHead index="P4" eyebrow="Reforma" title="Estado eficiente" />
      <div className="grid md:grid-cols-2 gap-4">
        <Cadeia titulo="O caminho da reforma" itens={ESTADO_FLUXO} />
        <div className="panel p-5 sm:p-6">
          <h3 className="font-display font-semibold mb-3">Frentes <TipoChip tipo="PROPOSTA" /></h3>
          <ul className="flex flex-col gap-2">
            {["Digitalização de todos os serviços com identidade única", "Redução de burocracia com prazo legal para licenças", "Avaliação independente de cada programa (custo × resultado)", "Transparência ativa e auditoria contínua (TCU/CGU)", "Revisão de estruturas sobrepostas entre União, estados e municípios", "Integração de bases e sistemas (interoperabilidade por padrão)"].map((t) => (
              <li key={t} className="text-sm tx-mut leading-relaxed flex gap-2">
                <i className="fa-solid fa-check c-blue mt-1 flex-none" aria-hidden="true"></i><span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
