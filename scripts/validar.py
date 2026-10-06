"""Valida os JSONs servidos pelo frontend (public/data). Falha com exit 1 se inconsistente.
Uso: python scripts/validar.py
"""
import json
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
DATA = BASE / "public" / "data"

REQUERIDOS = ["mensal", "anual", "receitas", "despesas", "poderes", "orgaos_todos"]
erros = []

def carrega(nome):
    p = DATA / f"{nome}.json"
    if not p.exists() or p.stat().st_size == 0:
        erros.append(f"{nome}.json ausente ou vazio")
        return []
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception as e:
        erros.append(f"{nome}.json inválido: {e}")
        return []

mensal = carrega("mensal")
carrega("anual"); carrega("receitas"); carrega("despesas"); carrega("poderes"); carrega("orgaos_todos")

# conjuntura: opcional (so existe apos coleta_conjuntura.py); se existir, valida schema
CONJ = {
    "conj_mensal": ("mes",),
    "conj_dividas": ("mes",),
    "conj_desemprego": ("mes",),
    "conj_empresas": ("mes",),
    "conj_ipos": ("ano",),
    "conj_crime": ("ano",),
}
n_conj = 0
for nome, chaves in CONJ.items():
    p = DATA / f"{nome}.json"
    if not p.exists():
        continue
    rows = carrega(nome)
    n_conj += 1
    for r in rows:
        for k in chaves:
            if k not in r:
                erros.append(f"{nome} sem campo {k}: {r}")
                break

for r in mensal:
    for k in ("mes", "receita", "despesa", "resultado_primario"):
        if k not in r:
            erros.append(f"mensal sem campo {k}: {r}")
            break
    if abs((r.get("receita", 0) - r.get("despesa", 0)) - r.get("resultado_primario", 0)) > 1000:
        erros.append(f"mensal inconsistente em {r.get('mes')}: receita-despesa != resultado")

if erros:
    print("FALHAS:")
    for e in erros[:20]:
        print(" -", e)
    raise SystemExit(1)
print(f"OK: {len(mensal)} meses validados, 6 arquivos íntegros + {n_conj} de conjuntura.")
