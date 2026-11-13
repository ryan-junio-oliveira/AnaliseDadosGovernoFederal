"""Exporta JSONs estaticos p/ public/data. A dashboard React le SO esses arquivos.

Le TODOS os insumos antes de escrever o primeiro JSON: entrada faltante aborta
com mensagem clara e sem deixar public/data pela metade.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

BASE = Path(__file__).resolve().parents[2]
DATA = BASE / "data"
OUT = BASE / "public" / "data"

from dados import load
import pandas as pd

# ---- insumos: todos conferidos/lidos antes da primeira escrita ----
BASEINS = ["rtn_mensal_2022_2026.csv", "receita_por_tipo.csv",
           "despesa_por_funcao.csv", "despesa_por_orgao.csv", "poderes_mensal.csv"]
faltando = [n for n in BASEINS if not (DATA / n).exists()]
if faltando:
    print("ERRO: CSVs da base da Uniao ausentes em data/: " + ", ".join(faltando))
    print("Rode a opcao 1 do menu.bat (Atualizar TUDO) uma vez para baixar")
    print("o RTN e gerar os CSVs. UFs do SICONFI nao precisam desta etapa.")
    raise SystemExit(1)

try:
    m, r, f, o = load()
    pod = pd.read_csv(DATA / "poderes_mensal.csv", parse_dates=["mes"])
except (FileNotFoundError, ValueError, KeyError) as e:
    print(f"ERRO: nao consegui ler os CSVs em data/ ({e.__class__.__name__}: {e}).")
    raise SystemExit(1)

tod = pd.read_csv(DATA / "orgaos_todos.csv") if (DATA / "orgaos_todos.csv").exists() else None
if tod is None:
    if not (OUT / "orgaos_todos.json").exists():
        print("ERRO: data/orgaos_todos.csv ausente e nenhum orgaos_todos.json anterior.")
        print("Rode a coleta do SIOP (scripts/atualizar.py; menu.bat opcao 3).")
        raise SystemExit(1)
    print("AVISO: data/orgaos_todos.csv ausente — mantido o orgaos_todos.json anterior.")

m["mes"] = pd.to_datetime(m["mes"]).dt.strftime("%Y-%m-%d")
for df in (r, f, o):
    df["mes"] = pd.to_datetime(df["mes"]).dt.strftime("%Y-%m-%d")
pod["mes"] = pd.to_datetime(pod["mes"]).dt.strftime("%Y-%m-%d")

mm = m.copy()
mm["ano"] = pd.to_datetime(mm["mes"]).dt.year
anual = mm.groupby("ano")[["receita", "receita_total", "despesa", "resultado_primario"]].sum().reset_index()

# ---- escrita: todos os insumos ja estao em memoria ----
OUT.mkdir(parents=True, exist_ok=True)
m.to_json(OUT / "mensal.json", orient="records", force_ascii=False)
r.to_json(OUT / "receitas.json", orient="records", force_ascii=False)
f.to_json(OUT / "despesas.json", orient="records", force_ascii=False)
anual.to_json(OUT / "anual.json", orient="records", force_ascii=False)
pod.to_json(OUT / "poderes.json", orient="records", force_ascii=False)
if tod is not None:
    tod.to_json(OUT / "orgaos_todos.json", orient="records", force_ascii=False)
print("JSONs em public/data:", sorted(p.name for p in OUT.glob("*.json")))
