"""Modulo compartilhado de ETL (sem servidor): rotulos curtos + load dos CSVs.
Usado por export_json.py. A dashboard em producao le apenas frontend/data/*.json.
"""
import unicodedata
from pathlib import Path

import pandas as pd

BASE = Path(__file__).resolve().parent.parent
DATA = BASE / "data"


def fold(s):
    """Minusculas sem acento p/ comparacao robusta (so usa ASCII no codigo)."""
    return unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode().lower()


# chave = versao sem acento do rotulo do CSV ; valor = rotulo curto (ASCII, seguro)
REC_SHORT = {
    "rfb - demais/ir*": "Outras RFB",
    "imposto sobre a renda": "Imposto de Renda",
    "cofins": "COFINS",
    "pis/pasep": "PIS/Pasep",
    "csll": "CSLL",
    "importacao": "Importacao",
    "ipi": "IPI",
    "iof": "IOF",
    "arrec. liquida rgps (inss)": "Previdencia (RGPS)",
    "concessoes e permissoes": "Concessoes",
    "dividendos e participacoes": "Dividendos/Estatais",
    "exploracao recursos naturais": "Royalties/Petroleo",
    "transferencias a estados/municipios (deducao)": "Transf. Estados/Municipios",
}
DES_SHORT = {
    "beneficios previdenciarios (inss)": "Previdencia (INSS)",
    "pessoal e encargos": "Pessoal e Encargos",
    "abono e seguro-desemprego": "Abono/Seguro-Desemprego",
    "bpc/loas": "BPC/LOAS",
    "precatorios/sentencas": "Precatorios",
    "subsidios/subvencoes/proagro": "Subsidios/Proagro",
    "obrigatorias c/ controle de fluxo (ex: bolsa familia/saude)": "Bolsa Familia/Saude (fluxo)",
    "discricionarias (investimento e custeio livre)": "Discricionarias/Investimentos",
}
ORG_SHORT = {
    "inss": "INSS",
    "pessoal (todos os poderes)": "Pessoal (todos os poderes)",
    "desenvolvimento social (bolsa familia+bpc)": "Desenv. Social (Bolsa Familia+BPC)",
    "trabalho (abono/seguro)": "Trabalho (Abono/Seguro)",
    "judiciario/precatorios": "Judiciario/Precatorios",
    "demais executivo": "Demais Executivo",
}


def shorten(series, mapa):
    return series.apply(lambda v: mapa.get(fold(v), str(v)))


def load():
    m = pd.read_csv(DATA / "rtn_mensal_2022_2026.csv", parse_dates=["mes"])
    r = pd.read_csv(DATA / "receita_por_tipo.csv", parse_dates=["mes"])
    f = pd.read_csv(DATA / "despesa_por_funcao.csv", parse_dates=["mes"])
    o = pd.read_csv(DATA / "despesa_por_orgao.csv", parse_dates=["mes"])
    r["tipo"] = shorten(r["tipo"], REC_SHORT)
    f["funcao"] = shorten(f["funcao"], DES_SHORT)
    o["orgao"] = shorten(o["orgao"], ORG_SHORT)
    return m, r, f, o
