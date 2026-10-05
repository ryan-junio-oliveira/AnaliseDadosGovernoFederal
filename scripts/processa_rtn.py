"""Processa RTN série histórica (tabela 1.1) em CSVs limpos (janela rolante)."""
import openpyxl
import pandas as pd
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from janela import ANO_FIM, ANO_INI, MES_FIM, MES_INI

BASE = Path(__file__).resolve().parent.parent
XLSX = BASE / "data" / "rtn_serie_historica.xlsx"
DATA = BASE / "data"

wb = openpyxl.load_workbook(XLSX, data_only=True, read_only=True)
ws = wb["1.1"]
rows = list(ws.iter_rows(values_only=True))
header = rows[4]  # Discriminação + datas
dates = [pd.to_datetime(h) for h in header[1:] if h is not None]

labels = [r[0] for r in rows]
def get_row(idx):
    vals = list(rows[idx][1:1+len(dates)])
    return pd.Series([float(v) if v not in (None, "") else 0 for v in vals], index=dates)

# índices (0-based da planilha): ver mapeamento
RECEITA_TOTAL = get_row(5)
RECEITA_LIQUIDA = get_row(37)
DESPESA_TOTAL = get_row(38)
RESULTADO = get_row(65)

mensal = pd.DataFrame({
    "mes": dates,
    "receita_total": RECEITA_TOTAL.values * 1e6,   # R$ milhões -> R$
    "receita": RECEITA_LIQUIDA.values * 1e6,
    "despesa": DESPESA_TOTAL.values * 1e6,
    "resultado_primario": RESULTADO.values * 1e6,
})
mensal = mensal[(mensal["mes"] >= MES_INI) & (mensal["mes"] <= MES_FIM)]
mensal.to_csv(DATA / "rtn_mensal_2022_2026.csv", index=False)
print(f"mensal: {len(mensal)} meses, {mensal['mes'].min()} -> {mensal['mes'].max()}")
print(mensal.groupby(mensal["mes"].dt.year)[["receita","despesa"]].sum()/1e12)

# receitas por tipo (agrupado, nomes limpos)
mapa_rec = {6:"RFB - Demais/IR*", 9:"Imposto sobre a Renda", 11:"COFINS", 12:"PIS/Pasep",
            13:"CSLL", 7:"Importação", 8:"IPI", 10:"IOF", 18:"Arrec. Líquida RGPS (INSS)",
            20:"Concessões e Permissões", 21:"Dividendos e Participações",
            24:"Exploração Recursos Naturais", 28:"Transferências a Estados/Municípios (dedução)"}
rec_rows = []
for idx, nome in mapa_rec.items():
    s = get_row(idx)
    for d, v in s.items():
        if pd.to_datetime(d) >= pd.to_datetime(MES_INI):
            rec_rows.append({"mes": pd.to_datetime(d), "tipo": nome, "valor": float(v)*1e6})
pd.DataFrame(rec_rows).to_csv(DATA / "receita_por_tipo.csv", index=False)

# despesas por grupo
mapa_des = {39:"Benefícios Previdenciários (INSS)", 40:"Pessoal e Encargos",
            42:"Abono e Seguro-Desemprego", 46:"BPC/LOAS", 55:"Precatórios/Sentenças",
            56:"Subsídios/Subvenções/Proagro", 63:"Obrigatórias c/ Controle de Fluxo (ex: Bolsa Família/Saúde)",
            64:"Discricionárias (investimento e custeio livre)"}
des_rows = []
for idx, nome in mapa_des.items():
    s = get_row(idx)
    for d, v in s.items():
        if pd.to_datetime(d) >= pd.to_datetime(MES_INI):
            des_rows.append({"mes": pd.to_datetime(d), "funcao": nome, "valor": float(v)*1e6})
pd.DataFrame(des_rows).to_csv(DATA / "despesa_por_funcao.csv", index=False)

# órgão aproximado (para aba 4, deriva dos grupos — o detalhamento por órgão vem do Portal da Transparência)
import numpy as np
org_map = {"INSS":39, "Pessoal (todos os poderes)":40, "Desenvolvimento Social (Bolsa Família+BPC)":46,
           "Trabalho (Abono/Seguro)":42, "Judiciário/Precatórios":55, "Demais Executivo":64}
org_rows = []
for nome, idx in org_map.items():
    s = get_row(idx)
    for d, v in s.items():
        if pd.to_datetime(d) >= pd.to_datetime(MES_INI):
            org_rows.append({"mes": pd.to_datetime(d), "orgao": nome, "valor": float(v)*1e6})
pd.DataFrame(org_rows).to_csv(DATA / "despesa_por_orgao.csv", index=False)
print("OK: receita_por_tipo, despesa_por_funcao, despesa_por_orgao gerados com DADOS REAIS do RTN.")

# Poderes Legislativo/Judiciario + MPU/DPU (custeio e capital) — linha 4.3.12 (idx 53).
# ATENCAO: o RTN nao separa Legislativo x Judiciario aqui, e o pessoal desses Poderes
# esta dentro de "Pessoal e Encargos" (4.2). Ver docstring da secao Poderes no frontend.
LEGJUD = get_row(53)
poderes = pd.DataFrame({
    "mes": dates,
    "legjud_mpudpu_custeio_capital": LEGJUD.values * 1e6,
    "despesa_total": DESPESA_TOTAL.values * 1e6,
})
poderes = poderes[(poderes["mes"] >= MES_INI) & (poderes["mes"] <= MES_FIM)]
poderes["participacao"] = poderes["legjud_mpudpu_custeio_capital"] / poderes["despesa_total"] * 100
poderes.to_csv(DATA / "poderes_mensal.csv", index=False)
print(poderes.groupby(poderes["mes"].dt.year)["legjud_mpudpu_custeio_capital"].sum() / 1e9)
print("OK: poderes_mensal.csv (agregado RTN 4.3.12).")
