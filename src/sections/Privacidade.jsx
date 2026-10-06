import { SectionHead } from "../components/ui.jsx";

export default function Privacidade() {
  return (
    <section id="privacidade" className="scroll-mt-24">
      <SectionHead
        index="10"
        eyebrow="LGPD e cookies"
        title="Privacidade e anúncios"
      />
      <div className="panel p-5 sm:p-6 text-sm tx-mut leading-relaxed flex flex-col gap-3">
        <p>
          Este painel <b style={{ color: "var(--text)" }}>não coleta dados pessoais</b>: filtros de ano e
          tema ficam salvos apenas no seu navegador (localStorage) e nunca saem do seu dispositivo.
        </p>
        <p>
          Para manter o projeto no ar, pretendemos exibir <b style={{ color: "var(--text)" }}>anúncios do Google AdSense</b>.
          Quando ativos, o Google pode usar cookies para personalizar anúncios e medir audiência
          (inclusive DoubleClick). Você pode <b style={{ color: "var(--text)" }}>aceitar ou recusar</b> no aviso
          exibido na primeira visita — sem aceitar, nenhum script de anúncio é carregado.
        </p>
        <p>
          Para alterar sua escolha depois, limpe os dados deste site no navegador (a pergunta aparece de novo).
          Dúvidas sobre dados? Fale pelo canal indicado no repositório do projeto.
        </p>
        <p className="text-xs tx-faint">
          Base legal: consentimento (art. 8º da LGPD). Tráfego medido apenas de forma agregada pela hospedagem (Vercel).
        </p>
      </div>
    </section>
  );
}
