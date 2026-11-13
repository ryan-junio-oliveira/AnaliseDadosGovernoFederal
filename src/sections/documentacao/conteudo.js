// Conteúdo compartilhado entre a página web e o PDF (relatório da Atividade Prática 1).

export const META = {
  titulo: "Relatório da Atividade Prática 1",
  subtitulo: "Pós-Graduação em Engenharia de Dados · Módulo 1",
  saudacao: "Prezados professores,",
  intro:
    "este relatório apresenta o que foi desenvolvido nesta Atividade Prática 1, seguindo o roteiro do manual. Descrevo as decisões tomadas — escolha dos dados, limpeza e tratamento, modelagem do banco e diagnóstico estatístico — e apresento os trechos de código mais relevantes.",
};

export const LINKS = {
  projeto: "https://analise-dados-governo-federal.vercel.app/",
  github: "https://github.com/ryan-junio-oliveira/AnaliseDadosGovernoFederal",
};

export const RESUMO = [
  "Cenário escolhido: dataset público com dados abertos do Governo Federal (6 fontes oficiais).",
  "Pipeline em Python para coleta, limpeza, tratamento e validação dos dados.",
  "Banco de dados relacional (SQLite) com modelagem Entidade-Relacionamento, DDL e carga inicial (DML).",
  "Diagnóstico estatístico sobre a série mensal do resultado primário da União.",
];

export const FONTES = [
  ["Tesouro Nacional (RTN)", "receita, despesa e resultado mês a mês da União, por tributo e por grupo de despesa"],
  ["SIOP", "execução orçamentária de todos os órgãos e Poderes, e as emendas parlamentares"],
  ["SICONFI/RREO", "balanço bimestral dos estados e do Distrito Federal"],
  ["Banco Central (SGS)", "IPCA, Selic, dólar, IBC-Br, dívida pública e resultado fiscal"],
  ["Yahoo Finance", "fechamento mensal do Ibovespa"],
  ["SIOP (emendas)", "emendas por tipo de RP do exercício corrente"],
];

export const EDA = [
  ["Base fiscal mensal", "127", "0", "0"],
  ["Receitas por tipo", "1.651", "0", "0"],
  ["Despesas por função", "1.016", "0", "0"],
  ["Poderes", "127", "0", "0"],
  ["Órgãos", "531", "0", "0"],
  ["Conjuntura mensal", "132", "0", "10 (explicados)"],
  ["Resultado fiscal", "129", "0", "0"],
  ["Emendas", "7", "0", "0"],
];

export const POSICAO = [
  ["Média", "−12.969,76"],
  ["Mediana", "−15.540,20"],
  ["1º quartil (Q1)", "−26.473,22"],
  ["3º quartil (Q3)", "9.490,84"],
  ["Percentil 10", "−55.256,86"],
  ["Percentil 90", "28.879,33"],
];

export const VARIAB = [
  ["Mínimo", "−194.853,11"],
  ["Máximo", "86.996,64"],
  ["Amplitude", "281.849,74"],
  ["Desvio padrão", "39.853,69"],
  ["Coeficiente de variação", "307,3%"],
];

export const WELCH = [
  ["2016-2020", "60", "100.471,97", "23.439,38"],
  ["2021-2025", "60", "163.849,51", "36.429,77"],
];

export const TABELAS = [
  "poder","tipo_receita","funcao_despesa","periodo","estado","orgao",
  "execucao_orgao","receita_mensal","receita_anual","receita_tipo","despesa_funcao",
  "poder_mensal","conjuntura_mensal","divida_mensal","resultado_fiscal_mensal",
  "emendas","uf_mensal","uf_receita","uf_despesa","uf_anual",
];

