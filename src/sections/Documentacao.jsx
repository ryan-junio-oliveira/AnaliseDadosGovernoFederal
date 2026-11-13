import { SectionHead } from "../components/ui.jsx";

// Página lateral "Documentação do projeto": relato em 1ª pessoa do aluno,
// dirigido aos professores, respondendo item a item a Atividade Prática 1
// (MANUAL1, CB_01_2026). Espelha docs/relatorio/.

function Codigo({ arquivo, children }) {
  return (
    <div className="mt-3 rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--chip-bg)" }}>
      <p className="px-3 py-1.5 text-[11px] font-mono tx-faint" style={{ borderBottom: "1px solid var(--border)" }}>{arquivo}</p>
      <pre className="px-3 py-2.5 text-[11.5px] leading-[1.55] font-mono tx-mut overflow-x-auto">{children}</pre>
    </div>
  );
}

function Topico({ n, titulo, children }) {
  return (
    <div className="mt-4 first:mt-0">
      <h4 className="font-display font-semibold" style={{ color: "var(--text)" }}>
        <span className="secnum">{n}</span>{titulo}
      </h4>
      <div className="mt-1.5 text-sm tx-mut leading-relaxed flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

const ROTEIRO = [
  {
    n: "1", nome: "Passo inicial — Carta de Apresentação", status: "Pendente",
    desc: "Vou preenchê-la na versão dataset público, apontando como local de coleta os portais oficiais dos dados.",
    href: "#pendencias",
  },
  {
    n: "2", nome: "Passo inicial — Termo de Autorização", status: "Pendente",
    desc: "Vou declarar nele que se tratam de dados públicos, sem acesso a instalações de terceiros.",
    href: "#pendencias",
  },
  {
    n: "A", nome: "Análise Exploratória e Tratamento (Python)", status: "Entregue",
    desc: "Como limpei os dados, tratei nulos, erros e tipos — com os trechos do meu código.",
    href: "#bloco-a",
  },
  {
    n: "B", nome: "Modelagem de Dados (Entidade-Relacionamento)", status: "Entregue",
    desc: "Como pensei o modelo conceitual e lógico e escrevi os scripts de DDL e DML.",
    href: "#bloco-b",
  },
  {
    n: "C", nome: "Diagnóstico Estatístico", status: "Entregue",
    desc: "As perguntas que fiz à minha amostra, as medidas calculadas e os testes de hipótese.",
    href: "#bloco-c",
  },
];

const EDA = [
  ["mensal", "127", "0"],
  ["receitas", "1.651", "0"],
  ["despesas", "1.016", "0"],
  ["poderes", "127", "0"],
  ["orgaos_todos", "531", "0"],
  ["conj_mensal", "132", "10 (explicados abaixo)"],
  ["conj_fiscal", "129", "0"],
  ["emendas", "7", "0"],
];

const POSICAO = [
  ["Média", "−12.969,76"],
  ["Mediana", "−15.540,20"],
  ["1º quartil (Q1)", "−26.473,22"],
  ["3º quartil (Q3)", "9.490,84"],
  ["Percentil 10", "−55.256,86"],
  ["Percentil 90", "28.879,33"],
];

const VARIAB = [
  ["Mínimo", "−194.853,11"],
  ["Máximo", "86.996,64"],
  ["Amplitude", "281.849,74"],
  ["Desvio padrão", "39.853,69"],
  ["Coeficiente de variação", "307,3%"],
];

export default function Documentacao({ onVoltar }) {
  return (
    <div className="pb-4">
      {/* ---------- cabeçalho ---------- */}
      <section className="pt-6" aria-label="Cabeçalho da documentação">
        <p className="eyebrow"><span className="secnum">DOC</span>Atividade Prática 1 · Módulo 1</p>
        <div className="flex items-end justify-between gap-3 flex-wrap mt-1.5">
          <h1 className="font-display font-bold text-[1.75rem] sm:text-[2.1rem] leading-none">
            Documentação do projeto
          </h1>
          <button type="button" className="btn-ghost !py-2 !px-3.5 text-sm" onClick={onVoltar}>
            <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>Painel
          </button>
        </div>
        <p className="text-[13.5px] tx-mut mt-3 leading-relaxed">
          Prezados professores, este documento conta <b style={{ color: "var(--text)" }}>o que eu fiz</b>{" "}
          nesta atividade prática, seguindo o roteiro do manual. Explico cada decisão — por que escolhi
          os dados, como limpei, como modelei o banco e que análise estatística fiz — e mostro os
          trechos mais importantes do meu código. O relatório completo, com todos os detalhes técnicos,
          está em <span className="font-mono text-[12.5px]">docs/relatorio/RELATORIO-MODULO1.md</span>.
        </p>
      </section>

      {/* ---------- resumo ---------- */}
      <section className="panel p-5 sm:p-6 mt-5" aria-label="Resumo do projeto">
        <h2 className="font-display font-semibold mb-2">
          <i className="fa-solid fa-comment-dots mr-2 tx-mut" aria-hidden="true"></i>
          O projeto em 1 minuto
        </h2>
        <p className="text-sm tx-mut leading-relaxed">
          Eu escolhi como cenário um <b style={{ color: "var(--text)" }}>dataset público</b>: os dados
          abertos do Governo Federal. Para responder à atividade, construí três coisas:{" "}
          <b style={{ color: "var(--text)" }}>um pipeline em Python</b> que baixa as fontes oficiais e
          limpa/valida tudo;{" "}
          <b style={{ color: "var(--text)" }}>um banco de dados SQLite</b> com o modelo
          Entidade-Relacionamento, DDL e a carga inicial; e{" "}
          <b style={{ color: "var(--text)" }}>este site</b>, que publica o resultado. Dentro do
          projeto apliquei os três temas do módulo — tratamento de dados em Python, modelagem de
          banco e diagnóstico estatístico — e cada um deles está explicado abaixo, item a item.
        </p>
        <div className="flex gap-1.5 mt-3 flex-wrap">
          <span className="chip !py-1 !px-2.5 !text-[11px]">Dataset público</span>
          <span className="chip !py-1 !px-2.5 !text-[11px]">6 fontes oficiais</span>
          <span className="chip !py-1 !px-2.5 !text-[11px]">Pipeline Python</span>
          <span className="chip !py-1 !px-2.5 !text-[11px]">SQLite · 20 tabelas</span>
          <span className="chip !py-1 !px-2.5 !text-[11px]">Dashboard React</span>
        </div>
      </section>

      {/* ---------- roteiro ---------- */}
      <section className="panel p-5 sm:p-6 mt-4" aria-label="Roteiro da atividade">
        <h2 className="font-display font-semibold mb-4">
          <i className="fa-solid fa-list-check mr-2 tx-mut" aria-hidden="true"></i>
          O que o roteiro pede e onde responder
        </h2>
        <ul className="flex flex-col gap-3">
          {ROTEIRO.map((r) => {
            const ok = r.status === "Entregue";
            return (
              <li key={r.n} className="flex items-start gap-3 flex-wrap" style={{ borderTop: "1px solid var(--border-soft)" }}>
                <span
                  className="rank-pos !w-7 !h-7 !text-[12px] flex-none mt-0.5"
                  style={ok ? undefined : { background: "transparent", border: "1px dashed var(--border)", color: "var(--faint)" }}
                  aria-hidden="true"
                >
                  <i className={`fa-solid ${ok ? "fa-check" : "fa-pen"}`}></i>
                </span>
                <div className="flex-1 min-w-[240px]">
                  <p className="font-display font-semibold leading-snug">
                    {r.n}. {r.nome}
                    <a href={r.href} className="ml-2 text-xs font-normal" style={{ color: "var(--blue)" }}>ver ↓</a>
                  </p>
                  <p className="text-[13px] tx-mut mt-0.5 leading-relaxed">{r.desc}</p>
                </div>
                <span
                  className="chip !py-1 !px-2.5 !text-[11px] flex-none"
                  style={ok ? { color: "var(--green)" } : { color: "var(--warn)" }}
                >
                  {r.status}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---------- escolha do cenario ---------- */}
      <SectionHead index="01" eyebrow="Decisão de projeto" title="Por que esses dados e como eles chegam até aqui" />
      <div className="panel p-5 sm:p-6">
        <div className="text-sm tx-mut leading-relaxed flex flex-col gap-3">
          <p>
            O manual permite escolher um cenário de negócio real ou um dataset público. Eu escolhi o{" "}
            <b style={{ color: "var(--text)" }}>dataset público do Governo Federal</b> porque ele é
            oficial, estável, tem licença aberta e é exatamente o tipo de dado que um engenheiro de
            dados trabalha no dia a dia. No total são <b style={{ color: "var(--text)" }}>6 fontes</b>:
          </p>
          <ul className="flex flex-col gap-1.5">
            {[
              ["Tesouro Nacional (RTN)", "receita, despesa e resultado mês a mês da União, por tributo e por grupo de despesa"],
              ["SIOP", "execução orçamentária de todos os órgãos e Poderes, e as emendas parlamentares"],
              ["SICONFI/RREO", "balanço bimestral dos estados e do Distrito Federal"],
              ["Banco Central (SGS)", "IPCA, Selic, dólar, IBC-Br, dívida pública e resultado fiscal"],
              ["Yahoo Finance", "fechamento mensal do Ibovespa"],
              ["SIOP (emendas)", "emendas por RP do exercício corrente"],
            ].map(([f, o]) => (
              <li key={f} className="flex gap-2">
                <span className="tx-faint flex-none">—</span>
                <span><b style={{ color: "var(--text)" }}>{f}:</b> {o}.</span>
              </li>
            ))}
          </ul>
          <p>
            Escrevi um orquestrador (<span className="font-mono text-[12.5px]">scripts/atualizar.py</span>)
            que roda tudo em sequência — baixar, processar, exportar os JSONs, validar — e o site
            lê apenas os JSONs publicados. Assim qualquer pessoa (ou o professor) consegue reproduzir
            do zero com um único comando, sem precisar de servidor:{" "}
            <span className="font-mono text-[12.5px]">python scripts/atualizar.py</span>.
          </p>
        </div>
      </div>

      {/* ---------- BLOCO A ---------- */}
      <span id="bloco-a" className="scroll-mt-24 block" aria-hidden="true" />
      <SectionHead index="A" eyebrow="Obrigatório · Python" title="Análise Exploratória e Tratamento" />
      <div className="panel p-5 sm:p-6">
        <p className="text-sm tx-mut leading-relaxed">
          Antes de analisar qualquer coisa, eu precisei garantir que os dados estivessem limpos.
          O manual pede três coisas aqui: código de limpeza, tratamento de valores nulos e
          tratamento de erros/exceções — além da nota sobre tipos, que eu também segui. Segue o
          que eu fiz em cada uma.
        </p>

        <Topico n="A.1" titulo="Limpeza — o que eu corrigi">
          <p>
            Eu baixei a planilha oficial do Tesouro (XLSX) e a converti em CSV/dataframe. No caminho,
            fiz três descobertas importantes:
          </p>
          <ol className="list-decimal pl-5 flex flex-col gap-1.5">
            <li>
              <b style={{ color: "var(--text)" }}>Um rótulo estava errado e inflava os números.</b>{" "}
              Na primeira versão, a soma das receitas por tributo dava, em média,{" "}
              <b style={{ color: "var(--text)" }}>209% da receita líquida</b> — impossível. Eu
              investiguei linha a linha contra a planilha-fonte e descobri que a série "Outras RFB"
              estava trazendo um <i>subtotal</i> que já continha IR, COFINS, PIS etc., duplicando os
              valores. Corrigi o índice no meu código (<span className="font-mono text-[12.5px]">mapa_rec: 6→16, 24→23</span>)
              e hoje a soma bate com <b style={{ color: "var(--text)" }}>93,7%</b> — e a regra{" "}
              <span className="font-mono text-[12.5px]">Receita Total − Transferências = Receita Líquida</span>{" "}
              confere em 100% dos meses.
            </li>
            <li>
              <b style={{ color: "var(--text)" }}>As datas e os vazios da planilha</b> eu converti
              com <span className="font-mono text-[12.5px]">to_datetime(errors='coerce')</span> e
              coerção para float: depois da EDA, 0 datas inválidas e 0 duplicatas nas 8 bases.
            </li>
            <li>
              <b style={{ color: "var(--text)" }}>              As emendas estavam duplicadas</b> (14 linhas para
              7 reais): o pandas lia o código do RP como número e transformava "0" em "0.0", quebrando
              a chave. Eu corrigi lendo a coluna como texto:
              <span className="font-mono text-[12.5px]">{" pd.read_csv(..., converters={'rp': str})"}</span>.
            </li>
          </ol>
          <Codigo arquivo="meu código — processamento da planilha (scripts/processamento/processa_rtn.py)">{`dates = [pd.to_datetime(h) for h in header[1:] if h is not None]

def get_row(idx):
    vals = list(rows[idx][1:1+len(dates)])
    # valor vazio/nulo vira 0.0; o restante e forcado para float
    return pd.Series([float(v) if v not in (None, "") else 0 for v in vals],
                     index=dates)`}</Codigo>
        </Topico>

        <Topico n="A.2" titulo="Tipos — a nota do manual aplicada">
          <p>
            O manual diz que o rigor na conversão de tipos é a base de pipelines resilientes, e foi
            assim que eu tratei tudo: datas tipadas na leitura e normalizadas para o padrão ISO
            (<span className="font-mono text-[12.5px]">AAAA-MM-01</span>) na exportação; valores em
            R$ milhões convertidos para R$ de verdade; no banco, tipos definidos
            (<span className="font-mono text-[12.5px]">INTEGER/REAL/TEXT</span>) com chave primária,
            estrangeira e restrições — detalhes no Bloco B.
          </p>
          <Codigo arquivo="meu código — normalização da data na exportação (scripts/processamento/export_json.py)">{`m["mes"] = pd.to_datetime(m["mes"]).dt.strftime("%Y-%m-%d")`}</Codigo>
        </Topico>

        <Topico n="A.3" titulo="Valores nulos — minha regra é não inventar dado">
          <p>
            Meu princípio aqui foi simples: <b style={{ color: "var(--text)" }}>nulo publicado
            permanece nulo</b>. Eu nunca troco um vazio por zero, porque zero seria um valor falso e
            derrubaria médias e gráficos. É por isso que a série do IBC-Br tem uma lacuna real
            (dez/2017, quando o Banco Central não publicou) e o IPCA/dólar têm vazios no fim da
            janela, porque ainda não foram publicados — 10 nulos em conj_mensal, todos documentados.
          </p>
          <p>
            Para não perder o que já tinha coletado, a mesclagem entre execuções só substitui
            valores não-nulos: se o BCB cair no meio da coleta, a série publicada não encolhe.
          </p>
          <Codigo arquivo="meu código — mescla que só preenche com valores válidos (scripts/coletas/coleta_conjuntura.py)">{`for r in novos:
    k = str(r[chave])
    if k in por:
        base = por[k]
        for c, v in r.items():
            if v is not None and v == v:   # NaN != NaN (classico)
                base[c] = v`}</Codigo>
        </Topico>

        <Topico n="A.4" titulo="Erros e exceções — o que eu protegi">
          <p>
            Como as fontes são APIs públicas, eu assumi que qualquer uma delas pode falhar. Minhas
            proteções, todas testadas:
          </p>
          <ul className="flex flex-col gap-1.5">
            {[
              "Retry com espera progressiva quando o BCB ou o SICONFI respondem mal (inclusive HTTP 429, respeitando o tempo de espera da própria API);",
              "URL alternativa de fallback quando o download do RTN falha;",
              "Nunca sobrescrever uma base boa com uma vazia: se a coleta vier vazia ou o zip chegar corrompido, eu mantenho a versão anterior e aviso;",
              "No orquestrador, separei etapas críticas (se falham, o processo para com mensagem clara) de etapas tolerantes (a falha vira aviso e aparece em um RESUMO final, sem travar todo o pipeline);",
              "A exportação dos JSONs lê todos os insumos antes de gravar o primeiro arquivo — nunca deixo a pasta de saída pela metade.",
            ].map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="tx-faint flex-none">—</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <Codigo arquivo="meu código — retry em uma série do BCB (scripts/coletas/coleta_conjuntura.py)">{`raw = None
for t in range(3):
    try:
        raw = get_json(url)
        break
    except Exception as e:
        if t == 2:
            print(f"[bcb:{nome}:{a}] aviso apos retry: {e}")
        else:
            time.sleep(5 * (t + 1))`}</Codigo>
        </Topico>

        <Topico n="A.5" titulo="O que a análise exploratória mostrou">
          <p>
            Ao final, meu script de EDA (<span className="font-mono text-[12.5px]">exploratoria.py</span>)
            processou 8 bases com <b style={{ color: "var(--text)" }}>zero falhas de carga</b>:
          </p>
          <div className="rounded-lg overflow-x-auto mt-1" style={{ border: "1px solid var(--border)" }}>
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="text-left text-[11px] tx-faint uppercase tracking-widest" style={{ background: "var(--chip-bg)" }}>
                  <th className="py-2 px-3">Base</th>
                  <th className="py-2 px-3 text-right">Linhas</th>
                  <th className="py-2 px-3 text-right">Duplicatas</th>
                  <th className="py-2 px-3 text-right">Nulos</th>
                </tr>
              </thead>
              <tbody>
                {EDA.map(([b, l, n]) => (
                  <tr key={b} style={{ borderTop: "1px solid var(--border-soft)" }}>
                    <td className="py-2 px-3 font-mono text-[13px] font-semibold">{b}</td>
                    <td className="py-2 px-3 text-right">{l}</td>
                    <td className="py-2 px-3 text-right">0</td>
                    <td className="py-2 px-3 text-right">{n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Também conferi duas regras de integridade: a identidade{" "}
            <span className="font-mono text-[12.5px]">receita − despesa = resultado</span> (maior
            desvio de meio centavo, por arredondamento) e a continuidade das séries — nenhum mês
            faltando entre 2016 e 2026. Os 11 pontos fora do padrão em resultado_primário (Tukey)
            eu <b style={{ color: "var(--text)" }}>mantive de propósito</b>: são dezembros, eleições
            e pandemia — comportamento real do fenômeno, não erro de carga.
          </p>
          <p className="text-xs tx-faint">
            Saída da validação que roda no fim de todo o pipeline:{" "}
            <span className="font-mono">OK: 127 meses validados, 6 arquivos obrigatorios integros + 4 de conjuntura + 5 UFs.</span>
          </p>
        </Topico>
      </div>

      {/* ---------- BLOCO B ---------- */}
      <span id="bloco-b" className="scroll-mt-24 block" aria-hidden="true" />
      <SectionHead index="B" eyebrow="Obrigatório · Banco de dados" title="Modelagem de Dados" />
      <div className="panel p-5 sm:p-6">
        <p className="text-sm tx-mut leading-relaxed">
          Com os dados limpos, eu precisava de um lugar estruturado para guardá-los — e foi aqui
          que montei o modelo Entidade-Relacionamento. Meu raciocínio foi o seguinte.
        </p>

        <Topico n="B.1" titulo="Modelo conceitual — como eu pensei as entidades">
          <p>
            Eu comecei pelas perguntas que o projeto responde: <i>quanto entrou e saiu por mês?
            Como cada tributo se comporta? Quanto cada órgão gastou? Como os estados estão?</i>{" "}
            A partir delas, identifiquei as entidades e seus relacionamentos. O resultado foram{" "}
            <b style={{ color: "var(--text)" }}>dois diagramas</b>: o núcleo fiscal federal e o
            bloco de conjuntura/emendas/estados.
          </p>
          <Codigo arquivo="meu modelo conceitual — diagrama A (núcleo fiscal federal)">{`PODER (cod_poder PK, nome)
  1---N  ORGAO (cod_orgao PK, nome, cod_poder FK)

ANO (ano PK)
  1---N  EXECUCAO_ORGAO (ano PK/FK, cod_orgao PK/FK, dotacao, empenhado,
                         liquidado, pago)

PERIODO (mes PK ['AAAA-MM-01'], ano)          <- dimensao de tempo unica
  1---N  RECEITA_MENSAL (mes PK/FK, receita_total, receita_liquida, despesa,
                         resultado_primario  <<CHECK receita_liquida - despesa
                                                   = resultado_primario>>)
  1---N  RECEITA_ANUAL  (ano PK, receita_total, receita_liquida, despesa,
                         resultado_primario)
  1---N  PODER_MENSAL   (mes PK/FK, custeio_capital, despesa_total, participacao)
  1---N  RECEITA_TIPO   (mes PK/FK, cod_tipo PK/FK, valor)
  1---N  DESPESA_FUNCAO (mes PK/FK, cod_funcao PK/FK, valor)

TIPO_RECEITA  (cod_tipo PK, nome)     1---N RECEITA_TIPO
FUNCAO_DESPESA (cod_funcao PK, nome)  1---N DESPESA_FUNCAO`}</Codigo>
          <Codigo arquivo="meu modelo conceitual — diagrama B (conjuntura, emendas e estados)">{`PERIODO (mes PK)
  1---N  CONJUNTURA_MENSAL (mes PK/FK, ipca_m, ipca_12m, dolar, selic, ibc, ibov)
  1---N  DIVIDA_MENSAL     (mes PK/FK, dbgg, dlsp, dbgg_rs, dlsp_rs)
  1---N  RESULTADO_FISCAL_MENSAL (mes PK/FK, primario, juros, nominal)
  N---1  EMENDAS (ano PK, rp PK, dotacao, empenhado, liquidado, pago)

ESTADO (sigla PK, nome, status, fonte, periodicidade, resultado_conceito,
        populacao_ref)
  1---N  UF_MENSAL  (sigla PK/FK, mes PK/FK, bimestre, receita, receita_total,
                     despesa, resultado_primario)
  1---N  UF_RECEITA (sigla PK/FK, mes PK/FK, tipo PK/FK, valor)
  1---N  UF_DESPESA (sigla PK/FK, mes PK/FK, funcao PK/FK, valor)
  1---N  UF_ANUAL   (sigla PK/FK, ano PK/FK, receita, receita_total, despesa,
                     resultado_primario)`}</Codigo>
        </Topico>

        <Topico n="B.2" titulo="Modelo lógico — as 20 tabelas que criei">
          <p>
            O conceitual virou tabelas no SQLite separadas em{" "}
            <b style={{ color: "var(--text)" }}>dimensões</b> (o "quando", "quem" e "que tipo" —
            poder, órgão, período, estado, tipo de receita, função de despesa) e{" "}
            <b style={{ color: "var(--text)" }}>fatos</b> (os números que eu analiso): execução
            por órgão, receitas, despesas, conjuntura, dívida, emendas e as séries por UF. No total,{" "}
            <b style={{ color: "var(--text)" }}>20 tabelas e 4 índices</b>, sempre com{" "}
            <span className="font-mono text-[12.5px]">mes</span> apontando para a tabela de período e{" "}
            <span className="font-mono text-[12.5px]">sigla</span> para a tabela de estado — assim o
            banco inteiro compartilha o mesmo calendário.
          </p>
          <div className="flex gap-1.5 flex-wrap mt-1">
            {["poder", "tipo_receita", "funcao_despesa", "periodo", "estado", "orgao",
              "execucao_orgao", "receita_mensal", "receita_anual", "receita_tipo", "despesa_funcao",
              "poder_mensal", "conjuntura_mensal", "divida_mensal", "resultado_fiscal_mensal",
              "emendas", "uf_mensal", "uf_receita", "uf_despesa", "uf_anual"].map((t) => (
              <span key={t} className="chip !py-1 !px-2.5 !text-[11.5px] font-mono">{t}</span>
            ))}
          </div>
        </Topico>

        <Topico n="B.3" titulo="DDL — a criação das tabelas">
          <p>
            O script <span className="font-mono text-[12.5px]">scripts/banco/ddl.sql</span> cria as
            20 tabelas com chave primária, estrangeira, <span className="font-mono text-[12.5px]">NOT NULL</span>{" "}
            e restrições. Um detalhe do qual eu gosto: coloquei uma regra de integridade direto na
            tabela — o banco se recusa a gravar uma linha em que receita − despesa não feche com o
            resultado:
          </p>
          <Codigo arquivo="meu DDL — scripts/banco/ddl.sql">{`CREATE TABLE receita_mensal (
    mes                TEXT PRIMARY KEY REFERENCES periodo (mes),
    receita_total      REAL NOT NULL,
    receita_liquida    REAL NOT NULL,
    despesa            REAL NOT NULL,
    resultado_primario REAL NOT NULL,
    -- regra de integridade: receita liquida - despesa = resultado primario
    CHECK (ABS((receita_liquida - despesa) - resultado_primario) < 1000)
);`}</Codigo>
        </Topico>

        <Topico n="B.4" titulo="DML — a carga inicial">
          <p>
            Para a carga inicial, eu gerei um arquivo com os INSERTs literais a partir dos JSONs
            publicados (<span className="font-mono text-[12.5px]">gerar_dml.py</span>), já na ordem
            correta das chaves estrangeiras — dimensões primeiro, fatos depois. O arquivo final tem{" "}
            <b style={{ color: "var(--text)" }}>8.717 linhas</b> e meu script{" "}
            <span className="font-mono text-[12.5px]">carregar.py</span> roda em três passos: DDL,
            DML e verificação.
          </p>
          <Codigo arquivo="meu DML — scripts/banco/dml_carga_inicial.sql (trecho)">{`INSERT INTO poder (cod_poder, nome) VALUES
  (1, 'DPU'),
  (2, 'Executivo'),
  (3, 'Judiciario'),
  (4, 'Legislativo'),
  (5, 'MPU');

INSERT INTO receita_mensal (mes, receita_total, receita_liquida,
                            despesa, resultado_primario) VALUES
  ('2016-01-01', 141213240860.66364, 124043962618.36778, 109355209090.80223, 14688753527.565538),
  ...`}</Codigo>
          <p>
            Resultado da carga: <b style={{ color: "var(--text)" }}>20 tabelas, 8.624 linhas e
            zero violações de chave estrangeira</b> no <span className="font-mono text-[12.5px]">PRAGMA foreign_key_check</span>.
          </p>
        </Topico>
      </div>

      {/* ---------- BLOCO C ---------- */}
      <span id="bloco-c" className="scroll-mt-24 block" aria-hidden="true" />
      <SectionHead index="C" eyebrow="Obrigatório · Estatística" title="Diagnóstico Estatístico" />
      <div className="panel p-5 sm:p-6">
        <p className="text-sm tx-mut leading-relaxed">
          Por fim, eu escolhi uma <b style={{ color: "var(--text)" }}>amostra</b> e fiz a análise
          estatística que o manual pede. Minha variável foi o{" "}
          <span className="font-mono text-[12.5px]">resultado_primario</span> da União (receita
          líquida − despesa): são <b style={{ color: "var(--text)" }}>127 observações mensais</b> de
          2016-01 a 2026-07 — a série completa da minha janela, em R$ milhões por mês. As perguntas
          que eu quis responder foram estas:
        </p>

        <Topico n="C.1" titulo="Pergunta 1 — como esse resultado se distribui?">
          <p>
            Calculei as medidas de posição e de variabilidade pedidas. A leitura que eu tiro: a
            média (<b style={{ color: "var(--text)" }}>−12.969,76 R$ mi</b>) fica acima da mediana
            (<b style={{ color: "var(--text)" }}>−15.540,20 R$ mi</b>), o que mostra uma assimetria
            à esquerda — alguns meses muito negativos puxam a cauda. E o coeficiente de variação
            alto (307%) é esperado numa série cru, sem dessazonalizar.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mt-1">
            <div className="rounded-lg overflow-x-auto" style={{ border: "1px solid var(--border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] tx-faint uppercase tracking-widest" style={{ background: "var(--chip-bg)" }}>
                    <th className="py-2 px-3" colSpan="2">Medidas de posição (R$ mi/mês)</th>
                  </tr>
                </thead>
                <tbody>
                  {POSICAO.map(([m, v]) => (
                    <tr key={m} style={{ borderTop: "1px solid var(--border-soft)" }}>
                      <td className="py-1.5 px-3 tx-mut">{m}</td>
                      <td className="py-1.5 px-3 text-right font-semibold">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rounded-lg overflow-x-auto" style={{ border: "1px solid var(--border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] tx-faint uppercase tracking-widest" style={{ background: "var(--chip-bg)" }}>
                    <th className="py-2 px-3" colSpan="2">Medidas de variabilidade</th>
                  </tr>
                </thead>
                <tbody>
                  {VARIAB.map(([m, v]) => (
                    <tr key={m} style={{ borderTop: "1px solid var(--border-soft)" }}>
                      <td className="py-1.5 px-3 tx-mut">{m}</td>
                      <td className="py-1.5 px-3 text-right font-semibold">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Topico>

        <Topico n="C.2" titulo="Pergunta 2 — a distribuição é normal?">
          <p>
            Antes de escolher os testes, eu testei a normalidade com Shapiro-Wilk: W = 0,9359 e{" "}
            <span className="font-mono text-[12.5px]">p &lt; 0,001</span> — ou seja,{" "}
            <b style={{ color: "var(--brick)" }}>rejeito a hipótese de normalidade</b> (α = 0,05).
            Por isso, junto com os testes paramétricos, eu apliquei também um teste não paramétrico
            como confirmação. Essa decisão fica registrada nas premissas.
          </p>
        </Topico>

        <Topico n="C.3" titulo="Pergunta 3 — existe déficit/superávit médio sistemático?">
          <p>
            Fiz um <b>teste t de uma amostra</b> com H₀: a média é zero (não haveria desvio médio
            mensal) contra H₁: a média difere de zero. Resultado:{" "}
            <span className="font-mono text-[12.5px]">t = −3,667 · gl = 126 · p &lt; 0,001</span> —{" "}
            <b style={{ color: "var(--brick)" }}>rejeito H₀</b>. Em palavras: a média mensal do
            resultado primário é estatisticamente diferente de zero, no valor de −12.969,76 R$ mi/mês.
          </p>
        </Topico>

        <Topico n="C.4" titulo="Pergunta 4 — a receita média mudou entre os períodos?">
          <p>
            Dividi a década em dois grupos iguais (2016-2020 e 2021-2025, deixando 2026 de fora por
            ser ano incompleto) e comparei as receitas médias. Como os grupos têm variâncias
            diferentes, usei o <b>teste t de Welch</b>:
          </p>
          <div className="rounded-lg overflow-x-auto mt-1" style={{ border: "1px solid var(--border)" }}>
            <table className="w-full text-sm min-w-[440px]">
              <thead>
                <tr className="text-left text-[11px] tx-faint uppercase tracking-widest" style={{ background: "var(--chip-bg)" }}>
                  <th className="py-2 px-3">Grupo</th>
                  <th className="py-2 px-3 text-right">n</th>
                  <th className="py-2 px-3 text-right">Média (R$ mi/mês)</th>
                  <th className="py-2 px-3 text-right">Desvio padrão</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 px-3 font-semibold">2016-2020</td>
                  <td className="py-2 px-3 text-right">60</td>
                  <td className="py-2 px-3 text-right">100.471,97</td>
                  <td className="py-2 px-3 text-right">23.439,38</td>
                </tr>
                <tr style={{ borderTop: "1px solid var(--border-soft)" }}>
                  <td className="py-2 px-3 font-semibold">2021-2025</td>
                  <td className="py-2 px-3 text-right">60</td>
                  <td className="py-2 px-3 text-right">163.849,51</td>
                  <td className="py-2 px-3 text-right">36.429,77</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Resultado: <span className="font-mono text-[12.5px]">t = −11.333 · p &lt; 0,001</span> —{" "}
            <b style={{ color: "var(--brick)" }}>rejeito H₀</b>: a receita média mudou entre os
            períodos, com efeito grande (Cohen d = +2,07; alta de 63,1%). Como confirmação, o{" "}
            <b>Mann-Whitney U</b> (não paramétrico, que não depende de normalidade) deu{" "}
            <span className="font-mono text-[12.5px]">U = 211 · p &lt; 0,001</span> —{" "}
            <b style={{ color: "var(--brick)" }}>rejeita H₀ também</b>, convergindo com o teste de Welch.
          </p>
          <p className="text-xs tx-faint">
            Premissas que declarei: independência entre os meses (razoável na série agregada);
            normalidade aferida por Shapiro-Wilk em cada grupo (p = 0,0030 e 0,1014) — com n = 60 por
            grupo, o teste t de Welch é robusto mesmo assim; variâncias desiguais tratadas pelo próprio
            Welch (equal_var=False).
          </p>
        </Topico>
      </div>

      {/* ---------- REPRODUZIBILIDADE ---------- */}
      <SectionHead index="02" eyebrow="Para conferir" title="Como reproduzir e o que eu verifiquei" />
      <div className="grid md:grid-cols-2 gap-4">
        <div className="panel p-5">
          <h3 className="font-display font-semibold mb-1">
            <i className="fa-solid fa-terminal mr-2 tx-mut" aria-hidden="true"></i>
            Comandos (do zero)
          </h3>
          <Codigo arquivo="linha de comando">{`python scripts/atualizar.py       # pipeline completo (8 etapas)
python scripts/banco/carregar.py  # ddl + dml no SQLite
python scripts/validar.py         # validacao dos JSONs
python scripts/analise/exploratoria.py   # EDA
python scripts/analise/estatistica.py    # estatistica
npm run dev                       # site local
npm test && npm run build         # testes (21) e build`}</Codigo>
        </div>
        <div className="panel p-5">
          <h3 className="font-display font-semibold mb-1">
            <i className="fa-solid fa-award mr-2 tx-mut" aria-hidden="true"></i>
            Estado das verificações
          </h3>
          <ul className="mt-1 flex flex-col gap-1.5 text-sm tx-mut leading-relaxed">
            {[
              "Pipeline completo rodou de ponta a ponta (EXIT=0).",
              "validar.py: 127 meses validados, todas as bases íntegras.",
              "EDA: 8 bases processadas, 0 falhas de carga.",
              "Banco: 20 tabelas, 8.624 linhas, 0 violações de FK.",
              "Site: 21 testes automatizados passando e build gerado.",
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <span className="c-rec flex-none"><i className="fa-solid fa-check" aria-hidden="true"></i></span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ---------- PENDÊNCIAS ---------- */}
      <span id="pendencias" className="scroll-mt-24 block" aria-hidden="true" />
      <div className="panel p-5 sm:p-6 mt-4" style={{ borderColor: "var(--warn)" }}>
        <h3 className="font-display font-semibold">
          <i className="fa-solid fa-pen-to-square mr-2" style={{ color: "var(--warn)" }} aria-hidden="true"></i>
          Passos iniciais — o que ainda vou entregar
        </h3>
        <ul className="mt-3 flex flex-col gap-2.5 text-sm tx-mut leading-relaxed">
          <li className="flex gap-2.5">
            <span className="flex-none" style={{ color: "var(--warn)" }}><i className="fa-solid fa-file-signature" aria-hidden="true"></i></span>
            <span>
              <b style={{ color: "var(--text)" }}>1. Carta de Apresentação</b> — como optei por{" "}
              <b style={{ color: "var(--text)" }}>dataset público</b>, vou preenchê-la apontando como
              local de coleta os portais oficiais das fontes (Tesouro Transparente, SIOP, SICONFI,
              BCB). Modelo: <span className="font-mono text-[12.5px]">docs/curso/carta-de-apresentacao-pratica.pdf</span>.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="flex-none" style={{ color: "var(--warn)" }}><i className="fa-solid fa-file-signature" aria-hidden="true"></i></span>
            <span>
              <b style={{ color: "var(--text)" }}>2. Termo de Autorização</b> — vou declarar nele que
              se tratam de <b style={{ color: "var(--text)" }}>dados públicos</b>, sem necessidade de
              acesso a instalações de terceiros. Modelo:{" "}
              <span className="font-mono text-[12.5px]">docs/curso/termo-de-autorizacao-atividade-pratica.pdf</span>.
            </span>
          </li>
        </ul>
        <p className="text-xs tx-faint mt-4">
          Todo o detalhamento técnico desta página está no relatório completo{" "}
          <span className="font-mono">docs/relatorio/RELATORIO-MODULO1.md</span>, com insumos{" "}
          <span className="font-mono">eda_resumo.md</span> e{" "}
          <span className="font-mono">estatistica_resultados.md</span>.
        </p>
      </div>
    </div>
  );
}
