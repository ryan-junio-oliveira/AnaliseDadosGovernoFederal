import { SectionHead } from "../components/ui.jsx";

// Seção única de transparência: metodologia + fontes + institucional.
// (Antes existiam "Metodologia" e "Sobre" separadas listando as mesmas fontes
// com textos diferentes — fundidas aqui para eliminar a redundância.
// A âncora #sobre foi mantida no bloco institucional para compatibilidade.)
const FONTES = [
  {
    icon: "fa-landmark",
    color: "#10B981",
    nome: "Tesouro Nacional — Resultado do Tesouro Nacional (RTN), Tabela 1.1",
    link: "https://www.tesourotransparente.gov.br/ckan/dataset/resultado-do-tesouro-nacional",
    linkLabel: "tesourotransparente.gov.br",
    badges: ["Receitas", "Despesas", "Resultado primário", "Poderes (agregado)"],
    itens: [
      "Receita líquida, despesa primária e resultado mensal da União, por tributo e por grupo de despesa, além do agregado de custeio e capital do Legislativo, Judiciário, MPU e DPU.",
      "Série histórica mensal em XLSX (baixada via scripts/coleta.py), valores correntes em R$ milhões, regime de caixa, conceito “acima da linha”.",
      "Janela rolante de uma década: do ano atual menos 10 até o ano atual (ex.: 2016–2026 em 2026; 2017–2027 em 2027, automático). Receita líquida = receita total menos transferências a estados e municípios.",
      "Cobre: receita por tributo (IR, COFINS, PIS/Pasep, CSLL, IPI, IOF, Previdência, concessões, dividendos, royalties), grupos de despesa e o agregado Legislativo/Judiciário/MPU/DPU (item 4.3.12).",
      "Atualização mensal, conforme calendário do Tesouro. Licença ODbL. Alimenta: mensal.json, anual.json, receitas.json, despesas.json, poderes.json.",
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
      "Execução orçamentária por órgão superior (dotação, empenhado, liquidado e pago) de todos os Poderes — base da seção Órgãos.",
      "Dumps N-Triples anuais loaAAAA.zip (~40 MB/ano), parseados por scripts/coleta_orgaos_todos.py (~9 milhões de triplas/ano). Anos = mesma janela rolante do RTN.",
      "Agregação por órgão superior: dotação inicial, empenhado, liquidado e pago — Executivo, Legislativo (Câmara, Senado, TCU), Judiciário (STF, STJ, JF, JT, JE…), MPU, CNMP e DPU.",
      "Conceito: execução orçamentária total (pago — inclui juros e amortização da dívida, transferências e operações de crédito).",
      "Atualização anual, por exercício da LOA. Alimenta: orgaos_todos.json (seção Órgãos) e emendas.json (RP 6/7/8/9 — bloco Emendas).",
    ],
  },
  {
    icon: "fa-map",
    color: "#0E7CB5",
    nome: "SICONFI / STN — RREO Anexo 1 (estados e DF)",
    link: "https://apidatalake.tesouro.gov.br/docs/siconfi/",
    linkLabel: "apidatalake.tesouro.gov.br",
    badges: ["SP, RJ, MG, RS, PR disponíveis", "demais em coleta"],
    itens: [
      "Balanço orçamentário bimestral dos estados e do DF (receita realizada × despesa paga) — base da expansão para as UFs. Disponíveis: SP, RJ, MG, RS, PR (2016→, RREO Anexo 1).",
      "Resultado das UFs é orçamentário (não primário) e a série é bimestral (mês = 1º mês do bimestre).",
      "Atualização bimestral, conforme homologação dos entes no SICONFI. API pública, sem autenticação.",
    ],
  },
  {
    icon: "fa-chart-line",
    color: "#10B981",
    nome: "Banco Central — SGS (Sistema Gerenciador de Séries Temporais)",
    link: "https://dadosabertos.bcb.gov.br/",
    linkLabel: "dadosabertos.bcb.gov.br",
    badges: ["IPCA", "Selic", "Dólar", "Ibovespa"],
    itens: [
      "Séries mensais de preços, juros e câmbio — base da seção Economia; o IPCA mensal também alimenta o botão Real (IPCA), que reexpressa os valores fiscais.",
      "Séries mensais via API pública (SGS 433, 1 e 432), sem token. IPCA em 12 meses calculado aqui. Ibovespa via Yahoo Finance (fechamento mensal ajustado ^BVSP).",
      "Atualização diária/mensal, conforme a série. Licença ODbL. Alimenta: conj_mensal.json.",
    ],
  },
  {
    icon: "fa-users",
    color: "#64748B",
    nome: "SICONFI / RREO — população de referência",
    link: "https://apidatalake.tesouro.gov.br/docs/siconfi/",
    linkLabel: "apidatalake.tesouro.gov.br",
    badges: ["Per capita"],
    itens: [
      "População informada no próprio RREO, usada como referência para a receita por habitante no comparador entre entes.",
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
    text: "RTN até jul/2026 e SIOP até o exercício vigente. O padrão é nominal (corrente); o botão Real (IPCA) reexpressa a década em R$ do último mês do filtro. A seção Órgãos usa execução orçamentária total, enquanto as demais usam o conceito primário do RTN: os totais não são diretamente comparáveis.",
  },
];

export default function Metodologia() {
  return (
    <section id="metodologia" className="scroll-mt-24">
      <SectionHead
        index="08"
        eyebrow="Transparência"
        title="Metodologia, fontes e sobre"
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

      {/* Bloco institucional (antiga seção "Sobre", fundida aqui). A âncora
          #sobre é mantida para não quebrar links existentes. */}
      <span id="sobre" className="scroll-mt-24 block" aria-hidden="true" />
      <div className="panel p-5 sm:p-6 mt-4 text-sm tx-mut leading-relaxed flex flex-col gap-3">
        <h3 className="font-display font-semibold" style={{ color: "var(--text)" }}>
          <i className="fa-solid fa-circle-info mr-2 tx-mut"></i>
          Sobre o Observatório
        </h3>
        <p>
          O <b style={{ color: "var(--text)" }}>Observatório dos Dados</b> é uma iniciativa{" "}
          <b style={{ color: "var(--text)" }}>independente e sem fins lucrativos</b>, sem vínculo com
          governos, partidos ou empresas. Existe para traduzir as contas públicas em visualizações
          que qualquer pessoa entende: quanto se arrecada, quanto se gasta e onde o dinheiro vai parar.
        </p>
        <p>
          A plataforma é mantida com recursos próprios e, para cobrir custos de infraestrutura
          (domínio e hospedagem), exibe <b style={{ color: "var(--text)" }}>anúncios do Google</b>.
          Não há paywall, não vendemos dados e não coletamos dados pessoais — o detalhamento
          está em <a href="#privacidade" style={{ color: "var(--text)", textDecoration: "underline" }}>Privacidade e anúncios</a>.
        </p>
        <p>
          <b style={{ color: "var(--text)" }}>Todos os números vêm de fontes oficiais do próprio governo</b>,
          federal ou estadual. Não fazemos projeções nem estimativas próprias: o que você vê aqui é
          o dado publicado, apenas reorganizado. Quando uma fonte republica valores, atualizamos
          junto na rotina semanal.
        </p>
      </div>
    </section>
  );
}
