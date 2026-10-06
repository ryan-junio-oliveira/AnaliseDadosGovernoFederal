import { Component, useEffect, useState } from "react";
import { Line } from "../lib/charts";
import { useTheme } from "../lib/theme";

/** true quando a media query bate; ex.: useMediaQuery("(max-width: 640px)") */
export function useMediaQuery(query) {
  const [match, setMatch] = useState(() =>
    typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(query);
    const onChange = (e) => setMatch(e.matches);
    setMatch(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [query]);
  return match;
}

export function SectionHead({ eyebrow, eyebrowColor, title, index }) {
  return (
    <div className="mt-12 mb-5">
      <p className="eyebrow" style={eyebrowColor ? { color: eyebrowColor } : undefined}>
        {index && <span className="secnum">{index}</span>}
        {eyebrow}
      </p>
      <h2 className="font-display font-bold text-[1.65rem] leading-tight mt-1">{title}</h2>
      <div className="rule-double mt-4" aria-hidden="true"></div>
    </div>
  );
}

/** Marca do Observatório: barras em tinta sobre esmeralda. */
export function BrandMark({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Marca do Observatório dos Dados">
      <rect width="100" height="100" rx="22" fill="#10B981" />
      <rect x="22" y="52" width="14" height="26" fill="#04120C" />
      <rect x="43" y="38" width="14" height="40" fill="#04120C" />
      <rect x="64" y="24" width="14" height="54" fill="#FAFAFA" />
    </svg>
  );
}

export function Seg({ active, onClick, children }) {
  return (
    <button
      type="button"
      className={`segbtn${active ? " on" : ""}`}
      onClick={onClick}
      aria-pressed={!!active}
    >
      {children}
    </button>
  );
}

/**
 * Selo de cobertura da base: separa o que é década fiscal completa
 * do que tem cobertura menor (ex.: Serasa 2024–2026, Atlas 2023–2024).
 * `parcial` pinta o selo de âmbar; sem ele, tom neutro.
 */
export function SeloCobertura({ faixa, fonte, parcial }) {
  if (!faixa || !faixa.n) return null;
  return (
    <span
      className={`chip${parcial ? " chip-warn" : ""}`}
      title={parcial ? "Não abrange a década fiscal completa" : "Cobre a década fiscal"}
    >
      <i className="fa-solid fa-calendar-days" aria-hidden="true"></i>
      {faixa.rotulo}{fonte ? ` · ${fonte}` : ""}
    </span>
  );
}

const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function Spark({ values, color, fill = true, height = 46, id }) {
  const { theme } = useTheme();
  if (!values?.length) return <div style={{ height }} aria-hidden="true" />;
  return (
    <div style={{ height }} role="img" aria-label="Tendência no período">
      <Line
        key={`${id}-${theme}`}
        data={{
          labels: values.map((_, i) => i),
          datasets: [
            {
              data: values,
              borderColor: color,
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.35,
              fill,
              backgroundColor: fill ? `${color}26` : "transparent",
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: { x: { display: false }, y: { display: false } },
          animation: reduceMotion ? false : { duration: 400 },
        }}
      />
    </div>
  );
}

/** Skeleton de carregamento — evita layout shift (CLS). */
export function Skeleton({ lines = 3 }) {
  return (
    <div className="panel p-6 mt-10" aria-busy="true" aria-label="Carregando dados">
      <div className="sk sk-title" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="sk" style={{ width: `${92 - i * 9}%` }} />
      ))}
      <style>{`.sk{height:14px;border-radius:8px;margin:10px 0;background:linear-gradient(90deg,var(--track) 25%,var(--border) 50%,var(--track) 75%);background-size:200% 100%;animation:sk 1.2s infinite}@keyframes sk{to{background-position:-200% 0}}.sk-title{height:22px;width:45%}@media (prefers-reduced-motion:reduce){.sk{animation:none}}`}</style>
    </div>
  );
}

export class ErrorBoundary extends Component {
  constructor(p) {
    super(p);
    this.state = { erro: null };
  }
  static getDerivedStateFromError(erro) {
    return { erro };
  }
  componentDidCatch(erro, info) {
    console.error("[Observatorio]", erro, info);
  }
  render() {
    if (this.state.erro) {
      return (
        <div className="panel p-10 mt-10 text-center" role="alert">
          <i className="fa-solid fa-triangle-exclamation mr-2" style={{ color: "var(--brick)" }} aria-hidden="true"></i>
          Algo falhou ao renderizar esta seção.
          <div className="mt-3">
            <button className="btn-ghost !py-2 !px-4 text-sm" onClick={() => this.setState({ erro: null })}>
              <i className="fa-solid fa-rotate-right"></i>Tentar novamente
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
