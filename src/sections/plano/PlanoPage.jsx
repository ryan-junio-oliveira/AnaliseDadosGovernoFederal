import { Suspense } from "react";
import { ErrorBoundary, Skeleton } from "../../components/ui.jsx";
import { PlanoDesafio, PlanoHero, PlanoNumeros } from "./PlanoA.jsx";
import { PlanoEstado, PlanoMissoes } from "./PlanoB.jsx";
import {
  PlanoFinal,
  PlanoFiscal,
  PlanoMetas,
  PlanoMonitor,
  PlanoRiscos,
  PlanoSimulador,
  PlanoTimeline,
  PlanoTransparencia,
} from "./PlanoC.jsx";

function Bloco({ children }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

/** Página dedicada Plano Brasil 2040 — mesma identidade do painel (tema, painéis, chips). */
export default function PlanoPage() {
  const ir = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  return (
    <>
      <PlanoHero onConhecer={() => ir("plano-numeros")} onMetas={() => ir("plano-metas")} />
      <Bloco><PlanoNumeros /></Bloco>
      <Bloco><PlanoDesafio /></Bloco>
      <Bloco><PlanoMissoes /></Bloco>
      <Bloco><PlanoEstado /></Bloco>
      <Bloco><PlanoFiscal /></Bloco>
      <Bloco><PlanoTimeline /></Bloco>
      <Bloco><PlanoMetas /></Bloco>
      <Bloco><PlanoSimulador /></Bloco>
      <Bloco><PlanoMonitor /></Bloco>
      <Bloco><PlanoRiscos /></Bloco>
      <Bloco><PlanoTransparencia /></Bloco>
      <Bloco><PlanoFinal /></Bloco>
    </>
  );
}
