"""Extrai a matriz UF x ano de homicídios (Atlas da Violência 2026, Tab. 2.2).

Fonte: repositório IPEA (DSpace) — baixa o PDF via API pública e lê a
Tabela 2.2 ("Número de homicídios registrados, por UF (2014 a 2024)").
Validação: a soma das UFs em 2024 deve dar 42.590 (total nacional do Atlas).

Uso:  python scripts/coleta_crime_uf.py
Saida: data/manual/manual_crime_uf.csv  (uf,sigla,ano,homicidios; 2016+)
       (coleta_conjuntura.py republica em conj_crime_uf.csv/json)
"""
import re
import sys
import unicodedata
import urllib.request
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
MANUAL = BASE / "data" / "manual"

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ObservatorioDosDados",
      "Accept": "application/json,application/pdf"}

ITEM_UUID = "9ab87dfc-33eb-4ac2-8a54-f4f1543dabbc"
API = "https://repositorio.ipea.gov.br/server/api"

UFS = ["Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará",
       "Distrito Federal", "Espírito Santo", "Goiás", "Maranhão",
       "Mato Grosso", "Mato Grosso do Sul", "Minas Gerais", "Pará",
       "Paraíba", "Paraná", "Pernambuco", "Piauí", "Rio de Janeiro",
       "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia", "Roraima",
       "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"]
SIGLA = {"Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM",
         "Bahia": "BA", "Ceará": "CE", "Distrito Federal": "DF",
         "Espírito Santo": "ES", "Goiás": "GO", "Maranhão": "MA",
         "Mato Grosso": "MT", "Mato Grosso do Sul": "MS",
         "Minas Gerais": "MG", "Pará": "PA", "Paraíba": "PB",
         "Paraná": "PR", "Pernambuco": "PE", "Piauí": "PI",
         "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN",
         "Rio Grande do Sul": "RS", "Rondônia": "RO", "Roraima": "RR",
         "Santa Catarina": "SC", "São Paulo": "SP", "Sergipe": "SE",
         "Tocantins": "TO"}


def get_json(url: str):
    req = urllib.request.Request(url, headers=UA)
    import json
    return json.loads(urllib.request.urlopen(req, timeout=60).read().decode("utf-8"))


def fold(s: str) -> str:
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()


if __name__ == "__main__":
    from pypdf import PdfReader
    import io

    bundles = get_json(f"{API}/core/items/{ITEM_UUID}/bundles")
    pdf_url = None
    for b in bundles.get("_embedded", {}).get("bundles", []):
        if b.get("name") == "ORIGINAL":
            bs = get_json(b["_links"]["self"]["href"] + "/bitstreams")
            for x in bs.get("_embedded", {}).get("bitstreams", []):
                if (x.get("name") or "").lower().endswith(".pdf") and "versao" not in (x.get("name") or "").lower():
                    pdf_url = x["_links"]["content"]["href"]
    if not pdf_url:
        print("ERRO: PDF do Atlas 2026 não encontrado no repositório.")
        raise SystemExit(1)
    req = urllib.request.Request(pdf_url, headers=UA)
    raw = urllib.request.urlopen(req, timeout=300).read()
    print(f"[atlas2026] PDF {len(raw)/1e6:.1f} MB")
    r = PdfReader(io.BytesIO(raw))
    rows: dict[str, list[int]] = {}
    for i in range(len(r.pages)):
        t = fold(r.pages[i].extract_text() or "")
        for line in t.split("\n"):
            s = line.strip()
            for uf in UFS:
                if uf in rows:
                    continue
                fu = fold(uf)
                if re.match(r"^" + re.escape(fu) + r"\s+\d", s):
                    toks = re.findall(r"\d[\d\.]*", s)
                    nums = [int(x.replace(".", "")) for x in toks[:11]]
                    if len(nums) == 11 and nums[0] > 50:
                        rows[uf] = nums
    faltam = [u for u in UFS if u not in rows]
    if faltam:
        print(f"ERRO: UFs sem linha na tabela: {faltam}")
        raise SystemExit(1)
    anos = list(range(2014, 2025))
    soma24 = sum(rows[uf][10] for uf in UFS)
    print(f"[atlas2026] 27 UFs x 2014-2024; soma BR 2024 = {soma24} (Atlas: 42590)")
    if soma24 != 42590:
        print("ERRO: soma não confere com o total nacional — abortando.")
        raise SystemExit(1)
    linhas = ["uf,sigla,ano,homicidios"]
    for uf in UFS:
        for a, v in zip(anos, rows[uf]):
            if a >= 2016:
                linhas.append(f"{uf},{SIGLA[uf]},{a},{v}")
    MANUAL.mkdir(exist_ok=True)
    (MANUAL / "manual_crime_uf.csv").write_text("\n".join(linhas) + "\n", encoding="utf-8")
    print(f"OK: {MANUAL / 'manual_crime_uf.csv'} com {len(linhas)-1} linhas.")
