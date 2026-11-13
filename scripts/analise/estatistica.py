"""Diagnostico estatístico do Módulo 1 (Statistics for Data Science).

Amostra escolhida: resultado primario mensal da Uniao (RTN Tabela 1.1),
jan/2016 a jul/2026 — serie publicada pelo Tesouro Nacional.

Conteudo:
  1. Medidas de posicao ....... media, mediana, Q1/Q3, percentis 10 e 90
  2. Medidas de variabilidade . min, max, amplitude, variancia, desvio
                               padrao, coeficiente de variacao
  3. Diagnostico de normalidade Shapiro-Wilk + assimetria/curtose
  4. Testes de hipotese ....... t de 1 amostra (media = 0?)
                               t de Welch entre dois periodos (2016-20 x 2021-25)
                               Mann-Whitney U (alternativa nao parametrica)

Saida: docs/relatorio/estatistica_resultados.md (+ console)
Uso (a partir da raiz do projeto):
    python scripts/analise/estatistica.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from scipy import stats

BASE = Path(__file__).resolve().parents[2]
PUB = BASE / "public" / "data"
SAIDA = BASE / "docs" / "relatorio" / "estatistica_resultados.md"
ALFA = 0.05


def carrega(nome: str) -> list[dict]:
    return json.loads((PUB / f"{nome}.json").read_text(encoding="utf-8"))


def brl(v: float, casas: int = 0) -> str:
    s = f"{v:,.{casas}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return s


def pct(v: float, casas: int = 2) -> str:
    return f"{v:.{casas}f}".replace(".", ",") + "%"


def fmt_p(p: float) -> str:
    return "< 0,001" if p < 0.001 else f"= {p:.4f}".replace(".", ",")


def bloco_posicao(x: np.ndarray) -> list[str]:
    med = np.mean(x)
    mediana = np.median(x)
    q1, q3 = np.percentile(x, [25, 75])
    p10, p90 = np.percentile(x, [10, 90])
    sk = stats.skew(x)
    if abs(med - mediana) < abs(med) * 0.05:
        leitura = ("media e mediana praticamente coincidentes "
                   "(assimetria proxima de zero).")
    elif med > mediana:
        leitura = (f"media acima da mediana em R$ {brl((med - mediana) / 1e6, 2)} mi; "
                   f"assimetria medida = {sk:.3f} — cauda esquerda mais longa "
                   "(o minimo distancia-se mais da mediana que o maximo). "
                   "Por isso media e mediana sao reportadas juntas.")
    else:
        leitura = (f"mediana acima da media em R$ {brl((mediana - med) / 1e6, 2)} mi — "
                   f"assimetria medida = {sk:.3f} (cauda direita).")
    return [
        "### 3.1 Medidas de posicao", "",
        "| medida | valor (R$ milhoes/mes) |",
        "|---|---|",
        f"| media | {brl(med / 1e6, 2)} |",
        f"| mediana | {brl(mediana / 1e6, 2)} |",
        f"| 1o quartil (Q1) | {brl(q1 / 1e6, 2)} |",
        f"| 3o quartil (Q3) | {brl(q3 / 1e6, 2)} |",
        f"| percentil 10 | {brl(p10 / 1e6, 2)} |",
        f"| percentil 90 | {brl(p90 / 1e6, 2)} |",
        "",
        f"- Leitura: {leitura}",
        "",
    ]


def bloco_variabilidade(x: np.ndarray) -> list[str]:
    var = np.var(x, ddof=1)
    dp = np.std(x, ddof=1)
    amp = x.max() - x.min()
    cv = dp / abs(np.mean(x))
    return [
        "### 3.2 Medidas de variabilidade", "",
        "| medida | valor |",
        "|---|---|",
        f"| minimo | {brl(x.min() / 1e6, 2)} |",
        f"| maximo | {brl(x.max() / 1e6, 2)} |",
        f"| amplitude | {brl(amp / 1e6, 2)} |",
        f"| variancia (amostral, ddof=1) | {brl(var / 1e18, 2)} (R$ bi)^2 |",
        f"| desvio padrao | {brl(dp / 1e6, 2)} |",
        f"| coeficiente de variacao | {pct(cv * 100, 1)} |",
        "",
        "- CV elevado e esperado no resultado primario: e uma serie "
        "cru (nominal), sem dessazonalizar, com saltos de dezembro "
        "(pagamentos) e de anos eleitorais/da pandemia.",
        "",
    ]


def bloco_normalidade(x: np.ndarray, titulo: str) -> list[str]:
    stat, p = stats.shapiro(x)
    sk = stats.skew(x)
    ku = stats.kurtosis(x)  # excesso (normal = 0)
    decide = "rejeita H0 (nao normal)" if p < ALFA else "nao rejeita H0 (compativel com normal)"
    return [
        f"### {titulo}", "",
        "| teste/medida | valor |",
        "|---|---|",
        f"| Shapiro-Wilk (W) | {stat:.4f} |",
        f"| Shapiro-Wilk (p-valor) | {fmt_p(p)} |",
        f"| assimetria (skewness) | {sk:.3f} |",
        f"| curtose (excesso) | {ku:.3f} |",
        "",
        f"- decisao (alpha = {ALFA}): **{decide}**.",
        "",
    ]


def main() -> int:
    mensal = carrega("mensal")
    for r in mensal:
        r["ano"] = int(str(r["mes"])[:4])
    mensal.sort(key=lambda r: r["mes"])

    x = np.array([r["resultado_primario"] for r in mensal], dtype=float)
    n = len(x)
    ini, fim = mensal[0]["mes"][:7], mensal[-1]["mes"][:7]

    linhas: list[str] = [
        "# Diagnostico Estatístico — Amostra escolhida", "",
        "Gerado por `scripts/analise/estatistica.py`. Insumo do Relatorio do Modulo 1.", "",
        "## 1. Definicao da amostra", "",
        "- **Variavel:** `resultado_primario` (receita liquida - despesa), "
        "valores mensais da Uniao em R$ (RTN Tabela 1.1, Tesouro Nacional).",
        f"- **Periodo:** {ini} a {fim} (janela rolante de 10 anos do pipeline).",
        f"- **n = {n} observacoes mensais** (unidade de analise: mes).",
        "- **Tipo de amostra:** serie temporal completa da janela "
        "(censos dos meses publicados, nao amostragem aleatoria) — "
        "as inferencias vao para o processo gerador dos meses da janela.",
        "",
        "## 2. Sumario", "",
        f"- media = {brl(np.mean(x) / 1e6, 2)} R$ mi/mes | "
        f"mediana = {brl(np.median(x) / 1e6, 2)} R$ mi/mes | "
        f"desvio padrao = {brl(np.std(x, ddof=1) / 1e6, 2)} R$ mi/mes",
        "",
        "## 3. Posicao e variabilidade", "",
    ]
    linhas += bloco_posicao(x)
    linhas += bloco_variabilidade(x)

    linhas += ["## 4. Diagnostico de normalidade", ""]
    linhas += bloco_normalidade(x, "4.1 Resultado primario mensal (n = %d)" % n)

    # ---------------- teste 1: t de 1 amostra ----------------
    t1, p1 = stats.ttest_1samp(x, popmean=0.0)
    gl = n - 1
    rejeita1 = p1 < ALFA
    linhas += [
        "## 5. Testes de hipotese", "",
        "### 5.1 Teste t de uma amostra — a media do resultado primario e zero?", "",
        "- **H0:** mu = 0 (nao ha superavit/deficit medio mensal sistematico)",
        "- **H1:** mu != 0 (há desvio medio mensal sistematico) — bicaudal",
        f"- **Estatistica:** t = {t1:.3f} | **gl** = {gl} | "
        f"**p-valor** {fmt_p(p1)} | **alpha** = {ALFA}",
        f"- **Decisao:** {'REJEITA H0' if rejeita1 else 'NAO REJEITA H0'} — "
        f"a media mensal difere de zero em R$ {brl(np.mean(x) / 1e6, 2)} mi/mes.",
        "",
    ]

    # ---------------- teste 2 e 3: dois periodos ----------------
    g1 = np.array([r["receita"] for r in mensal if 2016 <= r["ano"] <= 2020], float)
    g2 = np.array([r["receita"] for r in mensal if 2021 <= r["ano"] <= 2025], float)
    # 2026 e ano incompleto (ate jul) — excluido do confronto para nao enviesar

    sw1, swp1 = stats.shapiro(g1)
    sw2, swp2 = stats.shapiro(g2)
    t2, p2 = stats.ttest_ind(g1, g2, equal_var=False)  # Welch
    u, pu = stats.mannwhitneyu(g1, g2, alternative="two-sided")
    d_cohen = (g2.mean() - g1.mean()) / np.sqrt((g1.var(ddof=1) + g2.var(ddof=1)) / 2)
    rejeita2 = p2 < ALFA

    linhas += [
        "### 5.2 Teste t de Welch — receita liquida media: 2016-2020 x 2021-2025", "",
        "- **H0:** mu(2016-20) = mu(2021-25) (a receita media mensal nao mudou)",
        "- **H1:** mu(2016-20) != mu(2021-25) — bicaudal",
        "- 2026 excluido: ano incompleto (jul) distorceria a media do grupo.", "",
        "| grupo | n | media (R$ mi/mes) | desvio padrao (R$ mi) | Shapiro p |",
        "|---|---|---|---|---|",
        f"| 2016-2020 | {len(g1)} | {brl(g1.mean() / 1e6, 2)} | "
        f"{brl(g1.std(ddof=1) / 1e6, 2)} | {fmt_p(swp1)} |",
        f"| 2021-2025 | {len(g2)} | {brl(g2.mean() / 1e6, 2)} | "
        f"{brl(g2.std(ddof=1) / 1e6, 2)} | {fmt_p(swp2)} |",
        "",
        f"- **Estatistica (Welch):** t = {t2:.3f} | **p-valor** {fmt_p(p2)} | "
        f"**alpha** = {ALFA}",
        f"- **Decisao:** {'REJEITA H0' if rejeita2 else 'NAO REJEITA H0'} — "
        "a receita liquida media mensal "
        f"{'mudou' if rejeita2 else 'nao difere'} entre os periodos.",
        f"- **Tamanho do efeito (Cohen d):** {d_cohen:+.2f} "
        f"({'efeito pequeno' if abs(d_cohen) < 0.5 else 'efeito medio' if abs(d_cohen) < 0.8 else 'efeito grande'})"
        f" — variacao relativa de {pct((g2.mean() / g1.mean() - 1) * 100, 1)} "
        "na media mensal.",
        "",
        "### 5.3 Mann-Whitney U — alternativa nao parametrica", "",
        "- Mesmos grupos; nao exige normalidade, compara probabilidades "
        "de dominancia entre os periodos.",
        f"- **Estatistica:** U = {u:.0f} | **p-valor** {fmt_p(pu)} | "
        f"**alpha** = {ALFA}",
        f"- **Decisao:** {'REJEITA H0' if pu < ALFA else 'NAO REJEITA H0'} — "
        f"converge {'com' if (pu < ALFA) == rejeita2 else 'DIVERGE de'} o teste t de Welch.",
        "",
        "### 5.4 Premissas declaradas", "",
        f"- Independencia entre meses: razoavel para a serie fiscal agregada "
        f"(sem autocorrelacao forte investigada aqui);",
        f"- Normalidade: aferida por Shapiro-Wilk em cada grupo "
        f"(p {fmt_p(swp1)} e p {fmt_p(swp2)}); com n por grupo = {len(g1)}, "
        "o teste t de Welch e robusto mesmo sob leve nao-normalidade;",
        "- Variancias desiguais: tratadas pelo correcao de Welch "
        "(equal_var=False).",
        "",
    ]

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text("\n".join(linhas), encoding="utf-8")

    # ---------------- console ----------------
    print(f"OK: {SAIDA.relative_to(BASE)}  (n={n}, {ini}..{fim})")
    print(f"  media={brl(np.mean(x)/1e6,2)} mi | mediana={brl(np.median(x)/1e6,2)} mi | "
          f"dp={brl(np.std(x,ddof=1)/1e6,2)} mi | CV={pct(np.std(x,ddof=1)/abs(np.mean(x))*100,1)}")
    sw_all = stats.shapiro(x)
    print(f"  Shapiro p={fmt_p(sw_all.pvalue)}")
    print(f"  t(1 amostra)={t1:.3f} p={fmt_p(p1)} -> {'rejeita H0' if rejeita1 else 'nao rejeita'}")
    print(f"  Welch t={t2:.3f} p={fmt_p(p2)} d={d_cohen:+.2f} -> {'rejeita H0' if rejeita2 else 'nao rejeita'}")
    print(f"  Mann-Whitney U={u:.0f} p={fmt_p(pu)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
