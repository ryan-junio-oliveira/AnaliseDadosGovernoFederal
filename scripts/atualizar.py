"""Atualiza tudo em um comando: RTN + SIOP mais recentes -> reprocessa -> re-exporta JSONs.
Uso:  python scripts/atualizar.py   (rode a partir da raiz do projeto)

Passos 1-4 e 8 (RTN, processamento, SIOP, export, validacao) sao criticos: falham alto.
Passos 5-7 (conjuntura, UFs, emendas) sao tolerantes: mantem a ultima coleta valida e
entram no RESUMO final, para que uma falha nunca passe em silencio.
"""
import datetime
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))
sys.path.insert(0, str(SCRIPTS / "coletas"))
from coleta import coleta_rtn
from janela import ANOS

COLETAS = SCRIPTS / "coletas"
PROC = SCRIPTS / "processamento"

TOTAL = 8
_falhas = []


def _passo(n, rotulo):
    print(f"=== {n}/{TOTAL} {rotulo} ===", flush=True)


def _resumo():
    if _falhas:
        print()
        print("RESUMO: etapas que falharam (mantida a ultima versao valida):")
        for rotulo, dica in _falhas:
            print(f"  - {rotulo}: {dica}")
        print("Rode scripts/atualizar.py de novo para tentar novamente.")


def critico(rotulo, script):
    """Subprocesso critico: codigo de saida != 0 aborta com mensagem clara (sem traceback)."""
    r = subprocess.run([sys.executable, str(script)], cwd=ROOT)
    if r.returncode != 0:
        print(f"ERRO: {rotulo} falhou (codigo {r.returncode}); abortando.")
        _resumo()
        sys.exit(1)


def tolerante(rotulo, dica, *cmd):
    """Subprocesso tolerante: falha vira AVISO + registro no RESUMO final."""
    r = subprocess.run([sys.executable, *[str(c) for c in cmd]], cwd=ROOT)
    if r.returncode != 0:
        _falhas.append((rotulo, dica))
        print(f"AVISO: {rotulo} falhou; {dica}")
    return r.returncode == 0


_passo(1, "baixando RTN mais recente")
try:
    coleta_rtn()
except Exception as exc:  # erro de rede/parsing na fonte da Uniao
    print(f"ERRO: coleta do RTN falhou ({exc.__class__.__name__}: {exc}); abortando.")
    _resumo()
    sys.exit(1)

_passo(2, "reprocessando serie historica (RTN)")
critico("processamento do RTN", PROC / "processa_rtn.py")

_passo(3, "coletando orgaos SIOP (todos os Poderes)")
r = subprocess.run([sys.executable, str(COLETAS / "coleta_orgaos_todos.py"),
                    *[str(a) for a in ANOS]], cwd=ROOT)
if r.returncode != 0:
    print("ERRO: coleta do SIOP falhou; abortando (sem ela a exportacao fica incompleta).")
    _resumo()
    sys.exit(1)

_passo(4, "exportando JSONs p/ public/data")
critico("exportacao dos JSONs", PROC / "export_json.py")

_passo(5, "coletando conjuntura (BCB; tolerante a falhas)")
tolerante("conjuntura", "o front usa a ultima coleta valida.",
          COLETAS / "coleta_conjuntura.py")

_passo(6, "UFs via SICONFI (tolerante; SP+RJ+MG+RS+PR)")
for _uf in ("sp", "rj", "mg", "rs", "pr"):
    tolerante(f"SICONFI/{_uf}", "mantidos os JSONs anteriores da UF.",
              COLETAS / "coleta_siconfi.py", "--uf", _uf)

_passo(7, "emendas do ano corrente via SIOP (tolerante)")
tolerante("emendas", "mantido o JSON anterior.",
          COLETAS / "coleta_emendas.py", str(datetime.date.today().year))

_passo(8, "validando JSONs do frontend")
critico("validacao dos JSONs", SCRIPTS / "validar.py")

if _falhas:
    _resumo()
    print("Base validada, mas ha coletas pendentes (veja o RESUMO acima).")
else:
    print("OK: dados atualizados. Rode o app (menu.bat, opcao 4) para ver.")