export const CODIGOS = {
  limpeza: `dates = [pd.to_datetime(h) for h in header[1:] if h is not None]

def get_row(idx):
    vals = list(rows[idx][1:1+len(dates)])
    # valor vazio/nulo vira 0.0; o restante e forcado para float
    return pd.Series([float(v) if v not in (None, "") else 0 for v in vals],
                     index=dates)`,
  tipos: `m["mes"] = pd.to_datetime(m["mes"]).dt.strftime("%Y-%m-%d")`,
  nulos: `for r in novos:
    k = str(r[chave])
    if k in por:
        base = por[k]
        for c, v in r.items():
            if v is not None and v == v:   # NaN != NaN (classico)
                base[c] = v`,
  erros: `raw = None
for t in range(3):
    try:
        raw = get_json(url)
        break
    except Exception as e:
        if t == 2:
            print(f"aviso apos retry: {e}")
        else:
            time.sleep(5 * (t + 1))`,
  ddl: `CREATE TABLE receita_mensal (
    mes                TEXT PRIMARY KEY REFERENCES periodo (mes),
    receita_total      REAL NOT NULL,
    receita_liquida    REAL NOT NULL,
    despesa            REAL NOT NULL,
    resultado_primario REAL NOT NULL,
    -- regra de integridade: receita liquida - despesa = resultado primario
    CHECK (ABS((receita_liquida - despesa) - resultado_primario) < 1000)
);`,
  dml: `INSERT INTO poder (cod_poder, nome) VALUES
  (1, 'DPU'), (2, 'Executivo'), (3, 'Judiciario'),
  (4, 'Legislativo'), (5, 'MPU');

INSERT INTO receita_mensal (mes, receita_total, receita_liquida,
                            despesa, resultado_primario) VALUES
  ('2016-01-01', 141213240860.66364, 124043962618.36778,
                 109355209090.80223,  14688753527.565538), ...`,
  diagramaA: `PODER (cod_poder PK, nome)
  1---N  ORGAO (cod_orgao PK, nome, cod_poder FK)

ANO (ano PK)
  1---N  EXECUCAO_ORGAO (ano PK/FK, cod_orgao PK/FK, dotacao, empenhado,
                         liquidado, pago)

PERIODO (mes PK ['AAAA-MM-01'], ano)
  1---N  RECEITA_MENSAL (mes PK/FK, receita_total, receita_liquida, despesa,
                         resultado_primario  <<CHECK = receita_liquida-despesa>>)
  1---N  RECEITA_ANUAL  (ano PK, receita_total, receita_liquida, despesa, res.)
  1---N  PODER_MENSAL   (mes PK/FK, custeio_capital, despesa_total, participacao)
  1---N  RECEITA_TIPO   (mes PK/FK, cod_tipo PK/FK, valor)
  1---N  DESPESA_FUNCAO (mes PK/FK, cod_funcao PK/FK, valor)

TIPO_RECEITA  (cod_tipo PK, nome)    1---N RECEITA_TIPO
FUNCAO_DESPESA (cod_funcao PK, nome) 1---N DESPESA_FUNCAO`,
  diagramaB: `PERIODO (mes PK)
  1---N  CONJUNTURA_MENSAL (mes PK/FK, ipca_m, ipca_12m, dolar, selic, ibc, ibov)
  1---N  DIVIDA_MENSAL     (mes PK/FK, dbgg, dlsp, dbgg_rs, dlsp_rs)
  1---N  RESULTADO_FISCAL_MENSAL (mes PK/FK, primario, juros, nominal)
  N---1  EMENDAS (ano PK, rp PK, dotacao, empenhado, liquidado, pago)

ESTADO (sigla PK, nome, status, fonte, periodicidade, resultado_conceito)
  1---N  UF_MENSAL  (sigla PK/FK, mes PK/FK, receita, despesa, resultado)
  1---N  UF_RECEITA (sigla PK/FK, mes PK/FK, tipo PK/FK, valor)
  1---N  UF_DESPESA (sigla PK/FK, mes PK/FK, funcao PK/FK, valor)
  1---N  UF_ANUAL   (sigla PK/FK, ano PK/FK, receita, despesa, resultado)`,
};

export const VERIFICACOES = [
  "Pipeline completo executado de ponta a ponta com sucesso.",
  "127 meses validados, com todas as bases íntegras.",
  "Análise exploratória: 8 bases processadas, 0 falhas de carga.",
  "Banco de dados: 20 tabelas, 8.624 linhas e 0 violações de chave estrangeira.",
  "Conjunto de testes automatizados: 21 aprovados e versão final gerada.",
];
