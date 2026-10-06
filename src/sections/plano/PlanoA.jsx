import { SectionHead, useMediaQuery } from "../../components/ui.jsx";
import { useTheme } from "../../lib/theme.jsx";
import { DESAFIOS, INDICADORES, TIPOS } from "./dados.js";

export function TipoChip({ tipo }) {
  const t = TIPOS[tipo];
  if (!t) return null;
  return (
    <span className="chip" title={t.desc} style={{ color: t.cor, borderColor: `${t.cor}55` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.cor }}></span>
      {t.rotulo}
    </span>
  );
}

function HeroDecor() {
  // Rede abstrata Brasil: nós (cidades/portos/usinas/hubs) + conexões. SVG puro, animação sutil.
  const nos = [[8, 30], [22, 18], [35, 32], [48, 22], [62, 30], [74, 20], [86, 34], [30, 55], [45, 62], [58, 52], [70, 64], [20, 72], [40, 80], [55, 78], [68, 84], [82, 72]];
  const lig = [[0, 1], [1, 3], [2, 3], [3, 4], [4, 5], [5, 6], [0, 7], [2, 7], [7, 8], [8, 9], [9, 10], [4, 9], [10, 11], [7, 11], [8, 12], [12, 13], [13, 14], [10, 14], [14, 15], [6, 10]];
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" role="img" aria-label="Rede conectando cidades, portos, energia e tecnologia pelo Brasil" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="p2040bg" cx="50%" cy="40%" r="80%">
          <stop offset="0%" stopColor="#0E7CB5" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0E7CB5" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#p2040bg)" />
      {lig.map(([a, b], i) => (
        <line key={i} x1={nos[a][0]} y1={nos[a][1]} x2={nos[b][0]} y2={nos[b][1]}
          stroke="#0E7CB5" strokeOpacity="0.5" strokeWidth="0.35" strokeDasharray="1.5 1">
          <animate attributeName="stroke-opacity" values="0.2;0.6;0.2" dur={`${3 + (i % 4)}s`} repeatCount="indefinite" />
        </line>
      ))}
      {nos.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={i % 4 === 0 ? 1.6 : 1} fill={i % 4 === 0 ? "#D9A821" : "#0E7CB5"} fillOpacity="0.9">
            <animate attributeName="r" values={i % 4 === 0 ? "1.4;1.9;1.4" : "0.9;1.2;0.9"} dur={`${2.5 + (i % 3)}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}
    </svg>
  );
}

export function PlanoHero({ onConhecer, onMetas }) {
  useTheme();
  return (
    <section id="plano-topo" className="scroll-mt-24 relative overflow-hidden rounded-2xl mt-4" style={{ border: "1px solid var(--border)" }}>
      <div className="absolute inset-0" aria-hidden="true"><HeroDecor /></div>
      <div className="absolute inset-0" aria-hidden="true" style={{ background: "linear-gradient(180deg, transparent 30%, var(--nav) 130%)" }}></div>
      <div className="relative px-5 py-14 sm:px-10 sm:py-20 max-w-3xl">
        <p className="chip mb-4">Proposta hipotética · tecnocrática · apartidária</p>
        <h1 className="font-display font-bold leading-none" style={{ fontSize: "clamp(2.6rem, 8vw, 5rem)" }}>
          BRASIL <span style={{ color: "#0E7CB5" }}>2040</span>
        </h1>
        <p className="tx-mut text-base sm:text-lg mt-4 leading-relaxed">
          Um projeto de longo prazo para transformar produtividade, educação, tecnologia,
          infraestrutura e qualidade de vida em desenvolvimento sustentável.
        </p>
        <div className="flex gap-2.5 mt-6 flex-wrap">
          <button type="button" className="btn-ghost !py-3 !px-6 font-semibold" onClick={onConhecer}>
            Conheça o plano <i className="fa-solid fa-arrow-down ml-1" aria-hidden="true"></i>
          </button>
          <button type="button" className="btn-ghost !py-3 !px-6" onClick={onMetas}>
            Ver metas 2040
          </button>
        </div>
        <p className="text-xs tx-faint mt-5 leading-relaxed">
          Sem partido, sem candidato, sem slogan eleitoral. Números com fonte; propostas marcadas como propostas; metas marcadas como metas.
        </p>
      </div>
    </section>
  );
}

export function PlanoNumeros() {
  return (
    <section id="plano-numeros" className="scroll-mt-24">
      <SectionHead index="P1" eyebrow="Diagnóstico" title="O Brasil em números" />
      <p className="text-xs tx-faint -mt-2 mb-3">Cada cartão: <TipoChip tipo="DADO" /> valor + ano + fonte com link.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {INDICADORES.map((d) => (
          <div key={d.nome} className="panel p-5">
            <p className="text-[11px] font-semibold tx-mut uppercase tracking-widest">{d.nome}</p>
            <p className="font-display font-bold text-[1.45rem] mt-1.5" style={{ color: "var(--text)" }}>{d.valor}</p>
            <p className="text-xs tx-faint mt-1">{d.ano} · {d.fonte}</p>
            <a href={d.link} target="_blank" rel="noreferrer" className="text-xs c-blue hover:opacity-75 transition">
              <i className="fa-solid fa-arrow-up-right-from-square mr-1"></i>Fonte oficial
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PlanoDesafio() {
  useTheme();
  return (
    <section id="plano-desafio" className="scroll-mt-24">
      <SectionHead index="P2" eyebrow="Diagnóstico" title="O desafio" />
      <div className="grid md:grid-cols-2 gap-4">
        {DESAFIOS.map((d) => (
          <div key={d.area} className="panel p-5">
            <p className="font-display font-semibold flex items-center gap-2">
              <i className={`fa-solid ${d.icon} c-blue`} aria-hidden="true"></i>{d.area}
            </p>
            <ul className="mt-2.5 flex flex-col gap-1.5">
              {d.pontos.map((p, i) => (
                <li key={i} className="text-sm tx-mut leading-relaxed flex gap-2">
                  <span className="tx-faint flex-none">—</span><span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
