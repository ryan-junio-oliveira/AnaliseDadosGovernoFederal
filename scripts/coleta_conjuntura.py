"""Coleta indicadores de conjuntura: inflacao, dolar, juros, atividade,
divida, desemprego, empresas (RJ/falencias) e criminalidade.

Fontes automaticas (sem token):
- BCB SGS: IPCA mensal (433), dolar venda (1), Selic meta (432),
  IBC-Br dessaz. (24364), DBGG % PIB (13762), DLSP % PIB (4513)
- Serasa Experian: falencias e RJs (XLSX com URL descoberta na pagina
  de indicadores; metodologia mudou em 2025 — ver Metodologia no front)
- IBGE SIDRA tab. 4095 (PNADc trimestral, taxa de desocupacao):
  tentativa com fallback — se a API recusar (ex. 403), mantem o CSV
  anterior e avisa. Nao quebra a coleta das demais fontes.

Fontes manuais (data/manual/*.csv — 2 min/mes, instrucoes no print):
- manual_empresas.csv: mes,abertas,fechadas (Mapa de Empresas, gov.br)
- manual_crime.csv: ano,homicidios (Atlas da Violencia IPEA/FBSP)

Uso:  python scripts/coleta_conjuntura.py   (integra o atualizar.py)
Saida: data/conj_*.csv  +  public/data/conj_*.json (lidos pelo front)
"""
from __future__ import annotations
import json
import re
import sys
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
DATA = BASE / "data"
PUB = BASE / "public" / "data"
MANUAL = DATA / "manual"
MANUAL.mkdir(exist_ok=True)

sys.path.insert(0, str(Path(__file__).resolve().parent))
from janela import ANO_INI

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ObservatorioDosDados",
      "Accept": "application/json"}
INI_FETCH = "01/01/2014"  # folga p/ IPCA 12m e medias moveis


def get_json(url: str, timeout: int = 60):
    req = urllib.request.Request(url, headers=UA)
    return json.loads(urllib.request.urlopen(req, timeout=timeout).read().decode("utf-8"))


def get_text(url: str, timeout: int = 60) -> str:
    req = urllib.request.Request(url, headers=UA)
    return urllib.request.urlopen(req, timeout=timeout).read().decode("utf-8", "replace")


# ---------------- BCB SGS ----------------
SGS = {"dolar": 1, "selic": 432, "ipca_m": 433, "ibc": 24364, "dbgg": 13762, "dlsp": 4513}


def coleta_bcb() -> dict:
    """Retorna {serie: [(date, valor)]} com valores float."""
    from datetime import date, datetime
    out: dict[str, list] = {}
    anos = list(range(2014, date.today().year + 1))
    for nome, cod in SGS.items():
        pts = []
        try:
            # por ano: series diarias rejeitam intervalo aberto (406)
            for a in anos:
                url = (f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{cod}/dados"
                       f"?formato=json&dataInicial=01/01/{a}&dataFinal=31/12/{a}")
                try:
                    raw = get_json(url)
                except Exception as e:
                    print(f"[bcb:{nome}:{a}] aviso: {e}")
                    continue
                for r in raw:
                    try:
                        d = datetime.strptime(r["data"], "%d/%m/%Y").date()
                        pts.append((d, float(str(r["valor"]).replace(",", "."))))
                    except (ValueError, KeyError):
                        continue
        except Exception as e:
            print(f"[bcb:{nome}] aviso: {e}")
            continue
        out[nome] = sorted(pts)
        print(f"[bcb:{nome}] {len(pts)} pontos")
    return out


def mensaliza(pts: list, como: str):
    """Agrega pontos (diarios/eventuais) por mes: ultimo | media."""
    from collections import defaultdict
    balde: dict[str, list] = defaultdict(list)
    for d, v in pts:
        balde[f"{d.year}-{d.month:02d}"].append(v)
    out = {}
    for k in sorted(balde):
        vals = balde[k]
        out[k] = vals[-1] if como == "ultimo" else sum(vals) / len(vals)
    return out


def ipca_12m(mensal: dict) -> dict:
    chaves = sorted(mensal)
    out = {}
    for i, k in enumerate(chaves):
        if i < 11:
            continue
        f = 1.0
        for j in range(i - 11, i + 1):
            f *= 1 + mensal[chaves[j]] / 100
        out[k] = round((f - 1) * 100, 2)
    return out


