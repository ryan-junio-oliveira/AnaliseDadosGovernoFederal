import { SectionHead } from "../components/ui.jsx";

const FONTES = [
  {
    icon: "fa-landmark",
    color: "#10B981",
    nome: "Tesouro Nacional — Resultado do Tesouro Nacional (RTN), Tabela 1.1",
    link: "https://www.tesourotransparente.gov.br/ckan/dataset/resultado-do-tesouro-nacional",
    linkLabel: "tesourotransparente.gov.br",
    badges: ["Receitas", "Despesas", "Resultado primário", "Poderes (agregado)"],
    itens: [
      "Série histórica mensal em XLSX (baixada via scripts/coleta.py), valores correntes em R$ milhões, regime de caixa, conceito “acima da linha”.",
      "Janela rolante de uma década: do ano atual menos 10 até o ano atual (ex.: 2016–2026 em 2026; 2017–2027 em 2027, automático). Receita líquida = receita total menos transferências a estados e municípios.",
      "Cobre: receita por tributo (IR, COFINS, PIS/Pasep, CSLL, IPI, IOF, Previdência, concessões, dividendos, royalties), grupos de despesa e o agregado Legislativo/Judiciário/MPU/DPU (item 4.3.12).",
      "Licença ODbL. Alimenta: mensal.json, anual.json, receitas.json, despesas.json, poderes.json.",
    ],
  },
  {
    icon: "fa-database",
    color: "#0E7CB5",
    nome: "SIOP — Dados Abertos do Orçamento Federal (RDF por exercício)",
    link: "https://www1.siop.planejamento.gov.br/siopdoc/doku.php/acesso_publico:dados_abertos",
    linkLabel: "siop.planejamento.gov.br",
    badges: ["Todos os órgãos superiores", "Todos os Poderes"],
    itens: [
      "Dumps N-Triples anuais loaAAAA.zip (~40 MB/ano), parseados por scripts/coleta_orgaos_todos.py (~9 milhões de triplas/ano). Anos = mesma janela rolante do RTN.",
      "Agregação por órgão superior: dotação inicial, empenhado, liquidado e pago — Executivo, Legislativo (Câmara, Senado, TCU), Judiciário (STF, STJ, JF, JT, JE…), MPU, CNMP e DPU.",
      "Conceito: execução orçamentária total (pago — inclui juros e amortização da dívida, transferências e operações de crédito).",
      "Alimenta: orgaos_todos.json (seção Órgãos).",
    ],
  },
  {
    icon: "fa-chart-line",
    color: "#10B981",
    nome: "Banco Central — SGS (Sistema Gerenciador de Séries Temporais)",
    link: "https://dadosabertos.bcb.gov.br/",
    linkLabel: "dadosabertos.bcb.gov.br",
    badges: ["IPCA", "Selic", "Dólar", "IBC-Br", "Dívidas % PIB"],
    itens: [
      "Séries mensais via API pública (SGS 433, 1, 432, 24364, 13762 e 4513), sem token. IPCA em 12 meses calculado aqui a partir da variação mensal. Ibovespa via Yahoo Finance (fechamento mensal ajustado ^BVSP; SGS 7 descontinuada).",
      "Alimenta: conj_mensal.json e conj_dividas.json (seção Conjuntura).",
    ],
  },
  {
    icon: "fa-building",
    color: "#7C5CBF",
    nome: "Serasa Experian — Indicador de Falências e Recuperações Judiciais",
    link: "https://www.serasaexperian.com.br/conteudos/indicadores-economicos/",
    linkLabel: "serasaexperian.com.br",
    badges: ["Pedidos RJ", "Falências"],
    itens: [
      "Planilha mensal com URL descoberta automaticamente na página de indicadores. Série de processos (não CNPJs) para comparabilidade histórica.",
      "Quebra metodológica em 2025 (processos × CNPJs) e defasagem de ~3 meses nos últimos pontos — sinalizado na seção Conjuntura.",
      "Alimenta: conj_empresas.json (aberturas × fechamentos vêm do Mapa de Empresas via data/manual/).",
    ],
  },
  {
    icon: "fa-handshake",
    color: "#0E7CB5",
    nome: "CVM — Ofertas públicas de distribuição (dados abertos)",
    link: "https://dados.cvm.gov.br/dataset/oferta-distrib",
    linkLabel: "dados.cvm.gov.br",
    badges: ["IPOs", "Volume R$"],
    itens: [
      "ZIP mensal com ofertas registradas (regime antigo + Resolução 160). IPO = oferta inicial de ações com registro encerrado; deduplicado por emissor (uma oferta tem várias linhas).",
      "Alimenta: conj_ipos.json — quantidade e volume por ano na seção Conjuntura.",
    ],
  },
  {
    icon: "fa-briefcase",
    color: "#0E7CB5",
    nome: "IBGE — PNAD Contínua trimestral (SIDRA 4095) + manuais",
    link: "https://sidra.ibge.gov.br/tabela/4095",
    linkLabel: "sidra.ibge.gov.br",
    badges: ["Desocupação", "Homicídios", "Empresas"],
    itens: [
      "Desocupação trimestral tentada via API SIDRA com fallback (mantém última coleta se a API recusar).",
      "Homicídios anuais (Atlas da Violência IPEA/FBSP) e abertas × fechadas (Mapa de Empresas) via data/manual/*.csv — 2 min/mês, documentado no script.",
      "Blocos só aparecem no front quando há dados.",
    ],
  },
];

