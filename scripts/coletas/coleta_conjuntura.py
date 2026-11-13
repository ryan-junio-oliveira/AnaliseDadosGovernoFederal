"""Coleta indicadores de conjuntura financeiros: inflacao, dolar, juros,
atividade, bolsa, dividas do setor publico e resultado fiscal.

Fontes automaticas (sem token):
- BCB SGS: IPCA mensal (433), dolar venda (1), Selic meta (432),
  IBC-Br dessaz. (24364), DBGG % PIB (13762), DLSP % PIB (4513),
  NFSP abaixo da linha (4649 primario / 4616 juros / 4583 nominal),
  DBGG/DLSP em R$ milhoes (13761 / 4478)
- Ibovespa: fechamento mensal ajustado via Yahoo (SGS 7 descontinuada)

Uso:  python scripts/coletas/coleta_conjuntura.py   (integra o atualizar.py)
Saida: data/conj_*.csv  +  public/data/conj_*.json (lidos pelo front)
"""
from __future__ import annotations
import json
import sys
import urllib.request
from pathlib import Path

BASE = Path(__file__).resolve().parents[2]
DATA = BASE / "data"
PUB = BASE / "public" / "data"

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from janela import ANO_INI

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ObservatorioDosDados",
      "Accept": "application/json"}


def get_json(url: str, timeout: int = 60):
    req = urllib.request.Request(url, headers=UA)
    return json.loads(urllib.request.urlopen(req, timeout=timeout).read().decode("utf-8"))


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
    print("=== 1/2 BCB (IPCA, dolar, Selic, IBC-Br, dividas, resultado fiscal) ===")
    bcb = coleta_bcb()
    if bcb.get("ipca_m"):
        m_ipca = mensaliza(bcb["ipca_m"], "ultimo")
        a12 = ipca_12m(m_ipca)
        m_dolar = mensaliza(bcb.get("dolar", []), "ultimo")
        m_selic = mensaliza(bcb.get("selic", []), "ultimo")
        m_ibc = mensaliza(bcb.get("ibc", []), "ultimo")
        print("=== 1b/2 Ibovespa (Yahoo) ===")
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
               for k in meses], corte=f"{ANO_INI}-01"),
               "conj_mensal.csv", "conj_mensal.json")
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

    print("=== 2/2 resumo ===")
    print("Conjuntura atualizada. O front exibe so series existentes.")
