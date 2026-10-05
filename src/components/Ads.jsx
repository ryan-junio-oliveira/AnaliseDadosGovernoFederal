import { useEffect, useState } from "react";

const CLIENT = import.meta.env.VITE_ADSENSE_CLIENT || "";

// Leitura ESTATICA obrigatoria: o Vite so substitui import.meta.env.NOME
// literal no build; acesso dinamico import.meta.env[variavel] volta vazio.
const SLOTS = {
  hero: import.meta.env.VITE_AD_SLOT_HERO || "",
  mid: import.meta.env.VITE_AD_SLOT_MID || "",
  bottom: import.meta.env.VITE_AD_SLOT_BOTTOM || "",
};
const KEY = "pfu-consent";

export function getConsent() {
  try {
    return localStorage.getItem(KEY); // "aceito" | "recusado" | null
  } catch {
    return null;
  }
}

/** Carrega o script do AdSense uma única vez, só após consentimento. */
let scriptOk = false;
function loadAdsense() {
  if (!CLIENT || scriptOk) return;
  if (document.querySelector('script[data-adsense]')) {
    scriptOk = true;
    return;
  }
  const s = document.createElement("script");
  s.async = true;
  s.dataset.adsense = "1";
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`;
  s.crossOrigin = "anonymous";
  document.head.appendChild(s);
  scriptOk = true;
}

/**
 * Slot de anúncio responsivo.
 * - Sem CLIENT configurado: não renderiza nada em produção (sem CLS);
 *   em dev mostra um placeholder para visualizar o espaço reservado.
 * - Com CLIENT + consentimento: <ins> padrão (auto, full-width responsive).
 * Uso: <AdSlot name="hero" /> (slot id via env VITE_AD_SLOT_HERO, etc.)
 */
export function AdSlot({ name }) {
  const slotId = SLOTS[name] || "";
  const [consent, setConsent] = useState(() => getConsent());

  useEffect(() => {
    const onConsent = (e) => setConsent(e.detail);
    window.addEventListener("pfu-consent", onConsent);
    return () => window.removeEventListener("pfu-consent", onConsent);
  }, []);

  useEffect(() => {
    if (consent === "aceito" && CLIENT && slotId) {
      loadAdsense();
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        /* bloco vazio: adblock ou script ainda carregando */
      }
    }
  }, [consent, slotId]);

  if (!CLIENT || !slotId || consent !== "aceito") {
    if (import.meta.env.DEV && CLIENT && slotId && consent !== "recusado") {
      return (
        <div className="ad-slot" aria-hidden="true">
          <span>Espaço reservado · anúncio {name} (consentimento pendente)</span>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="ad-slot" role="complementary" aria-label="Publicidade">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={CLIENT}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

/** Banner LGPD: só carrega anúncios após aceite explícito. */
export function ConsentBanner() {
  const [visivel, setVisivel] = useState(() => getConsent() === null);

  const escolher = (valor) => {
    try {
      localStorage.setItem(KEY, valor);
    } catch {
      /* sem storage: segue sem personalizar */
    }
    if (valor === "aceito") loadAdsense();
    setVisivel(false);
    window.dispatchEvent(new CustomEvent("pfu-consent", { detail: valor }));
  };

  if (!visivel) return null;

  return (
    <div className="consent" role="dialog" aria-live="polite" aria-label="Aviso de cookies e privacidade">
      <p>
        Usamos cookies para métricas e, no futuro, <b>anúncios do Google</b>.{" "}
        <a href="#privacidade">Saiba mais</a>.
      </p>
      <div className="consent-btns">
        <button type="button" className="btn-primary !py-2 !px-4 text-sm" onClick={() => escolher("aceito")}>
          Aceitar
        </button>
        <button type="button" className="btn-ghost !py-2 !px-4 text-sm" onClick={() => escolher("recusado")}>
          Recusar
        </button>
      </div>
    </div>
  );
}