const NOTAS = [
  {
    icon: "fa-diagram-project",
    color: "#0E7CB5",
    title: "Pipeline reprodutível",
    text: "Os scripts em scripts/ baixam as fontes oficiais e geram public/data/*.json, os únicos arquivos que esta página lê. Sem API intermediária: qualquer hospedagem estática (ex. Vercel) serve a aplicação. Para reatualizar: python scripts/atualizar.py.",
  },
  {
    icon: "fa-triangle-exclamation",
    color: "#F43F5E",
    title: "Limites",
    text: "RTN até jul/2026 e SIOP até o exercício vigente, valores nominais (sem IPCA). A seção Órgãos usa execução orçamentária total, enquanto as demais usam o conceito primário do RTN: os totais não são diretamente comparáveis.",
  },
];

export default function Metodologia() {
  return (
    <section id="metodologia" className="scroll-mt-24">
      <SectionHead
        index="08"
        eyebrow="Transparência"
        title="Metodologia e fontes"
      />
      <div className="panel p-5 sm:p-6">
        <h3 className="font-display font-semibold mb-4">
          <i className="fa-solid fa-list-ul mr-2 tx-mut"></i>
          Fontes de dados
        </h3>
        <ul className="flex flex-col gap-5">
          {FONTES.map((f) => (
            <li key={f.nome} className="flex gap-4">
              <span className="icon-chip flex-none">
                <i className={`fa-solid ${f.icon}`} style={{ color: f.color }}></i>
              </span>
              <div className="min-w-0">
                <p className="font-display font-semibold leading-snug">{f.nome}</p>
                <a
                  href={f.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs hover:opacity-75 transition"
                  style={{ color: f.color }}
                >
                  <i className="fa-solid fa-arrow-up-right-from-square mr-1"></i>
                  {f.linkLabel}
                </a>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {f.badges.map((b) => (
                    <span key={b} className="chip !py-1 !px-2.5 !text-[11px]">{b}</span>
                  ))}
                </div>
                <ul className="mt-2.5 flex flex-col gap-1.5">
                  {f.itens.map((it, i) => (
                    <li key={i} className="text-sm tx-mut leading-relaxed flex gap-2">
                      <span className="tx-faint flex-none">—</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        {NOTAS.map((c) => (
          <div key={c.title} className="panel p-5">
            <i className={`fa-solid ${c.icon} text-xl`} style={{ color: c.color }}></i>
            <h3 className="font-display font-semibold mt-2">{c.title}</h3>
            <p className="text-sm tx-mut mt-1 leading-relaxed">{c.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
