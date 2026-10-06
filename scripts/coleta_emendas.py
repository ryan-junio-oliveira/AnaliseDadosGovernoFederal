"""Agrega execucao de EMENDAS parlamentares por RP (SIOP RDF).

Fonte: data/loa{ano}.zip (mesmos dumps de coleta_orgaos_todos.py).
Liga ItemDespesa --temResultadoPrimario--> ResultadoPrimario:
  RP 6 = emendas individuais, RP 7 = bancada estadual,
  RP 8 = comissao, RP 9 = relator-geral (ate 2021).

Uso:  python scripts/coleta_emendas.py [2022 2023]   (sem args = decada)
      Processa os anos dados e MESCLA em data/emendas.csv +
      public/data/emendas.json (anos nao processados sao preservados).

Saida: data/emendas.csv + public/data/emendas.json
       colunas: ano,rp,pago,empenhado,liquidado,dotacao
"""
import re
import sys
import zipfile
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
DATA = BASE / "data"
PUB = BASE / "public" / "data"

sys.path.insert(0, str(Path(__file__).resolve().parent))
from janela import ANOS

LOA = "http://vocab.e.gov.br/2013/09/loa#"
RE_TRIPLE = re.compile(r"<([^>]+)> <([^>]+)> (.*) \.$")
RE_ID = re.compile(r"/id/(\d+)/([A-Za-z]+)/([^>/]+)")
RE_NUM = re.compile(r'"([\d.\-]+)"')
VAL_IDX = {"valorPago": 0, "valorEmpenhado": 1,
           "valorLiquidado": 2, "valorDotacaoInicial": 3}

RP_NOME = {
    "6": "Emendas individuais",
    "7": "Emendas de bancada",
    "8": "Emendas de comissão",
    "9": "Emendas de relator",
}


def parse_ano(ano):
    zpath = DATA / f"loa{ano}.zip"
    if not zpath.exists():
        print(f"[{ano}] sem {zpath.name} local — pulado (rode coleta_orgaos_todos.py).",
              flush=True)
        return {}
    z = zipfile.ZipFile(zpath)
    nt = [n for n in z.namelist() if n.endswith(".nt")][0]
    rp_of = {}
    vals = {}
    with z.open(nt) as f:
        for raw in f:
            try:
                line = raw.decode("utf-8").strip()
            except UnicodeDecodeError:
                line = raw.decode("latin-1").strip()
            if not line or line.startswith("#"):
                continue
            m = RE_TRIPLE.match(line)
            if not m:
                continue
            subj, pred, obj = m.groups()
            sm = RE_ID.search(subj)
            if not sm:
                continue
            _a, tipo, sid = sm.groups()
            if tipo != "ItemDespesa":
                continue
            if pred == LOA + "temResultadoPrimario":
                m2 = RE_ID.search(obj)
                if m2:
                    rp_of[sid] = m2.group(3)
            elif pred.startswith(LOA + "valor") and pred.split("#")[1] in VAL_IDX:
                nm = RE_NUM.search(obj)
                if nm:
                    v = vals.setdefault(sid, [0.0, 0.0, 0.0, 0.0])
                    v[VAL_IDX[pred.split("#")[1]]] = float(nm.group(1))
    agg = {}
    for iid, (pago, emp, liq, dot) in vals.items():
        rp = rp_of.get(iid)
        if not rp:
            continue
        a = agg.setdefault(rp, [0.0, 0.0, 0.0, 0.0])
        a[0] += pago; a[1] += emp; a[2] += liq; a[3] += dot
    out = {rp: {"ano": ano, "rp": rp, "pago": round(v[0], 2),
               "empenhado": round(v[1], 2), "liquidado": round(v[2], 2),
               "dotacao": round(v[3], 2)} for rp, v in agg.items()}
    em = sum(v["pago"] for k, v in out.items() if k in RP_NOME)
    print(f"[{ano}] RPs={sorted(out)} emendas_pagas=R$ {em/1e9:.1f} bi", flush=True)
    return out


if __name__ == "__main__":
    import pandas as pd
    anos = [int(a) for a in sys.argv[1:]] or ANOS
    atual = {}
    for arq in (DATA / "emendas.csv",):
        if arq.exists():
            for _, r in pd.read_csv(arq).iterrows():
                atual[(int(r["ano"]), str(r["rp"]))] = {
                    "ano": int(r["ano"]), "rp": str(r["rp"]),
                    "pago": float(r["pago"]), "empenhado": float(r["empenhado"]),
                    "liquidado": float(r["liquidado"]), "dotacao": float(r["dotacao"])}
    for ano in anos:
        try:
            for rp, row in parse_ano(ano).items():
                atual[(ano, rp)] = row
        except Exception as e:
            print(f"[{ano}] FALHOU e foi pulado: {e}", flush=True)
    rows = [atual[k] for k in sorted(atual)]
    if not rows:
        print("ERRO: nada para salvar.", flush=True)
        raise SystemExit(1)
    df = pd.DataFrame(rows, columns=["ano", "rp", "pago", "empenhado",
                                     "liquidado", "dotacao"])
    df.to_csv(DATA / "emendas.csv", index=False)
    PUB.mkdir(parents=True, exist_ok=True)
    df.to_json(PUB / "emendas.json", orient="records", force_ascii=False)
    print(f"OK: {len(df)} linhas -> data/emendas.csv + public/data/emendas.json")
