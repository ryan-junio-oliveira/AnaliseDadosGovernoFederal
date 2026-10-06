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
    "conj_empresas_anual": ("ano",),
    "conj_ipos": ("ano",),
    "conj_crime": ("ano",),
    "conj_crime_uf": ("ano",),
    "conj_fiscal": ("mes",),
    "emendas": ("ano",),
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
# perfil das empresas: objeto {ref, nj_porte, genero_uf}, nao lista
pp = DATA / "conj_perfil.json"
if pp.exists():
    try:
        perf = json.loads(pp.read_text(encoding="utf-8"))
        if not perf.get("ref") or not perf.get("nj_porte"):
            erros.append("conj_perfil.json sem ref/nj_porte")
        else:
            n_conj += 1
    except Exception as e:
        erros.append(f"conj_perfil.json inválido: {e}")

for r in mensal:
    for k in ("mes", "receita", "despesa", "resultado_primario"):
        if k not in r:
            erros.append(f"mensal sem campo {k}: {r}")
            break
    if abs((r.get("receita", 0) - r.get("despesa", 0)) - r.get("resultado_primario", 0)) > 1000:
        erros.append(f"mensal inconsistente em {r.get('mes')}: receita-despesa != resultado")

# UFs piloto (public/data/uf/*): mesmo schema; detalhe deve reconciliar
n_uf = 0
for ufdir in sorted((DATA / "uf").glob("*")) if (DATA / "uf").exists() else []:
    mp = ufdir / "mensal.json"
    if not mp.exists():
        continue
    try:
        m = json.loads(mp.read_text(encoding="utf-8"))
    except Exception as e:
        erros.append(f"uf/{ufdir.name}/mensal.json inválido: {e}")
        continue
    if not m:
        continue  # placeholder "em-coleta": nada a validar
    n_uf += 1
    for r in m:
        for k in ("mes", "receita", "despesa", "resultado_primario"):
            if k not in r:
                erros.append(f"uf/{ufdir.name}/mensal sem campo {k}: {r}")
                break
        if abs((r.get("receita", 0) - r.get("despesa", 0)) - r.get("resultado_primario", 0)) > 1000:
            erros.append(f"uf/{ufdir.name}/mensal inconsistente em {r.get('mes')}")
            break
    for nome, chave in (("receitas", "tipo"), ("despesas", "funcao")):
        p = ufdir / f"{nome}.json"
        if not p.exists():
            erros.append(f"uf/{ufdir.name}/{nome}.json ausente")
            continue
        try:
            det = json.loads(p.read_text(encoding="utf-8"))
        except Exception as e:
            erros.append(f"uf/{ufdir.name}/{nome}.json inválido: {e}")
            continue
        soma: dict[str, float] = {}
        for r in det:
            soma[str(r.get("mes"))] = soma.get(str(r.get("mes")), 0) + (r.get("valor") or 0)
        base = {str(r["mes"]): (r["receita"] if nome == "receitas" else r["despesa"]) for r in m}
        for mes, tot in base.items():
            if abs(soma.get(mes, 0) - tot) > max(1000, tot * 0.01):
                erros.append(f"uf/{ufdir.name}/{nome} diverge do total em {mes}")
                break

if erros:
    print("FALHAS:")
    for e in erros[:20]:
        print(" -", e)
    raise SystemExit(1)
print(f"OK: {len(mensal)} meses validados, 6 arquivos íntegros + {n_conj} de conjuntura + {n_uf} UFs.")
