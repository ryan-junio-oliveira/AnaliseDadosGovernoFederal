import { SectionHead } from "../components/ui.jsx";

const FONTES = [
  {
    nome: "Tesouro Nacional — Resultado do Tesouro Nacional (RTN), Tabela 1.1",
    link: "https://www.tesourotransparente.gov.br/ckan/dataset/resultado-do-tesouro-nacional",
    fornece: "Receita líquida, despesa primária e resultado mensal da União, por tributo e por grupo de despesa, além do agregado de custeio e capital do Legislativo, Judiciário, MPU e DPU.",
    atualizacao: "Mensal, conforme calendário do Tesouro Nacional.",
    licenca: "Dados abertos (ODbL) via Tesouro Transparente.",
  },
  {
    nome: "SIOP / Ministério do Planejamento — RDF da LOA por exercício",
    link: "https://www1.siop.planejamento.gov.br/siopdoc/doku.php/acesso_publico:dados_abertos",
    fornece: "Execução orçamentária por órgão superior (dotação, empenhado, liquidado e pago) de todos os Poderes — base da seção Órgãos.",
    atualizacao: "Anual, por exercício da LOA.",
    licenca: "Dados abertos do orçamento federal.",
  },
  {
    nome: "SICONFI / Secretaria do Tesouro Nacional — RREO Anexo 1",
    link: "https://apidatalake.tesouro.gov.br/docs/siconfi/",
    fornece: "Balanço orçamentário bimestral dos 26 estados e do Distrito Federal (receitas realizadas × despesas) — base da expansão para as UFs, em coleta.",
    atualizacao: "Bimestral, conforme homologação dos entes no SICONFI.",
    licenca: "API pública, sem autenticação.",
  },
  {
    nome: "Banco Central — SGS (IPCA, Selic, dólar, IBC-Br, dívidas % PIB)",
    link: "https://dadosabertos.bcb.gov.br/",
    fornece: "Séries mensais de preços, juros, câmbio, atividade e endividamento — base dos KPIs e gráficos da seção Conjuntura.",
    atualizacao: "Diária/mensal, conforme a série.",
    licenca: "API pública (ODbL).",
  },
  {
    nome: "Serasa Experian — Falências e Recuperações Judiciais",
    link: "https://www.serasaexperian.com.br/conteudos/indicadores-economicos/",
    fornece: "Pedidos mensais de recuperação judicial e falência (série de processos).",
    atualizacao: "Mensal, com ~3 meses de defasagem.",
    licenca: "Divulgação pública do indicador.",
  },
  {
    nome: "IBGE — estimativas populacionais (previsto)",
    link: "https://www.ibge.gov.br/",
    fornece: "População residente por UF, para indicadores per capita no futuro comparador entre estados.",
    atualizacao: "Anual.",
    licenca: "Dados públicos.",
  },
];

export default function Sobre() {
  return (
    <section id="sobre" className="scroll-mt-24">
      <SectionHead
        index="09"
        eyebrow="Quem somos"
        title="Sobre o Observatório"
      />
      <div className="panel p-5 sm:p-6 text-sm tx-mut leading-relaxed flex flex-col gap-3">
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

      <div className="panel p-5 sm:p-6 mt-4">
        <h3 className="font-display font-semibold mb-4">Todas as fontes, em detalhe</h3>
        <ul className="flex flex-col gap-5">
          {FONTES.map((f) => (
            <li key={f.nome} className="flex flex-col gap-1.5" style={{ borderTop: "1px solid var(--border-soft)", paddingTop: "1rem" }}>
              <p className="font-display font-semibold leading-snug" style={{ color: "var(--text)" }}>{f.nome}</p>
              <a href={f.link} target="_blank" rel="noreferrer" className="text-xs hover:opacity-75 transition c-blue">
                <i className="fa-solid fa-arrow-up-right-from-square mr-1"></i>
                Fonte oficial
              </a>
              <p className="text-sm tx-mut leading-relaxed"><b style={{ color: "var(--text)" }}>Fornece:</b> {f.fornece}</p>
              <p className="text-xs tx-faint"><b>Atualização:</b> {f.atualizacao} <b className="ml-2">Licença:</b> {f.licenca}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
