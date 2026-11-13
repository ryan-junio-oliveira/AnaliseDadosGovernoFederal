# Diagnostico Estatístico — Amostra escolhida

Gerado por `scripts/analise/estatistica.py`. Insumo do Relatorio do Modulo 1.

## 1. Definicao da amostra

- **Variavel:** `resultado_primario` (receita liquida - despesa), valores mensais da Uniao em R$ (RTN Tabela 1.1, Tesouro Nacional).
- **Periodo:** 2016-01 a 2026-07 (janela rolante de 10 anos do pipeline).
- **n = 127 observacoes mensais** (unidade de analise: mes).
- **Tipo de amostra:** serie temporal completa da janela (censos dos meses publicados, nao amostragem aleatoria) — as inferencias vao para o processo gerador dos meses da janela.

## 2. Sumario

- media = -12.969,76 R$ mi/mes | mediana = -15.540,20 R$ mi/mes | desvio padrao = 39.853,69 R$ mi/mes

## 3. Posicao e variabilidade

### 3.1 Medidas de posicao

| medida | valor (R$ milhoes/mes) |
|---|---|
| media | -12.969,76 |
| mediana | -15.540,20 |
| 1o quartil (Q1) | -26.473,22 |
| 3o quartil (Q3) | 9.490,84 |
| percentil 10 | -55.256,86 |
| percentil 90 | 28.879,33 |

- Leitura: media acima da mediana em R$ 2.570,44 mi; assimetria medida = -0.718 — cauda esquerda mais longa (o minimo distancia-se mais da mediana que o maximo). Por isso media e mediana sao reportadas juntas.

### 3.2 Medidas de variabilidade

| medida | valor |
|---|---|
| minimo | -194.853,11 |
| maximo | 86.996,64 |
| amplitude | 281.849,74 |
| variancia (amostral, ddof=1) | 1.588,32 (R$ bi)^2 |
| desvio padrao | 39.853,69 |
| coeficiente de variacao | 307,3% |

- CV elevado e esperado no resultado primario: e uma serie cru (nominal), sem dessazonalizar, com saltos de dezembro (pagamentos) e de anos eleitorais/da pandemia.

## 4. Diagnostico de normalidade

### 4.1 Resultado primario mensal (n = 127)

| teste/medida | valor |
|---|---|
| Shapiro-Wilk (W) | 0.9359 |
| Shapiro-Wilk (p-valor) | < 0,001 |
| assimetria (skewness) | -0.718 |
| curtose (excesso) | 3.496 |

- decisao (alpha = 0.05): **rejeita H0 (nao normal)**.

## 5. Testes de hipotese

### 5.1 Teste t de uma amostra — a media do resultado primario e zero?

- **H0:** mu = 0 (nao ha superavit/deficit medio mensal sistematico)
- **H1:** mu != 0 (há desvio medio mensal sistematico) — bicaudal
- **Estatistica:** t = -3.667 | **gl** = 126 | **p-valor** < 0,001 | **alpha** = 0.05
- **Decisao:** REJEITA H0 — a media mensal difere de zero em R$ -12.969,76 mi/mes.

### 5.2 Teste t de Welch — receita liquida media: 2016-2020 x 2021-2025

- **H0:** mu(2016-20) = mu(2021-25) (a receita media mensal nao mudou)
- **H1:** mu(2016-20) != mu(2021-25) — bicaudal
- 2026 excluido: ano incompleto (jul) distorceria a media do grupo.

| grupo | n | media (R$ mi/mes) | desvio padrao (R$ mi) | Shapiro p |
|---|---|---|---|---|
| 2016-2020 | 60 | 100.471,97 | 23.439,38 | = 0,0030 |
| 2021-2025 | 60 | 163.849,51 | 36.429,77 | = 0,1014 |

- **Estatistica (Welch):** t = -11.333 | **p-valor** < 0,001 | **alpha** = 0.05
- **Decisao:** REJEITA H0 — a receita liquida media mensal mudou entre os periodos.
- **Tamanho do efeito (Cohen d):** +2.07 (efeito grande) — variacao relativa de 63,1% na media mensal.

### 5.3 Mann-Whitney U — alternativa nao parametrica

- Mesmos grupos; nao exige normalidade, compara probabilidades de dominancia entre os periodos.
- **Estatistica:** U = 211 | **p-valor** < 0,001 | **alpha** = 0.05
- **Decisao:** REJEITA H0 — converge com o teste t de Welch.

### 5.4 Premissas declaradas

- Independencia entre meses: razoavel para a serie fiscal agregada (sem autocorrelacao forte investigada aqui);
- Normalidade: aferida por Shapiro-Wilk em cada grupo (p = 0,0030 e p = 0,1014); com n por grupo = 60, o teste t de Welch e robusto mesmo sob leve nao-normalidade;
- Variancias desiguais: tratadas pelo correcao de Welch (equal_var=False).
