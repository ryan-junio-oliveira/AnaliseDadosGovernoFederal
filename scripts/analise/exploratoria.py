"""Analise exploratoria e tratamento dos dados do Observatorio (Módulo 1).

Para cada base principal de public/data/*.json:
  - carga com tratamento de erro (JSON invalido/ausente nao derruba a execucao)
  - schema: tipos, conversao de data, contagem de nulos
  - duplicatas (linha inteira e chave primaria)
  - integridade: receita - despesa = resultado primario
  - continuidade temporal (meses faltantes na serie mensal)
  - outliers pelo metodo IQR (1,5 x amplitude interquartil)

Saida: docs/relatorio/eda_resumo.md (+ resumo no console)
Uso (a partir da raiz do projeto):
    python scripts/analise/exploratoria.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd

BASE = Path(__file__).resolve().parents[2]
PUB = BASE / "public" / "data"
SAIDA = BASE / "docs" / "relatorio" / "eda_resumo.md"

CHAVES = {
    "mensal": "mes",
    "receitas": ("mes", "tipo"),
    "despesas": ("mes", "funcao"),
    "poderes": "mes",
    "orgaos_todos": ("ano", "cod_orgao"),
    "conj_mensal": "mes",
    "conj_fiscal": "mes",
    "emendas": ("ano", "rp"),
}


def brl(v: float, casas: int = 2) -> str:
    """Numero no padrao brasileiro (1.234,56)."""
    s = f"{v:,.{casas}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return s


def carrega(nome: str) -> pd.DataFrame | None:
    """Le JSON com tratamento de erro; retorna None se ausente/invalido."""
    p = PUB / f"{nome}.json"
    try:
        if not p.exists():
            print(f"[AVISO] {nome}.json ausente — pulando.")
            return None
        dados = json.loads(p.read_text(encoding="utf-8"))
        if not isinstance(dados, list):
            print(f"[AVISO] {nome}.json nao e lista — pulando.")
            return None
        if not dados:
            print(f"[AVISO] {nome}.json vazio — pulando.")
            return None
        return pd.DataFrame(dados)
    except (json.JSONDecodeError, UnicodeDecodeError, OSError) as e:
        print(f"[ERRO] falha ao carregar {nome}.json: {e} — pulando.")
        return None


def tabela_schema(df: pd.DataFrame, nome: str, chave) -> list[str]:
    linhas = [f"### {nome}", "",
              "| coluna | tipo | nulos | distinct |", "|---|---|---|---|"]
    for c in df.columns:
        nulos = int(df[c].isna().sum())
        linhas.append(f"| {c} | {df[c].dtype} | {nulos} | {df[c].nunique()} |")
    linhas.append("")
    linhas.append(f"- linhas: **{len(df)}** | colunas: **{df.shape[1]}**")

    dup_total = int(df.duplicated().sum())
    linhas.append(f"- duplicatas (linha inteira): **{dup_total}**")

    cols_chave = [chave] if isinstance(chave, str) else list(chave)
    if all(c in df.columns for c in cols_chave):
        dup_chave = int(df.duplicated(subset=cols_chave).sum())
        linhas.append(f"- duplicatas na chave {tuple(cols_chave)}: **{dup_chave}**")
    linhas.append("")
    return linhas


def checa_integridade_federal(df: pd.DataFrame) -> list[str]:
    """receita_liquida - despesa = resultado_primario (tolerancia R$ 1 mil)."""
    diff = (df["receita"] - df["despesa"] - df["resultado_primario"]).abs()
    fora = int((diff > 1000).sum())
    return [
        "### Integridade aritmetica (RTN)", "",
        "- Regra: `receita_liquida - despesa = resultado_primario`", "",
        f"- maior desvio absoluto observado: **R$ {brl(diff.max(), 6)}**",
        f"- linhas fora da tolerancia de R$ 1.000: **{fora}**", "",
    ]


def checa_continuidade(df: pd.DataFrame, titulo: str, col: str = "mes") -> list[str]:
    """Meses ausentes na serie mensal (janela esperada min..max)."""
    datas = pd.to_datetime(df[col], errors="coerce")
    invalidas = int(datas.isna().sum())
    esperado = pd.date_range(datas.min(), datas.max(), freq="MS")
    faltantes = sorted(set(esperado) - set(datas.dt.to_period("M").dt.to_timestamp()))
    linhas = [f"### Continuidade temporal — {titulo}", "",
              f"- janela: **{datas.min():%Y-%m}** a **{datas.max():%Y-%m}**",
              f"- datas invalidas apos `to_datetime(errors='coerce')`: **{invalidas}**",
              f"- meses faltantes na serie: **{len(faltantes)}**"]
    if faltantes:
        linhas.append("- exemplos: " + ", ".join(f"{d:%Y-%m}" for d in faltantes[:8]))
    linhas.append("")
    return linhas


def checa_outliers(df: pd.DataFrame, col: str) -> list[str]:
    """Outliers pela regra de Tukey (Q1 - 1,5*IQR / Q3 + 1,5*IQR)."""
    s = pd.to_numeric(df[col], errors="coerce").dropna()
    q1, q3 = s.quantile(0.25), s.quantile(0.75)
    iqr = q3 - q1
    lim_inf, lim_sup = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    out = s[(s < lim_inf) | (s > lim_sup)]
    linhas = [f"### Outliers — {col} (Tukey 1,5 x IQR)", "",
              f"- Q1 = {brl(q1)} | Q3 = {brl(q3)} | IQR = {brl(iqr)}",
              f"- limites: [{brl(lim_inf)} ; {brl(lim_sup)}]",
              f"- pontos fora dos limites: **{len(out)}** de {len(s)} "
              f"({100 * len(out) / len(s):.1f}%)"]
    if len(out):
        top = out.reindex(out.abs().sort_values(ascending=False).index).head(5)
        linhas.append("- maiores desvios: " + ", ".join(brl(v, 0) for v in top))
        linhas.append("- leitura: sazonalidade/distorcoes reais do fluxo fiscal "
                      "(dez. e eleicoes), nao erros de carga — mantidos.")
    linhas.append("")
    return linhas


def main() -> int:
    saidas: dict[str, list[str]] = {}
    falhas: list[str] = []

    # ---------------- bloco 1: schema de cada base ----------------
    schema: list[str] = ["## 1. Carga, schema e qualidade por base", ""]
    frames: dict[str, pd.DataFrame] = {}
    for nome, chave in CHAVES.items():
        df = carrega(nome)
        if df is None:
            falhas.append(nome)
            continue
        frames[nome] = df
        schema += tabela_schema(df, nome, chave)
    saidas["schema"] = schema

    # ---------------- bloco 2: integridade e continuidade ----------------
    qual: list[str] = ["## 2. Regras de integridade e continuidade", ""]
    if "mensal" in frames:
        qual += checa_integridade_federal(frames["mensal"])
        qual += checa_continuidade(frames["mensal"], "mensal (RTN)")
    if "conj_mensal" in frames:
        qual += checa_continuidade(frames["conj_mensal"], "conjuntura (BCB)")

    # resumo de nulos por base
    qual += ["### Nulos por base", "",
             "| base | linhas | celulas nulas | colunas com nulo |",
             "|---|---|---|---|"]
    for nome, df in frames.items():
        nulos_col = df.isna().sum()
        com_nulo = int((nulos_col > 0).sum())
        qual.append(f"| {nome} | {len(df)} | {int(nulos_col.sum())} | {com_nulo} |")
    qual.append("")

    # cobertura das linhas selecionadas da RTN x totais
    if {"receitas", "mensal"} <= frames.keys():
        rec = frames["receitas"].copy()
        rec["mes"] = pd.to_datetime(rec["mes"], errors="coerce")
        dedu = rec["tipo"].str.startswith("Transf")
        trib = rec[~dedu].groupby("mes")["valor"].sum()
        tr = rec[dedu].groupby("mes")["valor"].sum()
        tot = frames["mensal"].copy()
        tot["mes"] = pd.to_datetime(tot["mes"], errors="coerce")
        tot = tot.set_index("mes")
        jun = pd.concat([trib.rename("tributos"),
                         tr.rename("transf"),
                         tot["receita_total"].rename("total"),
                         tot["receita"].rename("liquida")], axis=1).dropna()
        cob = (jun["tributos"] / jun["total"]).replace([float("inf")], pd.NA).dropna()
        # deducao: Total - Transf = Liquida
        taxa_tr = float(((jun["total"] - jun["transf"] - jun["liquida"]).abs() < 1).mean())
        # valores de referencia 2024-01 (apos correcao do mapa_rec)
        ref = pd.Timestamp("2024-01-01")
        r_ref = rec[rec["mes"] == ref]
        outras_v = float(r_ref[r_ref["tipo"] == "Outras RFB"]["valor"].iloc[0])
        roy_v = float(r_ref[r_ref["tipo"] == "Royalties/Petroleo"]["valor"].iloc[0])
        transf_v = float(r_ref[r_ref["tipo"].str.startswith("Transf")]["valor"].iloc[0])
        total_v = float(tot.loc[ref, "receita_total"])
        liq_v = float(tot.loc[ref, "receita"])
        qual += [
            "### Composicao da receita por tributo (correcao aplicada)", "",
            "- Comparacao: soma das 12 linhas de tributo (RTN 1.1, "
            "**sem** a linha de deducao) x Receita Total do mes", "",
            f"- razao media: **{cob.mean():.1%}** | min: {cob.min():.1%} | "
            f"max: {cob.max():.1%}",
            f"- deducao: Receita Total - Transf. = Receita Liquida confere "
            f"em **{taxa_tr:.0%}** dos meses "
            f"(2024-01: {brl(total_v / 1e9, 1)} - {brl(transf_v / 1e9, 1)} = "
            f"{brl(liq_v / 1e9, 1)} bi)", "",
            "- **Correcao registrada nesta EDA** (v1 do pipeline media "
            "209% da receita liquida):", "",
            "  1. a linha `Outras RFB` trazia o **subtotal 1.1 "
            "'Receita Administrada pela RFB'** (198,7 bi em 2024-01) — "
            "duplicava IR/COFINS/PIS/CSLL/IPI/IOF/Importacao no gráfico;", "",
            "  2. `Royalties/Petroleo` trazia a linha 24 "
            "('Receitas Próprias') em vez da linha 23 "
            "('Exploração de Recursos Naturais').", "",
            f"- Apos a correcao em `processa_rtn.py` (mapa_rec 6→16, 24→23), "
            f"2024-01: Outras RFB = {brl(outras_v / 1e9, 1)} bi (residual "
            f"real) e Royalties = {brl(roy_v / 1e9, 1)} bi "
            "(exploração de recursos naturais).", "",
            f"- Residuo de {100 - cob.mean() * 100:.1f}% = linhas nao "
            "plotadas na fonte (salario-educacao, contr. seguridade social, "
            "demais nao-administradas, CIDE). Leitura: **por serie, "
            "nao por soma**.", "",
        ]

    if {"despesas", "mensal"} <= frames.keys():
        des = frames["despesas"].copy()
        des["mes"] = pd.to_datetime(des["mes"], errors="coerce")
        soma_d = des.groupby("mes")["valor"].sum()
        tot_d = frames["mensal"].copy()
        tot_d["mes"] = pd.to_datetime(tot_d["mes"], errors="coerce")
        tot_d = tot_d.set_index("mes")["despesa"]
        jun_d = pd.concat([soma_d.rename("soma"), tot_d.rename("total")],
                          axis=1).dropna()
        cob_d = jun_d["soma"] / jun_d["total"]
        qual += [
            "### Cobertura da despesa por funcao", "",
            "- Comparacao: soma dos 8 grupos selecionados (RTN 1.1) "
            "x despesa total do mes", "",
            f"- razao media: **{cob_d.mean():.1%}** | min: {cob_d.min():.1%} | "
            f"max: {cob_d.max():.1%}",
            "- leitura: os grupos cobrem em media "
            f"{cob_d.mean():.0%} da despesa total — faltam subgrupos de 4.3 "
            "('Outras Despesas Obrigatórias' nao destacados). Mesmo caso das "
            "receitas: leitura por serie, nao por soma.", "",
        ]

    # nulos no bloco de conjuntura (tratamento explicito)
    if "conj_mensal" in frames:
        m = frames["conj_mensal"]
        n_ibc = int(m["ibc"].isna().sum())
        qual += [
            "### Tratamento de valores nulos (caso conj_mensal)", "",
            f"- `conj_mensal.json`: **{n_ibc}** nulos em `ibc` "
            "(12 de 2017 — lacuna da serie do BCB; 4 do fim da janela) e "
            "nulos no fim da janela em ipca/dolar/ibov "
            "(2026-09 a 2026-11: meses ainda nao publicados)", "",
            "- Tratamento: **mantem-se NULL**; a serie e plotada com quebra "
            "natural no ponto ausente, sem arrasto de valor anterior.", "",
        ]
    saidas["qualidade"] = qual

    # ---------------- bloco 3: outliers ----------------
    out: list[str] = ["## 3. Distribuicao e outliers", ""]
    if "mensal" in frames:
        out += checa_outliers(frames["mensal"], "resultado_primario")
        out += checa_outliers(frames["mensal"], "receita")
    saidas["outliers"] = out

    # ---------------- escrita ----------------
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    cab = [
        "# Resumo da Analise Exploratoria e Tratamento", "",
        "Gerado por `scripts/analise/exploratoria.py` a partir de `public/data/*.json`.",
        "Este arquivo e insumo do Relatorio do Modulo 1.",
        "",
        f"- bases processadas: **{len(frames)}**",
        f"- bases puladas por erro/ausencia: "
        f"**{len(falhas)}**" + (f" ({', '.join(falhas)})" if falhas else ""),
        "",
    ]
    with SAIDA.open("w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(cab) + "\n")
        for bloco in saidas.values():
            f.write("\n".join(bloco) + "\n\n")

    # console
    print(f"OK: {SAIDA.relative_to(BASE)}")
    for nome, df in frames.items():
        nulos = int(df.isna().sum().sum())
        print(f"  {nome:20s} {len(df):>5} linhas | {nulos:>4} nulos | "
              f"{int(df.duplicated().sum())} dup")
    if falhas:
        print(f"  puladas: {', '.join(falhas)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
