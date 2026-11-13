"""Gera o script DML de carga inicial (dml_carga_inicial.sql) a partir dos
JSONs publicados em public/data/*.json.

O arquivo gerado contem INSERTs literais (DML puro), na ordem correta de
dependencia das chaves estrangeiras, para ser executado pelo carregar.py.

Uso (a partir da raiz do projeto):
    python scripts/banco/gerar_dml.py
"""
from __future__ import annotations

import json
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent.parent
PUB = BASE / "public" / "data"
SAIDA = Path(__file__).resolve().parent / "dml_carga_inicial.sql"

# Sigla -> nome oficial da UF (IBGE)
ESTADOS = {
    "AC": "Acre", "AL": "Alagoas", "AP": "Amapa", "AM": "Amazonas",
    "BA": "Bahia", "CE": "Ceara", "DF": "Distrito Federal", "ES": "Espirito Santo",
    "GO": "Goias", "MA": "Maranhao", "MT": "Mato Grosso", "MS": "Mato Grosso do Sul",
    "MG": "Minas Gerais", "PA": "Para", "PB": "Paraiba", "PE": "Pernambuco",
    "PI": "Piaui", "PR": "Parana", "RJ": "Rio de Janeiro", "RN": "Rio Grande do Norte",
    "RS": "Rio Grande do Sul", "RO": "Rondonia", "RR": "Roraima",
    "SC": "Santa Catarina", "SP": "Sao Paulo", "SE": "Sergipe",
    "TO": "Tocantins",
}


def carrega(nome: str):
    p = PUB / f"{nome}.json"
    if not p.exists():
        return []
    d = json.loads(p.read_text(encoding="utf-8"))
    return d if isinstance(d, list) else []


def esc(s: str) -> str:
    """Escapa string para literal SQL."""
    return "'" + str(s).replace("'", "''") + "'"


def num(v) -> str:
    """Numero -> literal SQL (NULL quando ausente)."""
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "1" if v else "0"
    if isinstance(v, int):
        return str(v)
    return repr(float(v))


def dia1(mes: str) -> str:
    """Normaliza qualquer data 'AAAA-MM-DD' para o 1o dia do mes ('AAAA-MM-01')."""
    return f"{mes[:7]}-01"


def emite(f, tabela: str, cols: list[str], linhas: list[tuple], lote: int = 200):
    """Escreve INSERTs agrupados (VALUES multiplas linhas)."""
    if not linhas:
        return
    cab = f"INSERT INTO {tabela} ({', '.join(cols)}) VALUES"
    for i in range(0, len(linhas), lote):
        bloco = linhas[i:i + lote]
        vals = ",\n".join(
            "  (" + ", ".join(str(x) for x in linha) + ")" for linha in bloco
        )
        f.write(f"{cab}\n{vals};\n")


