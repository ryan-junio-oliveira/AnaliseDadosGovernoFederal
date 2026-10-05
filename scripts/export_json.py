"""Exporta JSONs estaticos p/ public/data. A dashboard React le SO esses arquivos."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

BASE = Path(__file__).resolve().parent.parent
DATA = BASE / "data"

FALTANDO = DATA / "rtn_mensal_2022_2026.csv"
if not FALTANDO.exists():
    print("ERRO: base da Uniao nao encontrada em data/.")
    print("Rode a opcao 1 do menu.bat (Atualizar TUDO) uma vez para baixar")
    print("o RTN e gerar os CSVs. UFs do SICONFI nao precisam desta etapa.")
    raise SystemExit(1)

from dados import load
import pandas as pd

BASE = Path(__file__).resolve().parent.parent
OUT = BASE / "public" / "data"
OUT.mkdir(parents=True, exist_ok=True)

m, r, f, o = load()
m["mes"] = pd.to_datetime(m["mes"]).dt.strftime("%Y-%m-%d")
for df in (r, f, o):
    df["mes"] = pd.to_datetime(df["mes"]).dt.strftime("%Y-%m-%d")

m.to_json(OUT / "mensal.json", orient="records", force_ascii=False)
r.to_json(OUT / "receitas.json", orient="records", force_ascii=False)
f.to_json(OUT / "despesas.json", orient="records", force_ascii=False)

mm = m.copy()
mm["ano"] = pd.to_datetime(mm["mes"]).dt.year
anual = mm.groupby("ano")[["receita", "receita_total", "despesa", "resultado_primario"]].sum().reset_index()
anual.to_json(OUT / "anual.json", orient="records", force_ascii=False)

pod = pd.read_csv(BASE / "data" / "poderes_mensal.csv", parse_dates=["mes"])
pod["mes"] = pd.to_datetime(pod["mes"]).dt.strftime("%Y-%m-%d")
pod.to_json(OUT / "poderes.json", orient="records", force_ascii=False)

tod = pd.read_csv(BASE / "data" / "orgaos_todos.csv")
tod.to_json(OUT / "orgaos_todos.json", orient="records", force_ascii=False)
print("JSONs em public/data:", sorted(p.name for p in OUT.glob("*.json")))
