# Resumo da Analise Exploratoria e Tratamento

Gerado por `scripts/analise/exploratoria.py` a partir de `public/data/*.json`.
Este arquivo e insumo do Relatorio do Modulo 1.

- bases processadas: **8**
- bases puladas por erro/ausencia: **0**

## 1. Carga, schema e qualidade por base

### mensal

| coluna | tipo | nulos | distinct |
|---|---|---|---|
| mes | object | 0 | 127 |
| receita_total | float64 | 0 | 127 |
| receita | float64 | 0 | 127 |
| despesa | float64 | 0 | 127 |
| resultado_primario | float64 | 0 | 127 |

- linhas: **127** | colunas: **5**
- duplicatas (linha inteira): **0**
- duplicatas na chave ('mes',): **0**

### receitas

| coluna | tipo | nulos | distinct |
|---|---|---|---|
| mes | object | 0 | 127 |
| tipo | object | 0 | 13 |
| valor | float64 | 0 | 1650 |

- linhas: **1651** | colunas: **3**
- duplicatas (linha inteira): **0**
- duplicatas na chave ('mes', 'tipo'): **0**

### despesas

| coluna | tipo | nulos | distinct |
|---|---|---|---|
| mes | object | 0 | 127 |
| funcao | object | 0 | 8 |
| valor | float64 | 0 | 1016 |

- linhas: **1016** | colunas: **3**
- duplicatas (linha inteira): **0**
- duplicatas na chave ('mes', 'funcao'): **0**

### poderes

| coluna | tipo | nulos | distinct |
|---|---|---|---|
| mes | object | 0 | 127 |
| legjud_mpudpu_custeio_capital | float64 | 0 | 127 |
| despesa_total | float64 | 0 | 127 |
| participacao | float64 | 0 | 127 |

- linhas: **127** | colunas: **4**
- duplicatas (linha inteira): **0**
- duplicatas na chave ('mes',): **0**

### orgaos_todos

| coluna | tipo | nulos | distinct |
|---|---|---|---|
| ano | int64 | 0 | 11 |
| cod_orgao | int64 | 0 | 64 |
| orgao | object | 0 | 95 |
| poder | object | 0 | 5 |
| pago | float64 | 0 | 504 |
| empenhado | float64 | 0 | 504 |
| liquidado | float64 | 0 | 504 |
| dotacao | float64 | 0 | 510 |

- linhas: **531** | colunas: **8**
- duplicatas (linha inteira): **0**
- duplicatas na chave ('ano', 'cod_orgao'): **0**

### conj_mensal

| coluna | tipo | nulos | distinct |
|---|---|---|---|
| mes | object | 0 | 132 |
| ipca_m | float64 | 2 | 89 |
| ipca_12m | float64 | 2 | 117 |
| dolar | float64 | 1 | 131 |
| selic | float64 | 0 | 35 |
| ibc | float64 | 4 | 124 |
| ibov | float64 | 1 | 131 |

- linhas: **132** | colunas: **7**
- duplicatas (linha inteira): **0**
- duplicatas na chave ('mes',): **0**

### conj_fiscal

| coluna | tipo | nulos | distinct |
|---|---|---|---|
| mes | object | 0 | 129 |
| primario | float64 | 0 | 129 |
| juros | float64 | 0 | 129 |
| nominal | float64 | 0 | 129 |

- linhas: **129** | colunas: **4**
- duplicatas (linha inteira): **0**
- duplicatas na chave ('mes',): **0**

### emendas

| coluna | tipo | nulos | distinct |
|---|---|---|---|
| ano | int64 | 0 | 1 |
| rp | object | 0 | 7 |
| pago | float64 | 0 | 7 |
| empenhado | float64 | 0 | 7 |
| liquidado | float64 | 0 | 7 |
| dotacao | float64 | 0 | 7 |

- linhas: **7** | colunas: **6**
- duplicatas (linha inteira): **0**
- duplicatas na chave ('ano', 'rp'): **0**


## 2. Regras de integridade e continuidade

### Integridade aritmetica (RTN)

- Regra: `receita_liquida - despesa = resultado_primario`

