"""Cria e popula o banco relacional do projeto (SQLite).

Executa, nesta ordem:
  1. ddl.sql        — CREATE TABLEs (modelo lógico)
  2. dml_carga_inicial.sql — INSERTs da carga inicial (gerado por gerar_dml.py)

Saida: data/observatorio.db
Uso (a partir da raiz do projeto):
    python scripts/banco/carregar.py
"""
from __future__ import annotations

import sqlite3
import sys
from pathlib import Path

BANCO_DIR = Path(__file__).resolve().parent
BASE = BANCO_DIR.parent.parent
DB = BASE / "data" / "observatorio.db"

TABELAS = [
    "poder", "tipo_receita", "funcao_despesa", "periodo", "estado", "orgao",
    "execucao_orgao", "receita_mensal", "receita_anual", "receita_tipo",
    "despesa_funcao", "poder_mensal", "conjuntura_mensal", "divida_mensal",
    "resultado_fiscal_mensal",
    "emendas", "uf_mensal", "uf_receita", "uf_despesa", "uf_anual",
]

CONSULTAS = [
    ("Receita x despesa x resultado primario por ano",
     "SELECT ano, ROUND(receita_liquida/1e9,1) receita_bi, "
     "ROUND(despesa/1e9,1) despesa_bi, ROUND(resultado_primario/1e9,1) primario_bi "
     "FROM receita_anual ORDER BY ano;"),
    ("Top 10 orgaos por pago (janela completa)",
     "SELECT o.nome, ROUND(SUM(e.pago)/1e9,1) pago_bi "
     "FROM execucao_orgao e JOIN orgao o USING (cod_orgao) "
     "GROUP BY o.nome ORDER BY pago_bi DESC LIMIT 10;"),
    ("Despesa por funcao — media mensal (R$ mi)",
     "SELECT f.nome, ROUND(AVG(d.valor)/1e6,0) media_mes_mi "
     "FROM despesa_funcao d JOIN funcao_despesa f USING (cod_funcao) "
     "GROUP BY f.nome ORDER BY media_mes_mi DESC;"),
]


def main() -> int:
    for nome in ("ddl.sql", "dml_carga_inicial.sql"):
        if not (BANCO_DIR / nome).exists():
            print(f"ERRO: {nome} nao encontrado. Rode: python scripts/banco/gerar_dml.py")
            return 1

    DB.parent.mkdir(exist_ok=True)
    if DB.exists():
        DB.unlink()

    con = sqlite3.connect(DB)
    con.execute("PRAGMA foreign_keys = ON")

    print(f"1/3 executando ddl.sql ...")
    con.executescript((BANCO_DIR / "ddl.sql").read_text(encoding="utf-8"))

    print(f"2/3 executando dml_carga_inicial.sql ...")
    try:
        con.executescript((BANCO_DIR / "dml_carga_inicial.sql").read_text(encoding="utf-8"))
    except sqlite3.IntegrityError as e:
        print(f"ERRO de integridade na carga: {e}")
        con.close()
        return 1

    print("3/3 verificando integridade ...")
    fk = con.execute("PRAGMA foreign_key_check").fetchall()
    if fk:
        print(f"ERRO: {len(fk)} violacoes de chave estrangeira: {fk[:5]}")
        con.close()
        return 1

    total = 0
    for t in TABELAS:
        n = con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
        total += n
        print(f"   {t:28s} {n:>6} linhas")
    print(f"   {'TOTAL':28s} {total:>6} linhas")

    for titulo, sql in CONSULTAS:
        print(f"\n-- {titulo}")
        cur = con.execute(sql)
        cols = [d[0] for d in cur.description]
        print("   " + " | ".join(cols))
        for row in cur.fetchall():
            print("   " + " | ".join(str(v) for v in row))

    con.close()
    print(f"\nOK: {DB.relative_to(BASE)} criado ({DB.stat().st_size / 1e6:.1f} MB).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
