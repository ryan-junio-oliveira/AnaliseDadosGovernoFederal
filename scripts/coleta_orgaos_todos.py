"""Coleta execucao orcamentaria por orgao superior — TODOS os Poderes (SIOP RDF).

Fonte: http://www1.siop.planejamento.gov.br/downloads/rdf/loa{ano}.zip (N-Triples).
Agrega por orgao: dotacao inicial (LOA), empenhado, liquidado e pago.
Conceito: execucao ORCAMENTARIA total (inclui juros/amortizacao da divida) —
diferente do RTN (primario). Ver secao Orgaos no frontend.

Uso:  python src/coleta_orgaos_todos.py [2022 2023 2024 2025 2026]
Saida: data/orgaos_todos.csv
"""
import re
import ssl
import sys
import urllib.request
import zipfile
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
DATA = BASE / "data"

ssl._create_default_https_context = ssl._create_unverified_context

LOA = "http://vocab.e.gov.br/2013/09/loa#"
RDFS = "http://www.w3.org/2000/01/rdf-schema#"
RE_TRIPLE = re.compile(r"<([^>]+)> <([^>]+)> (.*) \.$")
RE_ID = re.compile(r"/id/(\d+)/([A-Za-z]+)/([^>/]+)")
RE_NUM = re.compile(r'"([\d.\-]+)"')


def poder_de(cod, nome):
    c = int(cod)
    if 1000 <= c <= 3999:
        return "Legislativo"
    if 10000 <= c <= 17999:
        return "Judiciario"
    if 34000 <= c <= 34999 or 59000 <= c <= 59999:
        return "MPU"
    if "defensoria" in nome.lower():
        return "DPU"
    return "Executivo"


def parse_ano(ano):
    zpath = DATA / f"loa{ano}.zip"
    if not zpath.exists():
        url = f"http://www1.siop.planejamento.gov.br/downloads/rdf/loa{ano}.zip"
        print(f"[{ano}] baixando {url} ...", flush=True)
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        raw = urllib.request.urlopen(req, timeout=600).read()
        zpath.write_bytes(raw)
        print(f"[{ano}] {len(raw)/1e6:.1f} MB", flush=True)
    z = zipfile.ZipFile(zpath)
    nt = [n for n in z.namelist() if n.endswith(".nt")][0]

    org_label, org_cod = {}, {}
    uo_org = {}
    item_uo = {}
    vals = {}  # item -> [pago, empenhado, liquidado, dotacao]

    def oid(uri):
        m = RE_ID.search(uri)
        return m.group(3) if m else None

    with z.open(nt) as f:
        for raw in f:
            # arquivo majoritariamente UTF-8 com bytes invalidos esparsos:
            # tenta UTF-8 estrito por linha, cai para latin-1 se falhar
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
            _ano, tipo, sid = sm.groups()
            if tipo == "Orgao":
                if pred == RDFS + "label":
                    org_label[sid] = obj.strip('"')
                elif pred == LOA + "codigo":
                    org_cod[sid] = obj.strip('"')
            elif tipo == "UnidadeOrcamentaria":
                if pred == LOA + "temOrgao":
                    uo_org[sid] = oid(obj)
            elif tipo == "ItemDespesa":
                if pred == LOA + "temUnidadeOrcamentaria":
                    item_uo[sid] = oid(obj)
                elif pred in (LOA + "valorPago", LOA + "valorEmpenhado",
                              LOA + "valorLiquidado", LOA + "valorDotacaoInicial"):
                    nm = RE_NUM.search(obj)
                    if nm:
                        v = vals.setdefault(sid, [0.0, 0.0, 0.0, 0.0])
                        v[{"valorPago": 0, "valorEmpenhado": 1,
                           "valorLiquidado": 2, "valorDotacaoInicial": 3}[pred.split("#")[1]]] = float(nm.group(1))

    agg = {}
    sem_uo = 0
    for iid, (pago, emp, liq, dot) in vals.items():
        uo = item_uo.get(iid)
        org = uo_org.get(uo) if uo else None
        if not org:
            sem_uo += 1
            continue
        a = agg.setdefault(org, [0.0, 0.0, 0.0, 0.0])
        a[0] += pago; a[1] += emp; a[2] += liq; a[3] += dot

    rows = []
    for org, (pago, emp, liq, dot) in sorted(agg.items(), key=lambda x: int(x[0])):
        nome = org_label.get(org, org)
        cod = org_cod.get(org, org)
        rows.append({"ano": ano, "cod_orgao": cod, "orgao": nome,
                     "poder": poder_de(cod, nome),
                     "pago": round(pago, 2), "empenhado": round(emp, 2),
                     "liquidado": round(liq, 2), "dotacao": round(dot, 2)})
    print(f"[{ano}] orgaos={len(rows)} itens_sem_orgao={sem_uo} "
          f"pago_total=R$ {sum(r['pago'] for r in rows)/1e12:.2f} tri", flush=True)
    return rows


if __name__ == "__main__":
    import pandas as pd
    import traceback
    from janela import ANOS
    anos = [int(a) for a in sys.argv[1:]] or ANOS
    todas = []
    falharam = []
    for ano in anos:
        try:
            todas.extend(parse_ano(ano))
        except Exception as e:
            falharam.append(ano)
            print(f"[{ano}] FALHOU e foi pulado: {e}", flush=True)
            traceback.print_exc()
    if not todas:
        print("ERRO: nenhum ano coletado.", flush=True)
        raise SystemExit(1)
    df = pd.DataFrame(todas)
    df.to_csv(DATA / "orgaos_todos.csv", index=False)
    print("OK:", len(df), "linhas -> data/orgaos_todos.csv")
    if falharam:
        print("Anos pulados (tentar de novo depois):", falharam)
    print(df.groupby("poder")["pago"].sum().sort_values(ascending=False) / 1e9)
