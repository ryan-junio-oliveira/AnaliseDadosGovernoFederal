import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";
import {
  META,
  LINKS,
  RESUMO,
  FONTES,
  EDA,
  POSICAO,
  VARIAB,
  WELCH,
  TABELAS,
  CODIGOS,
  VERIFICACOES,
} from "./conteudo.js";

const tx = (s) => String(s).replace(/−/g, "-").replace(/→/g, "->");

const C = {
  ink: "#0f172a",
  mut: "#475569",
  faint: "#94a3b8",
  line: "#e2e8f0",
  soft: "#f8fafc",
  accent: "#0f766e",
  accentSoft: "#ecfdf5",
  codeBg: "#0b1220",
  codeTx: "#e2e8f0",
  white: "#ffffff",
};

const s = StyleSheet.create({
  page: { paddingTop: 46, paddingBottom: 54, paddingHorizontal: 46, fontFamily: "Helvetica", fontSize: 10, color: C.ink, lineHeight: 1.5 },
  coverBand: { backgroundColor: C.accent, marginHorizontal: -46, marginTop: -46, paddingHorizontal: 46, paddingTop: 34, paddingBottom: 26, marginBottom: 22 },
  kicker: { color: "#99f6e4", fontSize: 8.5, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 },
  h1: { color: C.white, fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  h1sub: { color: "#ccfbf1", fontSize: 10.5 },
  metaRow: { flexDirection: "row", marginTop: 14, gap: 8, flexWrap: "wrap" },
  metaChip: { backgroundColor: "rgba(255,255,255,0.15)", color: C.white, fontSize: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  linksBox: { marginTop: 14, padding: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.25)", borderRadius: 6 },
  linkLabel: { color: "#99f6e4", fontSize: 7.5, textTransform: "uppercase", letterSpacing: 1 },
  linkUrl: { color: C.white, fontSize: 9, marginTop: 2 },
  lead: { fontSize: 10.5, color: C.mut, marginBottom: 10 },
  bold: { fontFamily: "Helvetica-Bold", color: C.ink },
  sectionTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.ink, marginTop: 18, marginBottom: 6 },
  sectionKicker: { fontSize: 7.5, color: C.accent, letterSpacing: 1.2, textTransform: "uppercase", marginTop: 18 },
  subTitle: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: C.ink, marginTop: 10, marginBottom: 3 },
  p: { fontSize: 9.5, color: C.mut, marginBottom: 5, lineHeight: 1.55 },
  small: { fontSize: 8.2, color: C.faint },
  cardSoft: { borderWidth: 1, borderColor: C.line, borderRadius: 6, padding: 10, marginBottom: 8, backgroundColor: C.soft },
  callout: { borderLeftWidth: 3, borderLeftColor: C.accent, backgroundColor: C.accentSoft, padding: 9, borderRadius: 4, marginBottom: 8 },
  linkCard: { borderWidth: 1, borderColor: C.line, borderRadius: 6, padding: 10, marginBottom: 8, backgroundColor: C.white },
  row: { flexDirection: "row", marginBottom: 4 },
  bullet: { width: 12, color: C.accent, fontFamily: "Helvetica-Bold" },
  rowBody: { flex: 1, fontSize: 9.5, color: C.mut, lineHeight: 1.5 },
  table: { borderWidth: 1, borderColor: C.line, borderRadius: 5, marginVertical: 6 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.line },
  trLast: { flexDirection: "row" },
  th: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.mut, backgroundColor: C.soft, padding: 5, textTransform: "uppercase" },
  td: { fontSize: 9, color: C.ink, padding: 5 },
  tdMut: { fontSize: 9, color: C.mut, padding: 5 },
  codeWrap: { backgroundColor: C.codeBg, borderRadius: 5, marginVertical: 5 },
  codeHead: { fontSize: 7.5, color: "#94a3b8", paddingHorizontal: 8, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  code: { fontSize: 7.8, color: C.codeTx, fontFamily: "Courier", padding: 8, lineHeight: 1.45 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginVertical: 4 },
  chipN: { fontSize: 7.5, color: C.mut, borderWidth: 1, borderColor: C.line, backgroundColor: C.soft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  footer: { position: "absolute", bottom: 24, left: 46, right: 46, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: C.faint, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 6 },
});

function Sec({ kicker, title }) {
  return (
    <View wrap={false}>
      {kicker ? <Text style={s.sectionKicker}>{tx(kicker)}</Text> : null}
      <Text style={s.sectionTitle}>{tx(title)}</Text>
    </View>
  );
}
function Sub({ n, title }) { return <Text style={s.subTitle}>{tx(n ? `${n} ${title}` : title)}</Text>; }
function P({ children, style }) { return <Text style={[s.p, style]}>{children}</Text>; }
function B({ children }) { return <Text style={s.bold}>{children}</Text>; }
function Code({ label, children }) {
  return (
    <View style={s.codeWrap} wrap={false}>
      {label ? <Text style={s.codeHead}>{tx(label)}</Text> : null}
      <Text style={s.code}>{tx(children)}</Text>
    </View>
  );
}
function Table({ head, rows, widths, alignRight = [] }) {
  const w = (i) => widths?.[i] || `${Math.floor(100 / head.length)}%`;
  const al = (i) => (alignRight.includes(i) ? { textAlign: "right" } : {});
  return (
    <View style={s.table}>
      <View style={s.tr}>
        {head.map((h, i) => <Text key={i} style={[s.th, { width: w(i) }, al(i)]}>{tx(h)}</Text>)}
      </View>
      {rows.map((r, ri) => (
        <View key={ri} style={ri === rows.length - 1 ? s.trLast : s.tr}>
          {r.map((c, ci) => <Text key={ci} style={[(ci === 0 ? s.td : s.tdMut), { width: w(ci) }, al(ci)]}>{tx(c)}</Text>)}
        </View>
      ))}
    </View>
  );
}
function Bul({ children }) {
  return (
    <View style={s.row}>
      <Text style={s.bullet}>•</Text>
      <Text style={s.rowBody}>{children}</Text>
    </View>
  );
}

export default function RelatorioPdf() {
  const hoje = new Date().toLocaleDateString("pt-BR");
  return (
    <Document title={META.titulo} author="Pós-Graduação em Engenharia de Dados" subject="Atividade Prática 1">
      <Page size="A4" style={s.page} wrap>
        <View style={s.coverBand}>
          <Text style={s.kicker}>{tx(META.subtitulo)}</Text>
          <Text style={s.h1}>{tx(META.titulo)}</Text>
          <Text style={s.h1sub}>Cenário: dados abertos do Governo Federal</Text>
          <View style={s.metaRow}>
            {["Dataset público", "6 fontes oficiais", "Pipeline Python", "SQLite · 20 tabelas", "127 meses"].map((c) => (
              <Text key={c} style={s.metaChip}>{tx(c)}</Text>
            ))}
          </View>
          <View style={s.linksBox}>
            <Text style={s.linkLabel}>Projeto publicado</Text>
            <Link src={LINKS.projeto} style={s.linkUrl}>{LINKS.projeto}</Link>
            <Text style={[s.linkLabel, { marginTop: 6 }]}>Repositório (GitHub)</Text>
            <Link src={LINKS.github} style={s.linkUrl}>{LINKS.github}</Link>
          </View>
        </View>

        <Text style={s.lead}><Text style={s.bold}>{tx(META.saudacao)} </Text>{tx(META.intro)}</Text>

        <View style={s.callout}>
          <Text style={[s.subTitle, { marginTop: 0 }]}>Resumo do que foi desenvolvido</Text>
          {RESUMO.map((r, i) => <Bul key={i}>{tx(r)}</Bul>)}
        </View>

        <View style={s.linkCard} wrap={false}>
          <Text style={[s.subTitle, { marginTop: 0 }]}>Acesso ao trabalho</Text>
          <View style={s.row}><Text style={s.bullet}>•</Text><Text style={s.rowBody}>Projeto publicado: <Link src={LINKS.projeto} style={{ color: C.accent }}>{LINKS.projeto}</Link></Text></View>
          <View style={s.row}><Text style={s.bullet}>•</Text><Text style={s.rowBody}>Repositório no GitHub: <Link src={LINKS.github} style={{ color: C.accent }}>{LINKS.github}</Link></Text></View>
        </View>

        <Sec kicker="Cenário e fontes" title="1. Escolha do cenário e origem dos dados" />
        <P>O manual permite escolher um cenário de negócio real ou um dataset público. Optei por um <B>dataset público com dados abertos do Governo Federal</B>, por se tratar de dados oficiais, estáveis e de licença aberta, adequados ao trabalho de engenharia de dados proposto. Ao todo, foram integradas <B>6 fontes</B> oficiais:</P>
        {FONTES.map(([f, d]) => <Bul key={f}><B>{tx(f)}:</B> {tx(d)}.</Bul>)}
        <P>A coleta, o processamento e a validação foram automatizados em um pipeline em Python, de forma que os dados publicados no projeto possam ser reproduzidos de ponta a ponta.</P>

        <Sec kicker="Obrigatório · Python" title="2. Análise Exploratória e Tratamento" />
        <P>Antes da análise, foi realizada a limpeza e o tratamento das bases para garantir consistência, com atenção à conversão de tipos, aos valores nulos e ao tratamento de erros e exceções.</P>

        <Sub n="2.1" title="Limpeza dos dados" />
        <P>As planilhas oficiais foram convertidas para estruturas tabulares e tratadas. Três correções foram essenciais:</P>
        <Bul><B>Correção de rótulo que inflava os valores (209% → 93,7%):</B> uma série de receita trazia um subtotal duplicado (já continha IR, COFINS, PIS etc.). Após a correção do mapeamento, a soma por tributo passou a representar 93,7% da receita líquida e a identidade Receita Total − Transferências = Receita Líquida passou a conferir em 100% dos meses.</Bul>
        <Bul><B>Datas e campos vazios:</B> datas convertidas com coerção de erros e valores numéricos tipados; após a análise exploratória, 0 datas inválidas e 0 duplicatas nas 8 bases.</Bul>
        <Bul><B>Registros duplicados de emendas (14 → 7):</B> o código identificador era interpretado como número, gerando duplicidade de chave; a leitura passou a preservar o código como texto, eliminando as duplicatas.</Bul>
        <Code label="Leitura e coerção de tipos na planilha de origem">{CODIGOS.limpeza}</Code>

        <Sub n="2.2" title="Tratamento de tipos de dados" />
        <P>As datas foram tipadas na leitura e normalizadas para o padrão ISO (AAAA-MM-01) na etapa de exportação. Os valores, originalmente em R$ milhões, foram convertidos para valores numéricos consistentes. No banco de dados, cada coluna recebeu tipo definido (inteiro, numérico real ou texto), com chaves e restrições, conforme detalhado na modelagem.</P>
        <Code label="Normalização do tipo data">{CODIGOS.tipos}</Code>

        <Sub n="2.3" title="Tratamento de valores nulos" />
        <P>Regra adotada: <B>valor nulo publicado permanece nulo</B>, sem substituição por zero (o que distorceria médias e gráficos). Há lacunas reais documentadas: por exemplo, a série do IBC-Br sem publicação em dez/2017 e indicadores sem divulgação no fim da janela temporal — totalizando 10 nulos na base de conjuntura, todos explicados. Na atualização das séries, apenas valores válidos substituem os existentes, preservando o histórico já coletado.</P>
        <Code label="Mescla que preserva valores nulos já publicados">{CODIGOS.nulos}</Code>

        <Sub n="2.4" title="Tratamento de erros e exceções" />
        <P>Como as fontes são APIs e arquivos públicos, o pipeline contempla tratamento de falhas:</P>
        <Bul>Novas tentativas com espera progressiva em falhas de resposta (incluindo limites de requisição, respeitando o tempo indicado pela API).</Bul>
        <Bul>Fonte alternativa de download quando a obtenção principal falha.</Bul>
        <Bul>Coleta vazia ou arquivo corrompido não sobrescreve uma base válida anterior.</Bul>
        <Bul>Separação entre etapas críticas (interrompem com erro) e etapas tolerantes (registram aviso sem interromper todo o processo).</Bul>
        <Bul>Exportação realizada apenas após a leitura de todos os insumos, evitando saídas parciais.</Bul>
        <Code label="Tentativas com espera progressiva na coleta de séries">{CODIGOS.erros}</Code>

        <Sub n="2.5" title="Resultado da análise exploratória" />
        <P>A análise exploratória processou 8 bases com <B>zero falhas de carga</B>:</P>
        <Table head={["Base", "Linhas", "Duplicatas", "Nulos"]} rows={EDA} widths={["40%", "20%", "20%", "20%"]} alignRight={[1,2,3]} />
        <P>Foram verificadas a identidade contábil <Text style={{ fontFamily: "Courier" }}>receita − despesa = resultado</Text> (maior desvio de meio centavo, por arredondamento) e a continuidade temporal das séries, sem meses faltantes entre 2016 e 2026. Os 11 valores atípicos identificados no resultado primário (critério de Tukey) foram mantidos, por corresponderem a eventos reais (fechamentos de dezembro, eleições e pandemia).</P>

        <Sec kicker="Obrigatório · Banco de dados" title="3. Modelagem de Dados" />
        <P>Com os dados tratados, foi elaborado o modelo Entidade-Relacionamento para organizar as informações de forma estruturada, contemplando as séries fiscais, por órgão e por estado, além dos indicadores de conjuntura.</P>

        <Sub n="3.1" title="Modelo conceitual" />
        <P>O modelo conceitual foi dividido em dois diagramas: o núcleo fiscal federal e o bloco de conjuntura, emendas e estados.</P>
        <Code label="Diagrama conceitual A — núcleo fiscal federal">{CODIGOS.diagramaA}</Code>
        <Code label="Diagrama conceitual B — conjuntura, emendas e estados">{CODIGOS.diagramaB}</Code>

        <Sub n="3.2" title="Modelo lógico" />
        <P>O modelo lógico separa <B>dimensões</B> (poder, órgão, período, estado, tipo de receita, função de despesa) e <B>fatos</B> (execução, receitas, despesas, conjuntura, dívida, emendas e séries por UF), totalizando <B>20 tabelas e 4 índices</B>, com chaves compartilhadas de tempo e de unidade federativa.</P>
        <View style={s.chips}>
          {TABELAS.map((t) => <Text key={t} style={s.chipN}>{t}</Text>)}
        </View>

        <Sub n="3.3" title="DDL — criação das tabelas" />
        <P>O script de definição (DDL) cria as tabelas com chaves primárias e estrangeiras, campos obrigatórios e restrições de integridade. Exemplo de regra aplicada diretamente na tabela:</P>
        <Code label="DDL — exemplo de tabela com restrição de integridade">{CODIGOS.ddl}</Code>

        <Sub n="3.4" title="DML — carga inicial" />
        <P>A carga inicial (DML) foi gerada a partir dos dados tratados, com instruções de inserção ordenadas conforme as dependências entre tabelas (dimensões antes dos fatos), totalizando <B>8.717 linhas</B> de carga.</P>
        <Code label="DML — trecho da carga inicial">{CODIGOS.dml}</Code>
        <P>Resultado da carga: <B>20 tabelas, 8.624 linhas inseridas e 0 violações de chave estrangeira</B> na verificação de integridade referencial.</P>

        <Sec kicker="Obrigatório · Estatística" title="4. Diagnóstico Estatístico" />
        <P>A amostra analisada é o <B>resultado primário</B> da União (receita líquida − despesa), com <B>127 observações mensais</B> (de 2016-01 a 2026-07), em R$ milhões por mês.</P>

        <Sub n="4.1" title="Distribuição: medidas de posição e variabilidade" />
        <P>A média (−12.969,76 R$ mi/mês) é superior à mediana (−15.540,20 R$ mi/mês), indicando assimetria à esquerda (cauda de meses com resultados muito negativos). O coeficiente de variação elevado (307%) é compatível com uma série mensal sem ajuste sazonal.</P>
        <Table head={["Medidas de posição", "Valor (R$ mi/mês)"]} rows={POSICAO} widths={["60%", "40%"]} alignRight={[1]} />
        <Table head={["Medidas de variabilidade", "Valor"]} rows={VARIAB} widths={["60%", "40%"]} alignRight={[1]} />

        <Sub n="4.2" title="Normalidade da distribuição" />
        <P>Teste de Shapiro-Wilk: W = 0,9359 e p &lt; 0,001 — <B>rejeita-se a hipótese de normalidade</B> (α = 0,05). Diante disso, além dos testes paramétricos, foi aplicado um teste não paramétrico como confirmação.</P>

        <Sub n="4.3" title="Teste de hipótese: déficit/superávit médio sistemático" />
        <P>Teste t de uma amostra (H₀: média = 0; H₁: média ≠ 0): t = −3,667 · gl = 126 · p &lt; 0,001 — <B>rejeita-se H₀</B> (α = 0,05). Conclui-se que a média mensal do resultado primário é estatisticamente diferente de zero (−12.969,76 R$ mi/mês).</P>

        <Sub n="4.4" title="Teste de hipótese: mudança da receita média entre períodos" />
        <P>Comparação das receitas médias entre 2016-2020 e 2021-2025 (2026 excluído por ser ano incompleto), com teste t de Welch (variâncias desiguais):</P>
        <Table head={["Grupo", "n", "Média (R$ mi/mês)", "Desvio padrão"]} rows={WELCH} widths={["34%","16%","25%","25%"]} alignRight={[1,2,3]} />
        <P>Welch: t = −11,333 · p &lt; 0,001 — <B>rejeita-se H₀</B> (efeito grande, d de Cohen = +2,07; alta de 63,1%). A confirmação não paramétrica (Mann-Whitney U = 211 · p &lt; 0,001) também rejeita H₀, convergindo com o resultado do teste de Welch.</P>
        <P style={s.small}>Premissas: independência razoável na série agregada; normalidade avaliada por Shapiro-Wilk em cada grupo (p = 0,0030 e 0,1014) — com n = 60 por grupo o teste t de Welch é robusto; variâncias desiguais tratadas pelo próprio teste.</P>

        <Sec kicker="Conclusão" title="5. Verificações realizadas" />
        <View style={s.cardSoft}>
          {VERIFICACOES.map((v) => <Bul key={v}>{tx(v)}</Bul>)}
        </View>

        <View style={s.linkCard} wrap={false}>
          <Text style={[s.subTitle, { marginTop: 0 }]}>Links do trabalho</Text>
          <View style={s.row}><Text style={s.bullet}>•</Text><Text style={s.rowBody}>Projeto publicado: <Link src={LINKS.projeto} style={{ color: C.accent }}>{LINKS.projeto}</Link></Text></View>
          <View style={s.row}><Text style={s.bullet}>•</Text><Text style={s.rowBody}>Repositório no GitHub: <Link src={LINKS.github} style={{ color: C.accent }}>{LINKS.github}</Link></Text></View>
        </View>

        <View style={s.footer} fixed>
          <Text>Relatório — Atividade Prática 1 · Pós-Graduação em Engenharia de Dados</Text>
          <Text render={({ pageNumber, totalPages }) => `Gerado em ${hoje} · pág. ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