# ---------------- SIDRA desemprego (tentativa com fallback) ----------------
def coleta_desemprego() -> list:
    """PNADc trimestral BR (tab. 4095). Retorna [{mes, desemprego}] ou []."""
    try:
        url = ("https://apisidra.ibge.gov.br/valores/t/4095/n1/all/v/allxp"
               "/p/201601-202612/c11255/0")
        raw = get_json(url)
    except Exception as e:
        print(f"[sidra:4095] API indisponivel ({e}). Mantendo CSV anterior.")
        return []
    # descobre variavel da taxa de desocupacao e coluna do trimestre
    linhas = []
    for r in raw:
        vals = {k: str(v) for k, v in r.items()}
        blob = " ".join(vals.values()).lower()
        if "desocup" not in [vals.get("V", ""), vals.get("VN", "")]:
            nome_var = (vals.get("V", "") + " " + vals.get("VN", "")).lower()
            if "desocup" not in nome_var:
                continue
        tri = next((v for v in vals.values() if "trimestre" in v.lower()), "")
        m = re.search(r"(\d)[oº]?\s*trimestre\s*(\d{4})", tri)
        if not m:
            continue
        q, ano = int(m.group(1)), int(m.group(2))
        fim = {1: "-03-31", 2: "-06-30", 3: "-09-30", 4: "-12-31"}[q]
        try:
            valor = float(vals.get("V", "").replace(",", ".")) if re.match(r"^[\d,.\-]+$", vals.get("V", "")) else None
        except ValueError:
            valor = None
        if valor is None:
            for v in vals.values():
                if re.match(r"^\d{1,2},\d$", v.strip()):
                    valor = float(v.replace(",", "."))
                    break
        terr = (vals.get("D1N", "") + vals.get("D1C", "")).lower()
        if valor is not None and ("brasil" in terr or vals.get("NC", "") == "1"):
            linhas.append({"mes": f"{ano}{fim}", "tri": f"{ano}-T{q}", "desemprego": valor})
    linhas.sort(key=lambda r: r["mes"])
    print(f"[sidra:4095] {len(linhas)} trimestres")
    return linhas


# ---------------- Serasa RJ/falencias ----------------
SERASA_PAGE = "https://www.serasaexperian.com.br/conteudos/indicadores-economicos/"


def descobre_serasa() -> str | None:
    try:
        html = get_text(SERASA_PAGE)
    except Exception as e:
        print(f"[serasa] pagina indisponivel: {e}")
        return None
    m = re.search(r'value="(/content/dam/[^"]*falencias-e-recuperacoes-[a-z0-9]+\.xlsx)"', html)
    if not m:
        print("[serasa] link do XLSX nao encontrado na pagina.")
        return None
    return urllib.parse.urljoin("https://www.serasaexperian.com.br", m.group(1))


def coleta_serasa() -> list:
    """Retorna [{mes, rj_req, fal_req}] ou []."""
    import openpyxl
    url = descobre_serasa()
    if not url:
        return []
    try:
        req = urllib.request.Request(url, headers=UA)
        raw = urllib.request.urlopen(req, timeout=120).read()
    except Exception as e:
        print(f"[serasa] download falhou: {e}")
        return []
    tmp = DATA / "_serasa_tmp.xlsx"
    tmp.write_bytes(raw)
    wb = None
    try:
        wb = openpyxl.load_workbook(tmp, data_only=True, read_only=True)
        ws = wb["Total de Processos"]
        linhas = []
        for row in ws.iter_rows(values_only=True):
            c0 = row[0]
            if hasattr(c0, "year"):
                try:
                    linhas.append({
                        "mes": c0.strftime("%Y-%m-01"),
                        "fal_req": int(row[1] or 0),
                        "rj_req": int(row[3] or 0),
                    })
                except (TypeError, ValueError):
                    continue
    finally:
        try:
            if wb is not None:
                wb.close()
        except Exception:
            pass
        try:
            tmp.unlink(missing_ok=True)
        except PermissionError:
            pass
    linhas.sort(key=lambda r: r["mes"])
    # descarta meses finais zerados (preliminares ainda nao publicados)
    while linhas and (linhas[-1]["rj_req"] + linhas[-1]["fal_req"]) == 0:
        linhas.pop()
    print(f"[serasa] {len(linhas)} meses ({linhas[0]['mes']} -> {linhas[-1]['mes']})" if linhas else "[serasa] vazio")
    return linhas


# ---------------- manuais ----------------
def garante_template(nome: str, cabecalho: str, instrucao: str) -> Path:
    p = MANUAL / nome
    if not p.exists():
        p.write_text(cabecalho + "\n", encoding="utf-8")
        print(f"[manual] criei {p} — {instrucao}")
    return p


def le_manual(nome: str) -> list:
    import pandas as pd
    p = MANUAL / nome
    if not p.exists() or p.stat().st_size < 10:
        return []
    try:
        return pd.read_csv(p).to_dict("records")
    except Exception as e:
        print(f"[manual] {nome} ilegivel: {e}")
        return []


