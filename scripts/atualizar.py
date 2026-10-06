"""Atualiza tudo em um comando: RTN + SIOP mais recentes -> reprocessa -> re-exporta JSONs.
Uso:  python scripts/atualizar.py   (rode a partir da raiz do projeto)
"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))
from coleta import coleta_rtn
from janela import ANOS

print("=== 1/9 baixando RTN mais recente ===")
coleta_rtn()
print("=== 2/9 reprocessando serie historica (RTN) ===")
subprocess.run([sys.executable, str(SCRIPTS / "processa_rtn.py")], check=True, cwd=ROOT)
print("=== 3/9 coletando orgaos SIOP (todos os Poderes) ===")
subprocess.run([sys.executable, str(SCRIPTS / "coleta_orgaos_todos.py"),
                *[str(a) for a in ANOS]], check=True, cwd=ROOT)
print("=== 4/9 exportando JSONs p/ public/data ===")
subprocess.run([sys.executable, str(SCRIPTS / "export_json.py")], check=True, cwd=ROOT)
print("=== 5/9 Mapa de Empresas (tolerante; alimenta o passo 6) ===")
r = subprocess.run([sys.executable, str(SCRIPTS / "coleta_mapa_empresas.py")], cwd=ROOT)
if r.returncode != 0:
    print("AVISO: Mapa de Empresas falhou; mantido manual anterior.")
print("=== 6/9 coletando conjuntura (BCB+Serasa; tolerante a falhas) ===")
r = subprocess.run([sys.executable, str(SCRIPTS / "coleta_conjuntura.py")], cwd=ROOT)
if r.returncode != 0:
    print("AVISO: conjuntura falhou; front usa ultima coleta valida.")
print("=== 7/9 UFs via SICONFI (tolerante; SP+RJ+MG+RS+PR) ===")
for _uf in ("sp", "rj", "mg", "rs", "pr"):
    r = subprocess.run([sys.executable, str(SCRIPTS / "coleta_siconfi.py"),
                        "--uf", _uf], cwd=ROOT)
    if r.returncode != 0:
        print(f"AVISO: SICONFI/{_uf} falhou; mantidos JSONs anteriores.")
print("=== 8/9 emendas do ano corrente via SIOP (tolerante) ===")
r = subprocess.run([sys.executable, str(SCRIPTS / "coleta_emendas.py"),
                    str(__import__("datetime").date.today().year)], cwd=ROOT)
if r.returncode != 0:
    print("AVISO: emendas falharam; mantido JSON anterior.")
print("=== 9/9 validando JSONs do frontend ===")
subprocess.run([sys.executable, str(SCRIPTS / "validar.py")], check=True, cwd=ROOT)
print("OK: dados atualizados. Rode o app (rodar.bat) para ver.")
