/**
 * Registro de entes federativos — base da expansão para 26 estados + DF.
 * Fase 1: só "uniao" tem dados (public/data/*.json). Os demais entram
 * como "em breve", já com slug, fonte e layout de arquivos definidos,
 * para o front e o ETL evoluírem sem quebra.
 *
 * Layout futuro por UF: public/data/uf/{slug}/{mensal,anual,receitas,despesas,poderes,orgaos}.json
 * Fonte prevista: SICONFI/STN (RREO + DCA) — ver docs/EXPANSAO-ESTADOS.md
 */

export const ENTES = [
  { id: "uniao", sigla: "BR", nome: "União (Governo Federal)", slug: "uniao", status: "disponivel", fonte: "RTN + SIOP" },
  { id: "ac", sigla: "AC", nome: "Acre", slug: "ac", status: "em-breve", fonte: "SICONFI/RREO" },
  { id: "al", sigla: "AL", nome: "Alagoas", slug: "al", status: "em-breve", fonte: "SICONFI/RREO" },
  { id: "ap", sigla: "AP", nome: "Amapá", slug: "ap", status: "em-breve", fonte: "SICONFI/RREO" },
  { id: "am", sigla: "AM", nome: "Amazonas", slug: "am", status: "em-breve", fonte: "SICONFI/RREO" },
  { id: "ba", sigla: "BA", nome: "Bahia", slug: "ba", status: "em-breve", fonte: "SICONFI/RREO" },
  { id: "ce", sigla: "CE", nome: "Ceará", slug: "ce", status: "em-breve", fonte: "SICONFI/RREO" },
  { id: "df", sigla: "DF", nome: "Distrito Federal", slug: "df", status: "em-breve", fonte: "SICONFI/RREO" },
  { id: "es", sigla: "ES", nome: "Espírito Santo", slug: "es", status: "em-breve", fonte: "SICONFI/RREO" },
  { id: "go", sigla: "GO", nome: "Goiás", slug: "go", status: "em-breve", fonte: "SICONFI/RREO" },
  { id: "ma", sigla: "MA", nome: "Maranhão", slug: "ma", status: "em-breve", fonte: "SICONFI/RREO" },
  { id: "mt", sigla: "MT", nome: "Mato Grosso", slug: "mt", status: "em-breve", fonte: "SICONFI/RREO" },
  { id: "ms", sigla: "MS", nome: "Mato Grosso do Sul", slug: "ms", status: "em-breve", fonte: "SICONFI/RREO" },
  { id: "mg", sigla: "MG", nome: "Minas Gerais", slug: "mg", status: "disponivel", fonte: "SICONFI/RREO" },
  { id: "pa", sigla: "PA", nome: "Pará", slug: "pa", status: "em-breve", fonte: "SICONFI/RREO" },
  { id: "pb", sigla: "PB", nome: "Paraíba", slug: "pb", status: "em-breve", fonte: "SICONFI/RREO" },
  { id: "pr", sigla: "PR", nome: "Paraná", slug: "pr", status: "disponivel", fonte: "SICONFI/RREO" },
  { id: "pe", sigla: "PE", nome: "Pernambuco", slug: "pe", status: "em-breve", fonte: "SICONFI/RREO" },
  { id: "pi", sigla: "PI", nome: "Piauí", slug: "pi", status: "em-breve", fonte: "SICONFI/RREO" },
  { id: "rj", sigla: "RJ", nome: "Rio de Janeiro", slug: "rj", status: "disponivel", fonte: "SICONFI/RREO" },
  { id: "rn", sigla: "RN", nome: "Rio Grande do Norte", slug: "rn", status: "em-breve", fonte: "SICONFI/RREO" },
  { id: "rs", sigla: "RS", nome: "Rio Grande do Sul", slug: "rs", status: "disponivel", fonte: "SICONFI/RREO" },
  { id: "ro", sigla: "RO", nome: "Rondônia", slug: "ro", status: "em-breve", fonte: "SICONFI/RREO" },
  { id: "rr", sigla: "RR", nome: "Roraima", slug: "rr", status: "em-breve", fonte: "SICONFI/RREO" },
  { id: "sc", sigla: "SC", nome: "Santa Catarina", slug: "sc", status: "em-breve", fonte: "SICONFI/RREO" },
  { id: "sp", sigla: "SP", nome: "São Paulo", slug: "sp", status: "disponivel", fonte: "SICONFI/RREO" },
  { id: "se", sigla: "SE", nome: "Sergipe", slug: "se", status: "em-breve", fonte: "SICONFI/RREO" },
  { id: "to", sigla: "TO", nome: "Tocantins", slug: "to", status: "em-breve", fonte: "SICONFI/RREO" },
];

export const ENTE_ATUAL = ENTES[0];

export function getEnte(id) {
  return ENTES.find((e) => e.id === id) || ENTE_ATUAL;
}

/** URL do JSON por ente: União lê /data/*.json; UFs lerão /data/uf/{slug}/*.json */
export function dataUrl(ente, file) {
  const base = import.meta.env.BASE_URL || "/";
  if (!ente || ente.id === "uniao") return `${base}data/${file}.json`;
  return `${base}data/uf/${ente.slug}/${file}.json`;
}
