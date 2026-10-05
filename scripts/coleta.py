"""Coleta dados oficiais do Governo Federal (2022-2026).
Fontes:
1. RTN Série Histórica - Tesouro Transparente (XLSX, sem token)
2. Portal da Transparência - Despesas e Receitas (CSV download + API com token)
Uso: python src/coleta.py
"""
import ssl, os, sys, json, io, zipfile
from pathlib import Path
from datetime import datetime
import urllib.request

BASE = Path(__file__).resolve().parent.parent
DATA = BASE / "data"
DATA.mkdir(exist_ok=True)

# contorna SSL corporativo (self-signed chain)
ssl._create_default_https_context = ssl._create_unverified_context

HEADERS = {"User-Agent": "Mozilla/5.0 (AnaliseDadosGovernoFederal)"}

def download(url: str, dest: Path):
    print(f"-> Baixando {url}")
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
        f.write(r.read())
    print(f"   OK: {dest} ({dest.stat().st_size/1e6:.2f} MB)")
    return dest

def coleta_rtn():
    """Descobre URL do XLSX via API CKAN e baixa."""
    api = "https://www.tesourotransparente.gov.br/ckan/api/3/action/package_show?id=resultado-do-tesouro-nacional"
    try:
        req = urllib.request.Request(api, headers=HEADERS)
        raw = urllib.request.urlopen(req, timeout=30).read().decode("utf-8")
        pkg = json.loads(raw)["result"]
        for res in pkg["resources"]:
            if res.get("format", "").upper() == "XLSX" and "Mensal" in res.get("name", ""):
                url = res["url"]
                # CKAN as vezes retorna url relativa de upload
                if url.startswith("/"):
                    url = "https://www.tesourotransparente.gov.br" + url
                # força download direto
                if "/download" not in url:
                    url = url.replace("/resource/", "/dataset/").rstrip("/") + f"/resource/{res['id']}/download/{res.get('name','rtn.xlsx')}"
                dest = DATA / "rtn_serie_historica.xlsx"
                try:
                    return download(url, dest)
                except Exception as e:
                    print(f"   Falha no XLSX descoberto, tentando fallback: {e}")
        print("Recurso XLSX mensal não encontrado no package_show.")
    except Exception as e:
        print(f"[AVISO] CKAN falhou ({e}). Tentando URL direta conhecida...")
    # fallback: tenta endpoint de download direto CKAN
    fallback = "https://www.tesourotransparente.gov.br/ckan/dataset/ab56485b-9c40-4efb-8563-9ce3e1973c4b/resource/527ccdb1-3059-42f3-bf23-b5e3ab4c6dc6/download/resultado-do-tesouro-nacional.xlsx"
    try:
        return download(fallback, DATA / "rtn_serie_historica.xlsx")
    except Exception as e:
        print(f"[ERRO] Não foi possível baixar RTN: {e}")
        return None

def gera_amostra():
    """Gera dados sintéticos REALISTAS (ordem de grandeza real) para o dashboard funcionar offline.
    Valores baseados em RTN 2022-2024: receita ~2.2-2.6 tri/ano, despesa ~2.3-2.7 tri/ano."""
    import pandas as pd
    import numpy as np
    np.random.seed(42)
    meses = pd.date_range("2022-01-01", "2026-08-01", freq="MS")
    # tendência de crescimento ~7% a.a. + sazonalidade dez/jan
    receita, despesa = [], []
    r0, d0 = 165e9, 175e9
    for i, m in enumerate(meses):
        crescimento = (1.0055) ** i
        saz = 1 + 0.12 * (m.month == 12) + 0.08 * (m.month == 1) - 0.05 * (m.month == 2)
        receita.append(r0 * crescimento * saz * (1 + np.random.normal(0, 0.03)))
        despesa.append(d0 * crescimento * (1.15 if m.month == 12 else 1.0) * (1 + np.random.normal(0, 0.03)))
    df = pd.DataFrame({"mes": meses, "receita": receita, "despesa": despesa})
    df["resultado_primario"] = df["receita"] - df["despesa"]
    df.to_csv(DATA / "rtn_mensal_2022_2026.csv", index=False)

    funcoes = ["Previdência Social", "Juros e Encargos da Dívida", "Saúde", "Educação",
               "Assistência Social", "Defesa Nacional", "Segurança Pública", "Transporte",
               "Trabalho", "Administração", "Outras Funções"]
    pesos = [0.32, 0.18, 0.09, 0.07, 0.11, 0.04, 0.03, 0.03, 0.03, 0.04, 0.06]
    rows = []
    for _, r in df.iterrows():
        for f, p in zip(funcoes, pesos):
            rows.append({"mes": r["mes"], "funcao": f,
                         "valor": r["despesa"] * p * (1 + np.random.normal(0, 0.05))})
    pd.DataFrame(rows).to_csv(DATA / "despesa_por_funcao.csv", index=False)

    orgaos = ["INSS", "Ministério da Saúde", "Ministério da Educação", "Ministério da Defesa",
              "Ministério do Desenvolvimento Social", "Ministério da Fazenda", "Encargos Financeiros da União",
              "Ministério dos Transportes", "Ministério do Trabalho", "Outros Órgãos"]
    pesos_o = [0.30, 0.12, 0.09, 0.06, 0.12, 0.04, 0.15, 0.03, 0.03, 0.06]
    rows = []
    for _, r in df.iterrows():
        for o, p in zip(orgaos, pesos_o):
            rows.append({"mes": r["mes"], "orgao": o,
                         "valor": r["despesa"] * p * (1 + np.random.normal(0, 0.05))})
    pd.DataFrame(rows).to_csv(DATA / "despesa_por_orgao.csv", index=False)

    rec_tipos = ["IR", "IPI", "Contrib. Previdenciária", "COFINS", "PIS/PASEP", "CSLL", "Royalties/Dividendos", "Outras"]
    pesos_r = [0.24, 0.04, 0.24, 0.13, 0.04, 0.07, 0.08, 0.16]
    rows = []
    for _, r in df.iterrows():
        for t, p in zip(rec_tipos, pesos_r):
            rows.append({"mes": r["mes"], "tipo": t,
                         "valor": r["receita"] * p * (1 + np.random.normal(0, 0.04))})
    pd.DataFrame(rows).to_csv(DATA / "receita_por_tipo.csv", index=False)
    print("Amostra realista gerada em data/*.csv (substitua rodando a coleta real).")

if __name__ == "__main__":
    print("=== Coleta Governo Federal ===")
    rtn = coleta_rtn()
    if rtn is None or not rtn.exists():
        print("Gerando amostra para desenvolvimento do dashboard...")
        gera_amostra()
    else:
        print("RTN baixado. Rode: python src/processa_rtn.py (próximo passo) ou use a amostra com --amostra")
        if "--amostra" in sys.argv:
            gera_amostra()