# ---------------- main ----------------
def salva(df_rows: list, csv_nome: str, json_nome: str):
    import pandas as pd
    df = pd.DataFrame(df_rows)
    if len(df):
        df.to_csv(DATA / csv_nome, index=False)
        df.to_json(PUB / json_nome, orient="records", force_ascii=False)
        print(f"OK: {csv_nome} ({len(df)} linhas)")
    else:
        print(f"AVISO: {csv_nome} vazio — mantido anterior (se houver).")


if __name__ == "__main__":
    import pandas as pd

    print("=== 1/5 BCB (IPCA, dolar, Selic, IBC-Br, dividas) ===")
    bcb = coleta_bcb()
    if bcb.get("ipca_m"):
        m_ipca = mensaliza(bcb["ipca_m"], "ultimo")
        a12 = ipca_12m(m_ipca)
        m_dolar = mensaliza(bcb.get("dolar", []), "ultimo")
        m_selic = mensaliza(bcb.get("selic", []), "ultimo")
        m_ibc = mensaliza(bcb.get("ibc", []), "ultimo")
        meses = sorted(set(m_ipca) | set(m_dolar) | set(m_selic) | set(m_ibc))
        meses = [k for k in meses if k >= f"{ANO_INI}-01"]
        salva([{"mes": f"{k}-01",
                "ipca_m": round(m_ipca[k], 2) if k in m_ipca else None,
                "ipca_12m": a12.get(k),
                "dolar": round(m_dolar[k], 4) if k in m_dolar else None,
                "selic": round(m_selic[k], 2) if k in m_selic else None,
                "ibc": round(m_ibc[k], 2) if k in m_ibc else None}
               for k in meses], "conj_mensal.csv", "conj_mensal.json")
    if bcb.get("dbgg") or bcb.get("dlsp"):
        m_g = mensaliza(bcb.get("dbgg", []), "ultimo")
        m_l = mensaliza(bcb.get("dlsp", []), "ultimo")
        meses = sorted(set(m_g) & set(m_l))
        meses = [k for k in meses if k >= f"{ANO_INI}-01"]
        salva([{"mes": f"{k}-01", "dbgg": round(m_g[k], 2), "dlsp": round(m_l[k], 2)}
               for k in meses], "conj_dividas.csv", "conj_dividas.json")

    print("=== 2/5 desemprego PNADc (SIDRA, com fallback) ===")
    des = coleta_desemprego()
    if des:
        salva(des, "conj_desemprego.csv", "conj_desemprego.json")

    print("=== 3/5 empresas: RJ/falencias (Serasa) + abertas/fechadas (manual) ===")
    rj = coleta_serasa()
    if rj:
        import pandas as pd
        pd.DataFrame(rj).to_csv(DATA / "conj_rj.csv", index=False)
    man_emp = le_manual("manual_empresas.csv") if (MANUAL / "manual_empresas.csv").exists() else []
    garante_template("manual_empresas.csv", "mes,abertas,fechadas",
                     "preencha 1x/mes com o Mapa de Empresas (gov.br), ex.: 2026-07-01,485210,312044")
    emp_map = {str(r.get("mes"))[:10]: r for r in man_emp}
    base = rj if rj else []
    if not base and (DATA / "conj_rj.csv").exists():
        import pandas as pd
        base = pd.read_csv(DATA / "conj_rj.csv").to_dict("records")
    if base:
        out = []
        for r in base:
            mes = str(r["mes"])[:10]
            me = emp_map.get(mes, {})
            out.append({"mes": mes, "rj_req": r.get("rj_req"), "fal_req": r.get("fal_req"),
                        "abertas": me.get("abertas"), "fechadas": me.get("fechadas")})
        salva(out, "conj_empresas.csv", "conj_empresas.json")
    else:
        print("AVISO: sem serie de empresas (Serasa fora e sem manual).")

    print("=== 4/5 criminalidade (manual: Atlas da Violencia) ===")
    garante_template("manual_crime.csv", "ano,homicidios",
                     "preencha 1x/ano com o Atlas da Violencia IPEA/FBSP (total BR). Ex.: 2024,42590")
    crime = le_manual("manual_crime.csv")
    if crime:
        salva([{"ano": int(r["ano"]), "homicidios": int(r["homicidios"])} for r in crime],
              "conj_crime.csv", "conj_crime.json")
    else:
        print("AVISO: manual_crime.csv vazio — secao criminalidade fica oculta no front.")

    print("=== 5/5 resumo ===")
    print("Conjuntura atualizada. O front exibe so series existentes.")
