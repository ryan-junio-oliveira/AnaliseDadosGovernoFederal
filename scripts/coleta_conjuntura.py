"""Coleta indicadores de conjuntura: inflacao, dolar, juros, atividade,
divida, desemprego, empresas (RJ/falencias) e criminalidade.

Fontes automaticas (sem token):
- BCB SGS: IPCA mensal (433), dolar venda (1), Selic meta (432),
  IBC-Br dessaz. (24364), DBGG % PIB (13762), DLSP % PIB (4513)
- Serasa Experian: falencias e RJs (XLSX com URL descoberta na pagina
  de indicadores; metodologia mudou em 2025 — ver Metodologia no front)
- IBGE SIDRA tab. 4099 (PNADc trimestral, taxa de desocupacao):
  via endpoint /values/ (o caminho /valores/ retorna 403 para bots);
  se a API recusar, mantem o CSV anterior e avisa. Nao quebra a coleta
  das demais fontes.

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
from janela import ANO_FIM, ANO_INI

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
SGS = {"dolar": 1, "selic": 432, "ipca_m": 433, "ibc": 24364, "dbgg": 13762, "dlsp": 4513,
       "nfsp_prim": 4649, "nfsp_juros": 4616, "nfsp_nom": 4583,
       "dbgg_rs": 13761, "dlsp_rs": 4478}


def coleta_bcb() -> dict:
    """Retorna {serie: [(date, valor)]} com valores float (retry por ano)."""
    from datetime import date, datetime
    import time
    out: dict[str, list] = {}
    anos = list(range(2014, date.today().year + 1))
    for nome, cod in SGS.items():
        pts = []
        try:
            # por ano: series diarias rejeitam intervalo aberto (406)
            for a in anos:
                url = (f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{cod}/dados"
                       f"?formato=json&dataInicial=01/01/{a}&dataFinal=31/12/{a}")
                raw = None
                for t in range(3):
                    try:
                        raw = get_json(url)
                        break
                    except Exception as e:
                        if t == 2:
                            print(f"[bcb:{nome}:{a}] aviso apos retry: {e}")
                        else:
                            time.sleep(5 * (t + 1))
                if raw is None:
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


def mescla_existente(csv_nome: str, novos: list, chave: str = "mes",
                     corte: str | None = None) -> list:
    """Une com o CSV da coleta anterior, preferindo valores novos não-nulos.

    Evita que uma janela de instabilidade do BCB (502) encolha a série
    publicada — o padrão é somar cobertura, nunca substituir no escuro.
    `corte` remove chaves anteriores à janela rolante (ex.: "2016-01").
    """
    p = DATA / csv_nome
    if not p.exists():
        return novos
    try:
        import pandas as pd
        velhos = pd.read_csv(p).to_dict("records")
    except Exception:
        return novos
    por = {str(r[chave]): dict(r) for r in velhos}
    for r in novos:
        k = str(r[chave])
        if k in por:
            base = por[k]
            for c, v in r.items():
                if v is not None and v == v:  # NaN != NaN
                    base[c] = v
            por[k] = base
        else:
            por[k] = dict(r)
    if corte:
        por = {k: v for k, v in por.items() if k >= corte}
    return [por[k] for k in sorted(por)]


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


# ---------------- Ibovespa (Yahoo, SGS 7 descontinuada) ----------------
def coleta_ibov(desde: str = "2014-01") -> dict:
    """Fechamento mensal ajustado do ^BVSP. Retorna {YYYY-MM: pontos}."""
    from datetime import datetime, timezone
    try:
        raw = get_json("https://query1.finance.yahoo.com/v8/finance/chart/%5EBVSP?interval=1mo&range=max")
        res = (raw.get("chart", {}) or {}).get("result", [{}])[0]
        ts = res.get("timestamp", [])
        adj = ((res.get("indicators", {}) or {}).get("adjclose", [{}])[0] or {}).get("adjclose", [])
        out = {}
        for t, v in zip(ts, adj):
            if v is None:
                continue
            d = datetime.fromtimestamp(t, tz=timezone.utc).date()
            k = f"{d.year}-{d.month:02d}"
            if k >= desde:
                out[k] = round(float(v), 0)
        print(f"[yahoo:^BVSP] {len(out)} meses")
        return out
    except Exception as e:
        print(f"[yahoo:^BVSP] aviso: {e}")
        return {}


# ---------------- CVM: IPOs (ofertas iniciais de acoes) ----------------
CVM_ZIP = "https://dados.cvm.gov.br/dados/OFERTA/DISTRIB/DADOS/oferta_distribuicao.zip"


def _fold(s) -> str:
    import unicodedata
    return unicodedata.normalize("NFKD", str(s or "")).encode("ascii", "ignore").decode().upper()


def _num(s) -> float:
    s = (s or "").strip().strip("'").strip()
    if not s:
        return 0.0
    if "," in s:  # formato BR: 1.234,56
        s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return 0.0


def coleta_ipos() -> list:
    """Ofertas iniciais de acoes por ano (qtd de emissores + volume R$).
    Arquivo antigo (ate 2022) + Resolucao 160 (2023+). Dedup por emissor+data
    (uma oferta tem varias linhas de tranche). Anos sem IPO entram zerados."""
    import io
    import zipfile
    from datetime import date
    try:
        req = urllib.request.Request(CVM_ZIP, headers=UA)
        z = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(req, timeout=300).read()))
    except Exception as e:
        print(f"[cvm] download falhou: {e}")
        return []
    emissores: dict[tuple, float] = {}
    try:
        import csv
        # regime antigo
        with z.open("oferta_distribuicao.csv") as f:
            for r in csv.DictReader(io.TextIOWrapper(f, encoding="latin-1"), delimiter=";"):
                try:
                    if "ACOES" not in _fold(r.get("Tipo_Ativo")):
                        continue
                    if not _fold(r.get("Oferta_Inicial")).startswith("S"):
                        continue
                    data_ref = (r.get("Data_Registro_Oferta") or r.get("Data_Encerramento_Oferta") or "")[:10]
                    ano = int(data_ref[:4])
                    if ano < ANO_INI:
                        continue
                    key = ((r.get("CNPJ_Emissor") or r.get("Nome_Emissor") or "?").strip(), data_ref)
                    emissores[key] = emissores.get(key, 0.0) + _num(r.get("Valor_Total"))
                except (ValueError, TypeError):
                    continue
        # Resolucao 160 (2023+)
        with z.open("oferta_resolucao_160.csv") as f:
            for r in csv.DictReader(io.TextIOWrapper(f, encoding="latin-1"), delimiter=";"):
                try:
                    if "ACOES" not in _fold(r.get("Valor_Mobiliario")):
                        continue
                    if not _fold(r.get("Oferta_inicial")).startswith("S"):
                        continue
                    if "ENCERRADA" not in _fold(r.get("Status_Requerimento")):
                        continue
                    data_ref = (r.get("Data_Registro") or "")[:10]
                    ano = int(data_ref[:4])
                    if ano < ANO_INI:
                        continue
                    key = ((r.get("CNPJ_Emissor") or r.get("Nome_Emissor") or "?").strip(), data_ref)
                    emissores[key] = emissores.get(key, 0.0) + _num(r.get("Valor_Total_Registrado"))
                except (ValueError, TypeError):
                    continue
    except Exception as e:
        print(f"[cvm] parse falhou: {e}")
        return []
    agg: dict[int, list] = {}
    for (emissor, data_ref), vol in emissores.items():
        a = agg.setdefault(int(data_ref[:4]), [set(), 0.0])
        a[0].add(emissor)
        a[1] += vol
    fim = date.today().year
    out = [{"ano": a, "ipos": len(agg.get(a, [set()])[0]),
            "volume": round(agg.get(a, [set(), 0.0])[1], 2)}
           for a in range(ANO_INI, fim + 1)]
    print(f"[cvm] {sum(r['ipos'] for r in out)} IPOs em {len(out)} anos")
    return out


# ---------------- SIDRA desemprego (tab. 4099, endpoint /values/) ----------------
def coleta_desemprego() -> list:
    """PNADc trimestral BR (tab. 4099). Retorna [{mes, tri, desemprego}] ou []."""
    try:
        # /values/ (EN) responde; /valores/ (PT) devolve 403 para bots.
        # Trimestres no formato AAAATT (T=01..04); pede ate o fim do ano
        # corrente — a API devolve so os trimestres publicados.
        url = ("https://apisidra.ibge.gov.br/values/t/4099/n1/all/v/4099"
               f"/p/{ANO_INI}01-{ANO_FIM}04")
        raw = get_json(url)
    except Exception as e:
        print(f"[sidra:4099] API indisponivel ({e}). Mantendo CSV anterior.")
        return []
    linhas = []
    for r in raw[1:]:  # [0] = cabecalho
        vals = {k: str(v) for k, v in r.items()}
        tri_txt = vals.get("D3N", "")
        m = re.search(r"(\d)\s*[oº]?\s*trimestre\s*(\d{4})", tri_txt)
        if not m:
            continue
        q, ano = int(m.group(1)), int(m.group(2))
        if ano < ANO_INI:
            continue
        fim = {1: "-03-31", 2: "-06-30", 3: "-09-30", 4: "-12-31"}[q]
        try:
            valor = float(str(vals.get("V", "")).replace(",", "."))
        except ValueError:
            continue
        if vals.get("D1N", "").lower() == "brasil":
            linhas.append({"mes": f"{ano}{fim}", "tri": f"{ano}-T{q}", "desemprego": valor})
    linhas.sort(key=lambda r: r["mes"])
    print(f"[sidra:4099] {len(linhas)} trimestres")
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
        print("=== 1b/5 Ibovespa (Yahoo) ===")
        m_ibov = coleta_ibov()
        meses = sorted(set(m_ipca) | set(m_dolar) | set(m_selic) | set(m_ibc) | set(m_ibov))
        meses = [k for k in meses if k >= f"{ANO_INI}-01"]
        salva(mescla_existente("conj_mensal.csv", [{"mes": f"{k}-01",
                "ipca_m": round(m_ipca[k], 2) if k in m_ipca else None,
                "ipca_12m": a12.get(k),
                "dolar": round(m_dolar[k], 4) if k in m_dolar else None,
                "selic": round(m_selic[k], 2) if k in m_selic else None,
                "ibc": round(m_ibc[k], 2) if k in m_ibc else None,
                "ibov": m_ibov.get(k)}
               for k in meses]), "conj_mensal.csv", "conj_mensal.json", corte=f"{ANO_INI}-01")
    if bcb.get("dbgg") or bcb.get("dlsp"):
        m_g = mensaliza(bcb.get("dbgg", []), "ultimo")
        m_l = mensaliza(bcb.get("dlsp", []), "ultimo")
        m_grs = mensaliza(bcb.get("dbgg_rs", []), "ultimo")
        m_lrs = mensaliza(bcb.get("dlsp_rs", []), "ultimo")
        meses = sorted(set(m_g) & set(m_l))
        meses = [k for k in meses if k >= f"{ANO_INI}-01"]
        salva(mescla_existente("conj_dividas.csv", [{"mes": f"{k}-01", "dbgg": round(m_g[k], 2), "dlsp": round(m_l[k], 2),
                "dbgg_rs": round(m_grs[k] * 1e6, 2) if k in m_grs else None,
                "dlsp_rs": round(m_lrs[k] * 1e6, 2) if k in m_lrs else None}
               for k in meses], corte=f"{ANO_INI}-01"), "conj_dividas.csv", "conj_dividas.json")
    if bcb.get("nfsp_prim") or bcb.get("nfsp_juros") or bcb.get("nfsp_nom"):
        # NFSP "abaixo da linha" (BCB): setor publico consolidado, fluxo mensal
        # em R$ milhoes, convenção +deficit. Invertemos o sinal para o padrao
        # do painel (+superavit), em R$.
        m_p = mensaliza(bcb.get("nfsp_prim", []), "ultimo")
        m_j = mensaliza(bcb.get("nfsp_juros", []), "ultimo")
        m_n = mensaliza(bcb.get("nfsp_nom", []), "ultimo")
        meses = sorted(set(m_p) | set(m_j) | set(m_n))
        meses = [k for k in meses if k >= f"{ANO_INI}-01"]
        salva(mescla_existente("conj_fiscal.csv", [{"mes": f"{k}-01",
                "primario": round(-m_p[k] * 1e6, 2) if k in m_p else None,
                "juros": round(-m_j[k] * 1e6, 2) if k in m_j else None,
                "nominal": round(-m_n[k] * 1e6, 2) if k in m_n else None}
               for k in meses], corte=f"{ANO_INI}-01"), "conj_fiscal.csv", "conj_fiscal.json")

    print("=== 2/5 desemprego PNADc (SIDRA, com fallback) ===")
    des = coleta_desemprego()
    if not des:
        # fallback manual: trimestres fixos da PNADc (SIDRA tab. 4099), ex.: 2026-T2,5.4
        pdes = MANUAL / "manual_desemprego.csv"
        if not pdes.exists():
            # âncora verificada (IBGE release 2º tri/2026); complete com os demais tris
            pdes.write_text("tri,desemprego\n2026-T2,5.4\n", encoding="utf-8")
            print(f"[manual] criei {pdes} com 2026-T2 (IBGE) — complete os demais trimestres.")
        man = le_manual("manual_desemprego.csv")
        conv = {"T1": "-03-31", "T2": "-06-30", "T3": "-09-30", "T4": "-12-31"}
        for r in man:
            m = re.match(r"(\d{4})-T([1-4])", str(r.get("tri", "")).strip())
            try:
                v = float(str(r.get("desemprego", "")).replace(",", "."))
            except (ValueError, TypeError):
                continue
            if m:
                des.append({"mes": f"{m.group(1)}{conv['T' + m.group(2)]}", "tri": m.group(0), "desemprego": v})
        des.sort(key=lambda r: r["mes"])
        if des:
            print(f"[manual] desemprego: {len(des)} trimestres ({des[0]['tri']} -> {des[-1]['tri']})")
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
        # meses do Mapa de Empresas alem do Serasa (RJ/fal nulos): entram so
        # com abertas/fechadas para o grafico nao ficar cego no periodo novo
        vistos = {str(r["mes"])[:10] for r in out}
        for mes10 in sorted(emp_map):
            if mes10 not in vistos:
                me = emp_map[mes10]
                out.append({"mes": mes10, "rj_req": None, "fal_req": None,
                            "abertas": me.get("abertas"), "fechadas": me.get("fechadas")})
        out.sort(key=lambda r: str(r["mes"]))
        salva(out, "conj_empresas.csv", "conj_empresas.json")
        # anual: soma dos meses + âncoras pré-2024 (releases Serasa verificados)
        pave = MANUAL / "manual_empresas_anual.csv"
        if not pave.exists():
            pave.write_text("ano,rj_ano,fal_ano\n2022,833,866\n2023,1405,983\n", encoding="utf-8")
            print("[manual] criei manual_empresas_anual.csv com 2022-2023 (releases Serasa).")
        import pandas as pd
        anc = pd.read_csv(pave).to_dict("records") if pave.stat().st_size > 10 else []
        por_ano: dict[int, list] = {}
        for r in out:
            a = int(str(r["mes"])[:4])
            p = por_ano.setdefault(a, [0, 0])
            p[0] += r.get("rj_req") or 0
            p[1] += r.get("fal_req") or 0
        anos_cobertos = set(por_ano)
        for r in anc:
            try:
                a = int(r["ano"])
                if a not in anos_cobertos:
                    por_ano[a] = [int(r["rj_ano"]), int(r["fal_ano"])]
            except (ValueError, TypeError):
                continue
        salva([{"ano": a, "rj_ano": q, "fal_ano": f} for a, (q, f) in sorted(por_ano.items())],
              "conj_empresas_anual.csv", "conj_empresas_anual.json")
    else:
        print("AVISO: sem serie de empresas (Serasa fora e sem manual).")

    print("=== 4/5 IPOs na bolsa (CVM) ===")
    ipos = coleta_ipos()
    if ipos:
        salva(ipos, "conj_ipos.csv", "conj_ipos.json")

    print("=== 5/5 criminalidade (manual: Atlas da Violencia) ===")
    pcrime = MANUAL / "manual_crime.csv"
    # Homicidios registrados (SIM/MS) por edicao do Atlas da Violencia:
    # 2016-2018: Atlas 2018/2019/2020; 2019: Atlas 2021; 2020-2021: Atlas 2023;
    # 2022: Atlas 2024; 2023: Atlas 2025; 2024: Atlas 2026. Complete os novos
    # anos a cada edicao do Atlas (SIM tem ~2 anos de defasagem).
    seed = {"2016": 62517, "2017": 65602, "2018": 57956, "2019": 45503,
            "2020": 49868, "2021": 47847, "2022": 46409,
            "2023": 45747, "2024": 42590}
    atual = {}
    if pcrime.exists():
        for r in le_manual("manual_crime.csv"):
            try:
                atual[str(int(r["ano"]))] = int(r["homicidios"])
            except (ValueError, TypeError):
                continue
    faltam = {a: v for a, v in seed.items() if a not in atual}
    if faltam or not pcrime.exists():
        atual.update(faltam)
        pcrime.write_text("ano,homicidios\n" + "".join(f"{a},{atual[a]}\n" for a in sorted(atual)), encoding="utf-8")
        print(f"[manual] {pcrime} com 2016-2024 (Atlas/IPEA) — complete os novos anos a cada edição.")
    crime = le_manual("manual_crime.csv")
    if crime:
        salva([{"ano": int(r["ano"]), "homicidios": int(r["homicidios"])} for r in crime],
              "conj_crime.csv", "conj_crime.json")
    else:
        print("AVISO: manual_crime.csv vazio — secao criminalidade fica oculta no front.")
    # UFs: matriz extraída do Atlas 2026 Tab. 2.2 (ver scripts/coleta_crime_uf.py
    # --documenta a extração; aqui só republicamos o manual).
    puf = MANUAL / "manual_crime_uf.csv"
    if puf.exists():
        cuf = le_manual("manual_crime_uf.csv")
        rows_uf = []
        for r in cuf:
            try:
                row = {"uf": str(r["uf"]), "sigla": str(r["sigla"]).upper(),
                       "ano": int(r["ano"]), "homicidios": int(r["homicidios"])}
                if r.get("taxa") not in (None, ""):
                    row["taxa"] = float(str(r["taxa"]).replace(",", "."))
                rows_uf.append(row)
            except (ValueError, TypeError, KeyError):
                continue
        if rows_uf:
            salva(rows_uf, "conj_crime_uf.csv", "conj_crime_uf.json")
    else:
        print("AVISO: manual_crime_uf.csv ausente — painel por UF oculto.")

    print("=== 6/6 resumo ===")
    print("Conjuntura atualizada. O front exibe so series existentes.")