- maior desvio absoluto observado: **R$ 0,000061**
- linhas fora da tolerancia de R$ 1.000: **0**

### Continuidade temporal — mensal (RTN)

- janela: **2016-01** a **2026-07**
- datas invalidas apos `to_datetime(errors='coerce')`: **0**
- meses faltantes na serie: **0**

### Continuidade temporal — conjuntura (BCB)

- janela: **2016-01** a **2026-12**
- datas invalidas apos `to_datetime(errors='coerce')`: **0**
- meses faltantes na serie: **0**

### Nulos por base

| base | linhas | celulas nulas | colunas com nulo |
|---|---|---|---|
| mensal | 127 | 0 | 0 |
| receitas | 1651 | 0 | 0 |
| despesas | 1016 | 0 | 0 |
| poderes | 127 | 0 | 0 |
| orgaos_todos | 531 | 0 | 0 |
| conj_mensal | 132 | 10 | 5 |
| conj_fiscal | 129 | 0 | 0 |
| emendas | 7 | 0 | 0 |

### Composicao da receita por tributo (correcao aplicada)

- Comparacao: soma das 12 linhas de tributo (RTN 1.1, **sem** a linha de deducao) x Receita Total do mes

- razao media: **93.7%** | min: 82.4% | max: 97.4%
- deducao: Receita Total - Transf. = Receita Liquida confere em **100%** dos meses (2024-01: 279,2 - 41,3 = 237,9 bi)

- **Correcao registrada nesta EDA** (v1 do pipeline media 209% da receita liquida):

  1. a linha `Outras RFB` trazia o **subtotal 1.1 'Receita Administrada pela RFB'** (198,7 bi em 2024-01) — duplicava IR/COFINS/PIS/CSLL/IPI/IOF/Importacao no gráfico;

  2. `Royalties/Petroleo` trazia a linha 24 ('Receitas Próprias') em vez da linha 23 ('Exploração de Recursos Naturais').

- Apos a correcao em `processa_rtn.py` (mapa_rec 6→16, 24→23), 2024-01: Outras RFB = 3,7 bi (residual real) e Royalties = 16,8 bi (exploração de recursos naturais).

- Residuo de 6.3% = linhas nao plotadas na fonte (salario-educacao, contr. seguridade social, demais nao-administradas, CIDE). Leitura: **por serie, nao por soma**.

### Cobertura da despesa por funcao

- Comparacao: soma dos 8 grupos selecionados (RTN 1.1) x despesa total do mes

- razao media: **92.6%** | min: 55.7% | max: 97.5%
- leitura: os grupos cobrem em media 93% da despesa total — faltam subgrupos de 4.3 ('Outras Despesas Obrigatórias' nao destacados). Mesmo caso das receitas: leitura por serie, nao por soma.

### Tratamento de valores nulos (caso conj_mensal)

- `conj_mensal.json`: **4** nulos em `ibc` (12 de 2017 — lacuna da serie do BCB; 4 do fim da janela) e nulos no fim da janela em ipca/dolar/ibov (2026-09 a 2026-11: meses ainda nao publicados)

- Tratamento: **mantem-se NULL**; a serie e plotada com quebra natural no ponto ausente, sem arrasto de valor anterior.


## 3. Distribuicao e outliers

### Outliers — resultado_primario (Tukey 1,5 x IQR)

- Q1 = -26.473.224.403,55 | Q3 = 9.490.838.006,91 | IQR = 35.964.062.410,46
- limites: [-80.419.318.019,24 ; 63.436.931.622,60]
- pontos fora dos limites: **11** de 127 (8.7%)
- maiores desvios: -194.853.108.064, -126.635.618.047, -116.033.395.967, -96.070.043.994, -93.001.139.011
- leitura: sazonalidade/distorcoes reais do fluxo fiscal (dez. e eleicoes), nao erros de carga — mantidos.

### Outliers — receita (Tukey 1,5 x IQR)

- Q1 = 94.877.799.471,65 | Q3 = 168.467.017.569,15 | IQR = 73.589.218.097,50
- limites: [-15.506.027.674,61 ; 278.850.844.715,41]
- pontos fora dos limites: **0** de 127 (0.0%)


