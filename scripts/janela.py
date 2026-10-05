"""Janela rolante de dados: uma decada completa ate o ano corrente.

Regra: INI = ano_atual - 10, FIM = ano_atual.
Ex.: em 2026 -> 2016..2026; em 2027 -> 2017..2027.
O cron semanal (atualizar-dados.yml) reposiciona sozinho, sem editar codigo.

Uso:
  from janela import ANO_INI, ANO_FIM, ANOS
  python scripts/janela.py   # imprime "2016 2017 ... 2026"
"""
from __future__ import annotations
from datetime import date

ATRAS = 10


def janela(atras: int = ATRAS) -> list[int]:
    fim = date.today().year
    return list(range(fim - atras, fim + 1))


ANO_FIM = date.today().year
ANO_INI = ANO_FIM - ATRAS
ANOS = list(range(ANO_INI, ANO_FIM + 1))

MES_INI = f"{ANO_INI}-01-01"   # filtro >= (serie mensal)
MES_FIM = f"{ANO_FIM}-12-01"   # filtro <= (teto do ano corrente)

if __name__ == "__main__":
    print(" ".join(map(str, ANOS)))
