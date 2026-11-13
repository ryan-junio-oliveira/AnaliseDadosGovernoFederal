-- =============================================================================
-- Observatorio dos Dados — Módulo 1 (Fundamentos e Modelagem Inicial)
-- DDL: modelo lógico-relacional do acervo fiscal/fato-gráfico do projeto
-- SGBD: SQLite 3 (arquivo data/observatorio.db)
-- Fonte dos dados: public/data/*.json (gerados pelo pipeline em scripts/)
-- Uso: executado por scripts/banco/carregar.py
-- =============================================================================

PRAGMA foreign_keys = ON;

-- -----------------------------------------------------------------------------
-- DIMENSÕES (entidades de referencia)
-- -----------------------------------------------------------------------------

-- Poderes da Republica (Legislativo, Judiciario, Executivo, MPU, DPU)
CREATE TABLE poder (
    cod_poder INTEGER PRIMARY KEY,
    nome      TEXT NOT NULL UNIQUE
);

-- Classificacao da receita federal por tributo/grupo (RTN Tabela 1.1)
CREATE TABLE tipo_receita (
    cod_tipo INTEGER PRIMARY KEY,
    nome     TEXT NOT NULL UNIQUE
);

-- Grupos de despesa federal por funcao (RTN Tabela 1.1)
CREATE TABLE funcao_despesa (
    cod_funcao INTEGER PRIMARY KEY,
    nome       TEXT NOT NULL UNIQUE
);

-- Dimensao de tempo mensal: toda referencia de "mes" do banco aponta para aqui
CREATE TABLE periodo (
    mes TEXT PRIMARY KEY,          -- formato 'AAAA-MM-01'
    ano INTEGER NOT NULL,
    CHECK (mes GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-01')
);

-- Unidades federativas + metadados do RREO (SICONFI)
CREATE TABLE estado (
    sigla             TEXT PRIMARY KEY,   -- 'SP', 'RJ', ...
    nome              TEXT NOT NULL UNIQUE,
    status            TEXT,               -- 'disponivel' | 'em-coleta'
    fonte             TEXT,
    periodicidade     TEXT,
    resultado_conceito TEXT,
    populacao_ref     INTEGER
);

-- Orgaos superiores com execucao orçamentaria no SIOP
CREATE TABLE orgao (
    cod_orgao INTEGER PRIMARY KEY,
    nome      TEXT NOT NULL,
    cod_poder INTEGER NOT NULL REFERENCES poder (cod_poder)
);

-- -----------------------------------------------------------------------------
-- Fatos / tabelas de medida
-- -----------------------------------------------------------------------------

-- Execucao anual por orgao superior (SIOP RDF): dotação x empenhado x liquidado x pago
CREATE TABLE execucao_orgao (
    ano       INTEGER NOT NULL,
    cod_orgao INTEGER NOT NULL REFERENCES orgao (cod_orgao),
    dotacao   REAL NOT NULL DEFAULT 0,
    empenhado REAL NOT NULL DEFAULT 0,
    liquidado REAL NOT NULL DEFAULT 0,
    pago      REAL NOT NULL DEFAULT 0,
    PRIMARY KEY (ano, cod_orgao)
);

-- Balanco mensal da Uniao (RTN 1.1): receita liquida x despesa x resultado primario
CREATE TABLE receita_mensal (
    mes                TEXT PRIMARY KEY REFERENCES periodo (mes),
    receita_total      REAL NOT NULL,
    receita_liquida    REAL NOT NULL,
    despesa            REAL NOT NULL,
    resultado_primario REAL NOT NULL,
    -- regra de integridade: receita liquida - despesa = resultado primario
    CHECK (ABS((receita_liquida - despesa) - resultado_primario) < 1000)
);

-- Agregado anual da Uniao (mesmas colunas da tabela mensal)
CREATE TABLE receita_anual (
    ano                INTEGER PRIMARY KEY,
    receita_total      REAL NOT NULL,
    receita_liquida    REAL NOT NULL,
    despesa            REAL NOT NULL,
    resultado_primario REAL NOT NULL
);

-- Receita mensal discriminada por tributo (RTN 1.1)
CREATE TABLE receita_tipo (
    mes      TEXT NOT NULL REFERENCES periodo (mes),
    cod_tipo INTEGER NOT NULL REFERENCES tipo_receita (cod_tipo),
    valor    REAL NOT NULL,
    PRIMARY KEY (mes, cod_tipo)
);

-- Despesa mensal discriminada por funcao (RTN 1.1)
CREATE TABLE despesa_funcao (
    mes        TEXT NOT NULL REFERENCES periodo (mes),
    cod_funcao INTEGER NOT NULL REFERENCES funcao_despesa (cod_funcao),
    valor      REAL NOT NULL,
    PRIMARY KEY (mes, cod_funcao)
);

-- Agregado do item 4.3.12 do RTN: Legislativo + Judiciario + MPU + DPU
CREATE TABLE poder_mensal (
    mes             TEXT PRIMARY KEY REFERENCES periodo (mes),
    custeio_capital REAL NOT NULL,   -- R$ do agregado 4.3.12
    despesa_total   REAL NOT NULL,   -- R$ despesa total da Uniao
    participacao    REAL NOT NULL    -- % sobre a despesa total
);

-- Indicadores macroeconomicos do Banco Central (SGS) e Ibovespa
CREATE TABLE conjuntura_mensal (
    mes      TEXT PRIMARY KEY REFERENCES periodo (mes),
    ipca_m   REAL,                   -- % a.m.
    ipca_12m REAL,                   -- % a.a. (12 meses)
    dolar     REAL,                  -- R$/US$
    selic     REAL,                  -- % a.a. (meta)
    ibc       REAL,                  -- IBC-Br dessaz. (2022=100)
    ibov      REAL                   -- pontos (fechamento mensal)
);

-- Divida publica (BCB SGS): % PIB e R$ bilhoes
CREATE TABLE divida_mensal (
    mes      TEXT PRIMARY KEY REFERENCES periodo (mes),
    dbgg     REAL,                   -- Divida Bruta do Governo Geral % PIB
    dlsp     REAL,                   -- Divida Liquida do Setor Publico % PIB
    dbgg_rs  REAL,                   -- DBGG R$ bi
    dlsp_rs  REAL                    -- DLSP R$ bi
);

-- Resultado fiscal nominal x primario x juros (BCB SGS 4649/4616/4583)
CREATE TABLE resultado_fiscal_mensal (
    mes      TEXT PRIMARY KEY REFERENCES periodo (mes),
    primario REAL,
    juros    REAL,
    nominal  REAL
);

-- Emendas parlamentares por Resolução/Painel - RP (SIOP)
CREATE TABLE emendas (
    ano       INTEGER NOT NULL,
    rp        TEXT NOT NULL,        -- '0'..'6'
    dotacao   REAL,
    empenhado REAL,
    liquidado REAL,
    pago      REAL,
    PRIMARY KEY (ano, rp)
);

-- Saldos bimestrais dos estados/DF (SICONFI RREO Anexo 1)
CREATE TABLE uf_mensal (
    sigla             TEXT NOT NULL REFERENCES estado (sigla),
    mes               TEXT NOT NULL REFERENCES periodo (mes),
    bimestre          INTEGER NOT NULL,   -- 1..6 (mes = 1o mes do bimestre)
    receita           REAL NOT NULL,      -- receita realizada
    receita_total     REAL,
    despesa           REAL NOT NULL,      -- despesa paga
    resultado_primario REAL NOT NULL,     -- orcamentario (nao primario da Uniao)
    PRIMARY KEY (sigla, mes)
);

-- Receita dos estados por tipo (RREO Anexo 1)
CREATE TABLE uf_receita (
    sigla TEXT NOT NULL REFERENCES estado (sigla),
    mes   TEXT NOT NULL REFERENCES periodo (mes),
    tipo  TEXT NOT NULL,
    valor REAL NOT NULL,
    PRIMARY KEY (sigla, mes, tipo)
);

-- Despesa dos estados por funcao (RREO Anexo 1)
CREATE TABLE uf_despesa (
    sigla   TEXT NOT NULL REFERENCES estado (sigla),
    mes     TEXT NOT NULL REFERENCES periodo (mes),
    funcao  TEXT NOT NULL,
    valor   REAL NOT NULL,
    PRIMARY KEY (sigla, mes, funcao)
);

-- Agregado anual por estado (derivado do RREO)
CREATE TABLE uf_anual (
    sigla             TEXT NOT NULL REFERENCES estado (sigla),
    ano               INTEGER NOT NULL,
    receita           REAL,
    receita_total     REAL,
    despesa           REAL,
    resultado_primario REAL,
    PRIMARY KEY (sigla, ano)
);

-- -----------------------------------------------------------------------------
-- INDICES (apoio as consultas analiticas do dashboard)
-- -----------------------------------------------------------------------------
CREATE INDEX idx_receita_tipo_tipo    ON receita_tipo (cod_tipo);
CREATE INDEX idx_despesa_funcao_funcao ON despesa_funcao (cod_funcao);
CREATE INDEX idx_execucao_orgao       ON execucao_orgao (cod_orgao);
CREATE INDEX idx_uf_mensal_mes        ON uf_mensal (mes);