def main() -> None:
    mensal = carrega("mensal")
    anual = carrega("anual")
    receitas = carrega("receitas")
    despesas = carrega("despesas")
    poderes = carrega("poderes")
    orgaos = carrega("orgaos_todos")
    emendas = carrega("emendas")
    conj_mensal = carrega("conj_mensal")
    conj_dividas = carrega("conj_dividas")
    conj_fiscal = carrega("conj_fiscal")

    # ---- dimensoes derivadas ----
    poder_nomes = sorted({r["poder"] for r in orgaos})
    tipo_nomes = sorted({r["tipo"] for r in receitas})
    funcao_nomes = sorted({r["funcao"] for r in despesas})

    # periodo: uniao de todos os meses (apos normalizacao p/ dia 1)
    meses: set[str] = set()
    for r in mensal:
        meses.add(dia1(r["mes"]))
    for r in receitas + despesas + poderes + conj_mensal + conj_dividas + conj_fiscal:
        meses.add(dia1(r["mes"]))
    for slug_dir in sorted((PUB / "uf").glob("*")):
        p = slug_dir / "mensal.json"
        if p.exists():
            for r in json.loads(p.read_text(encoding="utf-8")):
                meses.add(dia1(r["mes"]))
    periodo = sorted(meses)

    # orgaos: nome mais recente por codigo (houve mudanca de grafia ao longo dos anos)
    orgao_map: dict[int, tuple[int, str, str]] = {}
    for r in orgaos:
        cod = int(r["cod_orgao"])
        if cod not in orgao_map or int(r["ano"]) >= orgao_map[cod][0]:
            orgao_map[cod] = (int(r["ano"]), r["orgao"], r["poder"])

    with SAIDA.open("w", encoding="utf-8", newline="\n") as f:
        f.write(
            "-- =============================================================================\n"
            "-- Observatorio dos Dados — Módulo 1: DML de carga inicial (INSERTs)\n"
            f"-- Gerado por scripts/banco/gerar_dml.py a partir de public/data/*.json\n"
            f"-- Periodo coberto: {periodo[0]} a {periodo[-1]}  |  "
            f"{len(periodo)} meses, {len(orgao_map)} orgaos, {len(ESTADOS)} UFs\n"
            "-- Ordem respeita as chaves estrangeiras definidas em ddl.sql\n"
            "-- =============================================================================\n\n"
            "BEGIN TRANSACTION;\n\n"
        )

        # ---------- dimensões ----------
        emite(f, "poder", ["cod_poder", "nome"],
              [(i + 1, esc(n)) for i, n in enumerate(poder_nomes)])
        f.write("\n")
        emite(f, "tipo_receita", ["cod_tipo", "nome"],
              [(i + 1, esc(n)) for i, n in enumerate(tipo_nomes)])
        f.write("\n")
        emite(f, "funcao_despesa", ["cod_funcao", "nome"],
              [(i + 1, esc(n)) for i, n in enumerate(funcao_nomes)])
        f.write("\n")

        # estado + metadados do RREO
        linhas_estado = []
        for sigla, nome in sorted(ESTADOS.items()):
            meta_p = PUB / "uf" / sigla.lower() / "meta.json"
            meta = json.loads(meta_p.read_text(encoding="utf-8")) if meta_p.exists() else {}
            linhas_estado.append((
                esc(sigla), esc(nome), esc(meta.get("status", "em-coleta")),
                esc(meta.get("fonte", "SICONFI/RREO")),
                esc(meta.get("periodicidade")) if meta.get("periodicidade") else "NULL",
                esc(meta.get("resultado")) if meta.get("resultado") else "NULL",
                num(meta.get("populacao_ref")),
            ))
        emite(f, "estado",
              ["sigla", "nome", "status", "fonte", "periodicidade",
               "resultado_conceito", "populacao_ref"], linhas_estado)
        f.write("\n")

        emite(f, "periodo", ["mes", "ano"],
              [(esc(m), int(m[:4])) for m in periodo])
        f.write("\n")

        cod_poder = {n: i + 1 for i, n in enumerate(poder_nomes)}
        emite(f, "orgao", ["cod_orgao", "nome", "cod_poder"],
              [(cod, esc(nome), cod_poder[pod])
               for cod, (_, nome, pod) in sorted(orgao_map.items())])
        f.write("\n")

        # ---------- fatos federais ----------
        emite(f, "execucao_orgao",
              ["ano", "cod_orgao", "dotacao", "empenhado", "liquidado", "pago"],
              [(int(r["ano"]), int(r["cod_orgao"]), num(r.get("dotacao")),
                num(r.get("empenhado")), num(r.get("liquidado")), num(r.get("pago")))
               for r in orgaos])
        f.write("\n")

        emite(f, "receita_mensal",
              ["mes", "receita_total", "receita_liquida", "despesa", "resultado_primario"],
              [(esc(dia1(r["mes"])), num(r["receita_total"]), num(r["receita"]),
                num(r["despesa"]), num(r["resultado_primario"])) for r in mensal])
        f.write("\n")

        emite(f, "receita_anual",
              ["ano", "receita_total", "receita_liquida", "despesa", "resultado_primario"],
              [(int(r["ano"]), num(r["receita_total"]), num(r["receita"]),
                num(r["despesa"]), num(r["resultado_primario"])) for r in anual])
        f.write("\n")

        cod_tipo = {n: i + 1 for i, n in enumerate(tipo_nomes)}
        emite(f, "receita_tipo", ["mes", "cod_tipo", "valor"],
              [(esc(dia1(r["mes"])), cod_tipo[r["tipo"]], num(r["valor"]))
               for r in receitas])
        f.write("\n")

        cod_funcao = {n: i + 1 for i, n in enumerate(funcao_nomes)}
        emite(f, "despesa_funcao", ["mes", "cod_funcao", "valor"],
              [(esc(dia1(r["mes"])), cod_funcao[r["funcao"]], num(r["valor"]))
               for r in despesas])
        f.write("\n")

        emite(f, "poder_mensal",
              ["mes", "custeio_capital", "despesa_total", "participacao"],
              [(esc(dia1(r["mes"])), num(r["legjud_mpudpu_custeio_capital"]),
                num(r["despesa_total"]), num(r["participacao"])) for r in poderes])
        f.write("\n")

        # ---------- conjuntura ----------
        emite(f, "conjuntura_mensal",
              ["mes", "ipca_m", "ipca_12m", "dolar", "selic", "ibc", "ibov"],
              [(esc(dia1(r["mes"])), num(r.get("ipca_m")), num(r.get("ipca_12m")),
                num(r.get("dolar")), num(r.get("selic")), num(r.get("ibc")),
                num(r.get("ibov"))) for r in conj_mensal])
        f.write("\n")

        emite(f, "divida_mensal", ["mes", "dbgg", "dlsp", "dbgg_rs", "dlsp_rs"],
              [(esc(dia1(r["mes"])), num(r.get("dbgg")), num(r.get("dlsp")),
                num(r.get("dbgg_rs")), num(r.get("dlsp_rs"))) for r in conj_dividas])
        f.write("\n")

        emite(f, "resultado_fiscal_mensal", ["mes", "primario", "juros", "nominal"],
              [(esc(dia1(r["mes"])), num(r.get("primario")), num(r.get("juros")),
                num(r.get("nominal"))) for r in conj_fiscal])
        f.write("\n")

        emite(f, "emendas",
              ["ano", "rp", "dotacao", "empenhado", "liquidado", "pago"],
              [(int(r["ano"]), esc(str(r["rp"])), num(r.get("dotacao")),
                num(r.get("empenhado")), num(r.get("liquidado")), num(r.get("pago")))
               for r in emendas])
        f.write("\n")

        # ---------- estados (SICONFI RREO) ----------
        n_uf = 0
        for slug_dir in sorted((PUB / "uf").glob("*")):
            sigla = slug_dir.name.upper()

            p = slug_dir / "mensal.json"
            if p.exists():
                rows = json.loads(p.read_text(encoding="utf-8"))
                emite(f, "uf_mensal",
                      ["sigla", "mes", "bimestre", "receita", "receita_total",
                       "despesa", "resultado_primario"],
                      [(esc(sigla), esc(dia1(r["mes"])), int(r["bimestre"]),
                        num(r["receita"]), num(r.get("receita_total")),
                        num(r["despesa"]), num(r["resultado_primario"]))
                       for r in rows])
                n_uf += len(rows)

            p = slug_dir / "receitas.json"
            if p.exists():
                rows = json.loads(p.read_text(encoding="utf-8"))
                emite(f, "uf_receita", ["sigla", "mes", "tipo", "valor"],
                      [(esc(sigla), esc(dia1(r["mes"])), esc(r["tipo"]),
                        num(r["valor"])) for r in rows])
                n_uf += len(rows)

            p = slug_dir / "despesas.json"
            if p.exists():
                rows = json.loads(p.read_text(encoding="utf-8"))
                emite(f, "uf_despesa", ["sigla", "mes", "funcao", "valor"],
                      [(esc(sigla), esc(dia1(r["mes"])), esc(r["funcao"]),
                        num(r["valor"])) for r in rows])
                n_uf += len(rows)

            p = slug_dir / "anual.json"
            if p.exists():
                rows = json.loads(p.read_text(encoding="utf-8"))
                emite(f, "uf_anual",
                      ["sigla", "ano", "receita", "receita_total", "despesa",
                       "resultado_primario"],
                      [(esc(sigla), int(r["ano"]), num(r.get("receita")),
                        num(r.get("receita_total")), num(r.get("despesa")),
                        num(r.get("resultado_primario"))) for r in rows])
                n_uf += len(rows)

        f.write("\nCOMMIT;\n")

    print(f"DML gerado: {SAIDA.relative_to(BASE)}")
    print(f"  periodo: {len(periodo)} meses ({periodo[0]}..{periodo[-1]})")
    print(f"  poderes: {len(poder_nomes)} | tipos receita: {len(tipo_nomes)} | "
          f"funcoes: {len(funcao_nomes)} | orgaos: {len(orgao_map)}")
    print(f"  linhas federais: {len(mensal) + len(anual) + len(receitas) + len(despesas) + len(poderes) + len(orgaos)}")
    print(f"  linhas UF: {n_uf}")


if __name__ == "__main__":
    main()
