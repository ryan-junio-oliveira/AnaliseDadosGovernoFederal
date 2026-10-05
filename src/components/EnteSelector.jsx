import { useState } from "react";
import { ENTES } from "../lib/entes.js";

/**
 * Seletor de ente federativo (União hoje; 26 estados + DF em breve).
 * Não quebra o painel atual: UFs indisponíveis ficam desabilitadas
 * com tooltip, preparando a URL futura /?ente={sigla}.
 */
export default function EnteSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const atual = ENTES.find((e) => e.id === value) || ENTES[0];
  const disponiveis = ENTES.filter((e) => e.status === "disponivel").length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="segbtn"
        title={`${disponiveis} de ${ENTES.length} entes com dados`}
      >
        <i className="fa-solid fa-map-location-dot mr-1.5" aria-hidden="true"></i>
        {atual.sigla} · {atual.nome.split(" (")[0]}
        <i className={`fa-solid fa-chevron-down ml-1.5 text-[10px] transition ${open ? "rotate-180" : ""}`} aria-hidden="true"></i>
      </button>
      {open && (
        <>
          <button
            aria-label="Fechar seleção de ente"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            onClick={() => setOpen(false)}
            tabIndex={-1}
          />
          <div role="listbox" aria-label="Selecionar ente federativo"
            className="absolute right-0 z-50 mt-2 w-72 max-h-80 overflow-auto panel p-2">
            <p className="text-[11px] tx-faint px-2 py-1.5">
              {disponiveis} disponível · {ENTES.length - disponiveis} em breve (SICONFI)
            </p>
            {ENTES.map((e) => {
              const ok = e.status === "disponivel";
              return (
                <button
                  key={e.id}
                  role="option"
                  aria-selected={e.id === value}
                  disabled={!ok}
                  title={ok ? `Ver dados de ${e.nome}` : `${e.nome} — em breve via ${e.fonte}`}
                  onClick={() => { onChange(e.id); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm flex items-center gap-2 transition ${e.id === value ? "font-bold" : ""} ${ok ? "hover:bg-white/5 cursor-pointer" : "opacity-45 cursor-not-allowed"}`}
                  style={e.id === value ? { background: "rgba(16,185,129,.12)" } : undefined}
                >
                  <span className="font-mono text-xs w-7 flex-none tx-mut">{e.sigla}</span>
                  <span className="flex-1 truncate" style={{ color: "var(--text)" }}>{e.nome}</span>
                  {!ok && <span className="text-[10px] chip !py-0.5 !px-2">em breve</span>}
                  {ok && <i className="fa-solid fa-check text-emerald-500 text-xs" aria-hidden="true"></i>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
